import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
from decimal import Decimal
import json
import requests

# Ajouter le répertoire parent au path Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import DataBase
from objects.player import Player
from objects.user import User
from utils.ratelimit import RateLimiter
from utils.email_service import EmailService
from objects.team import Team
from services.lol_ai_coach import LoLCoach
from services.draft_simulator import DraftSimulator, DraftSide, DraftPhase

load_dotenv()

API_KEY = os.getenv("API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config['JWT_SECRET_KEY'] = SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Debug JWT configuration
print(f"DEBUG - JWT_SECRET_KEY configured: {bool(SECRET_KEY)}")
print(f"DEBUG - SECRET_KEY length: {len(SECRET_KEY) if SECRET_KEY else 0}")

# Initialiser JWT
jwt = JWTManager(app)

# Configuration CORS pour autoriser les connexions externes
# En production, remplace "*" par une liste spécifique d'origines autorisées
CORS(app, origins="*", supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# CORS(app, origins=["http://localhost:3000"])  # Autoriser le frontend Next.js
# socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

# Initialiser le service email
email_service = EmailService()

# Stockage des sessions de draft (en mémoire)
# En production, utiliser Redis ou une base de données
draft_sessions = {}

# Helper function to convert Decimal to float in nested structures
def convert_decimals(obj):
    """Recursively convert Decimal objects to float and datetime to string"""
    from datetime import datetime, date
    
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    return obj

# ==================== UTILITY FUNCTIONS ====================

def find_or_create_player_with_pseudo_check(name, tag, API_KEY):
    """
    Fonction utilitaire pour rechercher ou créer un joueur avec vérification des changements de pseudo.
    
    :param name: Nom du joueur
    :param tag: Tag du joueur
    :param API_KEY: Clé API Riot
    :return: Tuple (player_object, player_id, db_connection)
    """
    db = DataBase(host="localhost")
    
    # Étape 1: Vérifier si le joueur existe déjà en base de données
    existing_player = None
    try:
        existing_player = db.get_player(name=name, tag=tag)
    except:
        # Le joueur n'existe pas en base, on continue
        pass
    
    if existing_player:
        # Le joueur existe en base, on récupère son PUUID et on vérifie s'il a changé de pseudo
        puuid = existing_player['puuid']
        
        # Créer un objet Player temporaire pour utiliser la méthode get_account_by_puuid
        temp_player = Player(name="", tag="", API_KEY=API_KEY)
        current_account = temp_player.get_account_by_puuid(puuid)
        
        if current_account:
            current_name = current_account['gameName']
            current_tag = current_account['tagLine']
            
            # Vérifier si le pseudo a changé
            if current_name != name or current_tag != tag:
                print(f"Pseudo changé détecté: {name}#{tag} -> {current_name}#{current_tag}")
                
                # Mettre à jour le joueur avec le nouveau pseudo et les rangs actuels
                player = Player(name=current_name, tag=current_tag, API_KEY=API_KEY)
                if player.puuid:
                    player_id = db.insert_player(
                        name=player.name, 
                        tag=player.tag, 
                        puuid=player.puuid, 
                        soloq=player.soloq, 
                        flex=player.flexq
                    )
                else:
                    # Si on ne peut pas récupérer les infos, utiliser l'ancien joueur
                    player = Player(name=name, tag=tag, API_KEY=API_KEY)
                    if not player.puuid:
                        return None, None, db
                    player_id = db.insert_player(
                        name=player.name, 
                        tag=player.tag, 
                        puuid=player.puuid, 
                        soloq=player.soloq, 
                        flex=player.flexq
                    )
            else:
                # Le pseudo n'a pas changé, utiliser les données existantes
                player = Player(name=name, tag=tag, API_KEY=API_KEY)
                if not player.puuid:
                    return None, None, db
                player_id = db.insert_player(
                    name=player.name, 
                    tag=player.tag, 
                    puuid=player.puuid, 
                    soloq=player.soloq, 
                    flex=player.flexq
                )
        else:
            # Impossible de récupérer les infos actuelles, utiliser l'ancien joueur
            player = Player(name=name, tag=tag, API_KEY=API_KEY)
            if not player.puuid:
                return None, None, db
            player_id = db.insert_player(
                name=player.name, 
                tag=player.tag, 
                puuid=player.puuid, 
                soloq=player.soloq, 
                flex=player.flexq
            )
    else:
        # Le joueur n'existe pas en base, créer un nouveau joueur
        player = Player(name=name, tag=tag, API_KEY=API_KEY)
        
        if not player.puuid:
            return None, None, db
        
        # Insérer le nouveau joueur
        player_id = db.insert_player(
            name=player.name, 
            tag=player.tag, 
            puuid=player.puuid, 
            soloq=player.soloq, 
            flex=player.flexq
        )
    
    return player, player_id, db

# ==================== API ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de l'état de l'API"""
    return jsonify({"status": "healthy", "message": "API is running"})

@app.route('/api/champions', methods=['GET'])
def get_all_champions():
    """Récupérer tous les champions disponibles"""
    try:
        db = DataBase(host="localhost")
        champions = db.get_all_champion()
        db.close()
        
        # Convert Decimals to floats
        champions = convert_decimals(champions)
        
        return jsonify({"champions": champions}), 200
        
    except Exception as e:
        print(f"ERROR in get_all_champions: {str(e)}")
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

# ==================== PLAYER ID ROUTE ====================

@app.route('/api/player-id', methods=['POST'])
def get_player_id():
    """Récupérer l'ID d'un joueur par son nom et tag"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        tag = data.get('tag', '').strip()
        
        if not name or not tag:
            return jsonify({"error": "Nom et tag requis"}), 400
        
        db = DataBase(host="localhost")
        player = db.get_player(name=name, tag=tag)
        
        if not player:
            return jsonify({"error": "Joueur non trouvé"}), 404
        
        return jsonify({"player_id": player['id']}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

# ==================== TEAM ROUTES ====================

@app.route('/api/teams', methods=['GET'])
@jwt_required()
def get_teams():
    """Récupérer toutes les équipes de l'utilisateur connecté"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        teams = db.get_user_teams(int(user_id))
        
        return jsonify({"teams": teams}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/teams', methods=['POST'])
@jwt_required()
def create_team():
    """Créer une nouvelle équipe"""
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "Token invalide"}), 422
        
    data = request.get_json()
    team_name = data.get('team_name', '').strip()
    players = data.get('players', [])


    if not team_name:
        return jsonify({"error": "Nom de l'équipe requis"}), 400
    
    db = DataBase(host="localhost")
    
    # Créer l'équipe
    team_id = db.insert_team(team_name, int(user_id))

    # Ajouter les joueurs à l'équipe
    for player in players:
        
        db.insert_team_player(
            team_id=team_id,
            player_id=player['player_id'],
            position=player['position'],
            is_sub=player.get('is_sub', False)
        )
    
    try:
        team = db.get_team_by_id(team_id)
        return jsonify({"team": team}), 201
    except Exception as e:
        return jsonify({"error": f"Erreur lors de la récupération de l'équipe: {str(e)}"}), 500

@app.route('/api/teams/<int:team_id>', methods=['GET'])
@jwt_required()
def get_team(team_id):
    """Récupérer une équipe spécifique"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        team = db.get_team_by_id(team_id)
        
        if not team:
            return jsonify({"error": "Équipe non trouvée"}), 404
        
        # Vérifier que l'utilisateur est propriétaire de l'équipe
        if team['user_id'] != int(user_id):
            return jsonify({"error": "Accès non autorisé"}), 403
        
        return jsonify({"team": team}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/teams/<int:team_id>', methods=['PUT'])
@jwt_required()
def update_team(team_id):
    """Mettre à jour une équipe"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
            
        data = request.get_json()
        team_name = data.get('team_name', '').strip()
        players = data.get('players', [])
        
        if not team_name:
            return jsonify({"error": "Nom de l'équipe requis"}), 400
        
        db = DataBase(host="localhost")
        
        # Vérifier que l'équipe existe et appartient à l'utilisateur
        team = db.get_team_by_id(team_id)
        if not team:
            return jsonify({"error": "Équipe non trouvée"}), 404
        
        if team['user_id'] != int(user_id):
            return jsonify({"error": "Accès non autorisé"}), 403
        
        # Mettre à jour l'équipe
        db.update_team(team_id, team_name)
        
        # Supprimer les anciens joueurs
        db.delete_team_players(team_id)
        
        # Ajouter les nouveaux joueurs
        for player in players:
            db.insert_team_player(
                team_id=team_id,
                player_id=player['player_id'],
                position=player['position'],
                is_sub=player.get('is_sub', False)
            )
        
        # Récupérer l'équipe mise à jour
        updated_team = db.get_team_by_id(team_id)
        
        return jsonify({"team": updated_team}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
@jwt_required()
def delete_team(team_id):
    """Supprimer une équipe"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        
        # Vérifier que l'équipe existe et appartient à l'utilisateur
        team = db.get_team_by_id(team_id)
        if not team:
            return jsonify({"error": "Équipe non trouvée"}), 404
        
        if team['user_id'] != int(user_id):
            return jsonify({"error": "Accès non autorisé"}), 403
        
        # Supprimer l'équipe (les joueurs seront supprimés automatiquement par CASCADE)
        db.delete_team(team_id)
        
        return jsonify({"message": "Équipe supprimée avec succès"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/teams/<int:team_id>/details', methods=['GET'])
@jwt_required()
def get_team_details(team_id):
    """Récupérer les détails complets d'une équipe avec statistiques"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        
        # Vérifier que l'équipe existe et appartient à l'utilisateur
        team = db.get_team_by_id(team_id)
       
        if not team:
            db.close()
            return jsonify({"error": "Équipe non trouvée"}), 404

        if team['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Accès non autorisé"}), 403


        # Récupérer les joueurs avec leurs statistiques
        players = db.get_team_players_with_stats(team_id)

        # Calculer les statistiques globales de l'équipe
        total_games = 0
        total_wins = 0
        
        players_team = Team(team['team_name'], players)

        for player in players:
            if player.get('player_stats'):
                stats = player['player_stats']
                total_games += stats.get('total_games', 0)
                total_wins += stats.get('total_wins', 0)
        
        # Calculer le winrate moyen
        winrate = round((total_wins / total_games * 100), 2) if total_games > 0 else 0

        ranked_solo_avg = players_team.get_average_solo_rank()
        ranked_flex_avg = players_team.get_average_flex_rank()
        
        team_stats = {
            "total_games": total_games,
            "winrate": float(winrate) if isinstance(winrate, Decimal) else winrate,
            "ranked_solo_avg": ranked_solo_avg,
            "ranked_flex_avg": ranked_flex_avg
        }
        
        team['stats'] = team_stats
        team['players'] = players
        
        # Convert all Decimal values to float
        team = convert_decimals(team)
        
        db.close()
        return jsonify({"team": team}), 200
        
    except Exception as e:
        print(f"ERROR in get_team_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

# ==================== MATCHUP ROUTES ====================

@app.route('/api/matchups', methods=['GET'])
@jwt_required()
def get_matchups():
    """Récupérer tous les matchups de l'utilisateur connecté"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        matchups = db.get_user_matchups(int(user_id))
        
        # Filtrer les matchups invalides (avec équipes manquantes)
        valid_matchups = [m for m in matchups if m and m.get('matchup_name') and m.get('team1_name') and m.get('team2_name')]
        
        # Convert all Decimal values to float
        valid_matchups = convert_decimals(valid_matchups)
        
        db.close()
        return jsonify({"matchups": valid_matchups}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/matchups', methods=['POST'])
@jwt_required()
def create_matchup():
    """Créer un nouveau matchup"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        data = request.get_json()
        team1_id = data.get('team1_id')
        team2_id = data.get('team2_id')
        matchup_name = data.get('matchup_name', '').strip()
        scheduled_date = data.get('scheduled_date')
        status = data.get('status', 'UPCOMING')
        
        if not team1_id or not team2_id or not matchup_name:
            return jsonify({"error": "team1_id, team2_id et matchup_name sont requis"}), 400
        
        if team1_id == team2_id:
            return jsonify({"error": "Les deux équipes doivent être différentes"}), 400
        
        db = DataBase(host="localhost")
        
        # Vérifier que les deux équipes appartiennent à l'utilisateur
        team1 = db.get_team_by_id(team1_id)
        team2 = db.get_team_by_id(team2_id)
        
        if not team1 or not team2:
            db.close()
            return jsonify({"error": "Une ou plusieurs équipes non trouvées"}), 404
        
        if team1['user_id'] != int(user_id) or team2['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Vous ne pouvez créer un matchup qu'avec vos propres équipes"}), 403
        
        # Créer le matchup
        matchup_id = db.create_matchup(
            user_id=int(user_id),
            team1_id=team1_id,
            team2_id=team2_id,
            matchup_name=matchup_name,
            scheduled_date=scheduled_date,
            status=status
        )
        
        # Récupérer le matchup créé
        matchup = db.get_matchup_by_id(matchup_id)
        matchup = convert_decimals(matchup)
        
        db.close()
        return jsonify({"matchup": matchup}), 201
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/matchups/<int:matchup_id>', methods=['GET'])
@jwt_required()
def get_matchup(matchup_id):
    """Récupérer un matchup par son ID"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        matchup = db.get_matchup_by_id(matchup_id)
        
        if not matchup:
            db.close()
            return jsonify({"error": "Matchup non trouvé"}), 404
        
        if matchup['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Accès non autorisé"}), 403
        
        matchup = convert_decimals(matchup)
        
        db.close()
        return jsonify({"matchup": matchup}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/matchups/<int:matchup_id>/details', methods=['GET'])
@jwt_required()
def get_matchup_details(matchup_id):
    """Récupérer les détails complets d'un matchup avec les équipes et joueurs"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        matchup = db.get_matchup_by_id(matchup_id)
        
        if not matchup:
            db.close()
            return jsonify({"error": "Matchup non trouvé"}), 404
        
        if matchup['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Accès non autorisé"}), 403
        
        # Récupérer les détails des deux équipes
        team1 = db.get_team_by_id(matchup['team1_id'])
        team2 = db.get_team_by_id(matchup['team2_id'])
        
        # Récupérer les joueurs avec leurs stats pour chaque équipe
        team1_players = db.get_team_players_with_stats(matchup['team1_id'])
        team2_players = db.get_team_players_with_stats(matchup['team2_id'])
        
        # Calculer les stats des équipes
        def calculate_team_stats(players):
            total_games = 0
            total_wins = 0
            
            players_team = Team("temp", players)
            
            for player in players:
                if player.get('player_stats'):
                    stats = player['player_stats']
                    total_games += stats.get('total_games', 0)
                    total_wins += stats.get('total_wins', 0)
            
            winrate = round((total_wins / total_games * 100), 2) if total_games > 0 else 0
            ranked_solo_avg = players_team.get_average_solo_rank()
            ranked_flex_avg = players_team.get_average_flex_rank()
            
            return {
                "total_games": total_games,
                "winrate": float(winrate) if isinstance(winrate, Decimal) else winrate,
                "ranked_solo_avg": ranked_solo_avg,
                "ranked_flex_avg": ranked_flex_avg
            }
        
        team1['stats'] = calculate_team_stats(team1_players)
        team1['players'] = team1_players
        
        team2['stats'] = calculate_team_stats(team2_players)
        team2['players'] = team2_players
        
        matchup['team1'] = team1
        matchup['team2'] = team2
        
        # Convert all Decimal values to float
        matchup = convert_decimals(matchup)
        
        db.close()
        return jsonify({"matchup": matchup}), 200
        
    except Exception as e:
        print(f"ERROR in get_matchup_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/matchups/<int:matchup_id>', methods=['PUT'])
@jwt_required()
def update_matchup(matchup_id):
    """Mettre à jour un matchup"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        
        # Vérifier que le matchup existe et appartient à l'utilisateur
        matchup = db.get_matchup_by_id(matchup_id)
        if not matchup:
            db.close()
            return jsonify({"error": "Matchup non trouvé"}), 404
        
        if matchup['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Accès non autorisé"}), 403
        
        data = request.get_json()
        matchup_name = data.get('matchup_name')
        scheduled_date = data.get('scheduled_date')
        status = data.get('status')
        
        # Mettre à jour le matchup
        db.update_matchup(
            matchup_id=matchup_id,
            matchup_name=matchup_name,
            scheduled_date=scheduled_date,
            status=status
        )
        
        # Récupérer le matchup mis à jour
        updated_matchup = db.get_matchup_by_id(matchup_id)
        updated_matchup = convert_decimals(updated_matchup)
        
        db.close()
        return jsonify({"matchup": updated_matchup}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/matchups/<int:matchup_id>', methods=['DELETE'])
@jwt_required()
def delete_matchup(matchup_id):
    """Supprimer un matchup"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        db = DataBase(host="localhost")
        
        # Vérifier que le matchup existe et appartient à l'utilisateur
        matchup = db.get_matchup_by_id(matchup_id)
        if not matchup:
            db.close()
            return jsonify({"error": "Matchup non trouvé"}), 404
        
        if matchup['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Accès non autorisé"}), 403
        
        # Supprimer le matchup
        db.delete_matchup(matchup_id)
        
        db.close()
        return jsonify({"message": "Matchup supprimé avec succès"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/player/details', methods=['POST'])
@jwt_required()
def get_player_details():
    """Récupérer les détails complets d'un joueur"""
    pass

    # try:
    #     data = request.get_json()
    #     username = data.get('username')
        
    #     if not username or '#' not in username:
    #         return jsonify({"error": "Nom d'utilisateur et tag requis"}), 400
        
    #     name, tag = username.split('#', 1)
        
    #     db = DataBase(host="localhost")
    #     player_data = db.get_player(name=name, tag=tag)
        
    #     if not player_data:
    #         return jsonify({"error": "Joueur non trouvé"}), 404
        
    #     # Récupérer les statistiques détaillées du joueur
    #     player_stats = db.get_player_detailed_stats(player_data['id'])
        
    #     # Récupérer les champions joués
    #     champions = db.get_player_champions(player_data['id'])
        
    #     # Récupérer les parties récentes
    #     recent_games = db.get_player_recent_games(player_data['id'], limit=10)
        
    #     detailed_stats = {
    #         **player_stats,
    #         "champions": champions,
    #         "recent_games": recent_games
    #     }
        
    #     return jsonify({"stats": detailed_stats}), 200
        
    # except Exception as e:
    #     return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        email = data.get('email', '').strip() if data.get('email') else None

        # Créer l'objet utilisateur
        user = User(username=username, password=password, email=email)

        # Valider les données
        is_valid, errors = user.validate_all()
        if not is_valid:
            return jsonify({"error": "Données invalides", "details": errors}), 400

        # Connexion à la base de données
        db = DataBase(host="localhost")

        # Vérifier si le nom d'utilisateur existe déjà
        if db.check_username_exists(username):
            return jsonify({"error": "Ce nom d'utilisateur est déjà utilisé"}), 409

        # Vérifier si l'email existe déjà (si fourni)
        if email and db.check_email_exists(email):
            return jsonify({"error": "Cette adresse email est déjà utilisée"}), 409

        # Hacher le mot de passe
        success, message = user.hash_password()
        if not success:
            return jsonify({"error": message}), 500

        # Insérer l'utilisateur dans la base de données
        try:
            db.insert_user(username, user.password, email)
            
            # Envoyer un email de bienvenue si l'email est fourni
            if email:
                email_service.send_welcome_email(email, username)

            return jsonify({
                "message": "Utilisateur créé avec succès",
                "user": {
                    "username": username,
                    "email": email
                }
            }), 201

        except Exception as e:
            return jsonify({"error": f"Erreur lors de la création de l'utilisateur: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({"error": "Nom d'utilisateur et mot de passe requis"}), 400

        # Connexion à la base de données
        db = DataBase(host="localhost")

        # Récupérer l'utilisateur
        user_data = db.get_user_by_username(username)
        if not user_data:
            return jsonify({"error": "Nom d'utilisateur ou mot de passe incorrect"}), 401

        # Créer l'objet utilisateur pour vérifier le mot de passe
        user = User(
            user_id=user_data['id'],
            username=user_data['username'],
            password=user_data['password_hash'],
            email=user_data['email']
        )

        # Vérifier le mot de passe
        if not user.verify_password(password):
            return jsonify({"error": "Nom d'utilisateur ou mot de passe incorrect"}), 401

        # Mettre à jour la dernière connexion
        db.update_user_last_login(user_data['id'])

        # Créer le token JWT
        user_id = user_data['id']
        print(f"DEBUG - Creating JWT token for user_id: {user_id} (type: {type(user_id)})")
        access_token = create_access_token(identity=str(user_id))
        print(f"DEBUG - Generated token: {access_token}")

        return jsonify({
            "message": "Connexion réussie",
            "access_token": access_token,
            "user": {
                "id": user_data['id'],
                "username": user_data['username'],
                "email": user_data['email'],
                "last_login": user_data['last_login']
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Récupérer les informations de l'utilisateur connecté"""
    # Debug headers
    auth_header = request.headers.get('Authorization')
    print(f"DEBUG - Authorization header: {auth_header}")
    
    user_id = get_jwt_identity()
    print(f"DEBUG - get_jwt_identity() returned: {user_id} (type: {type(user_id)})")
    
    if not user_id:
        print("DEBUG - No user_id from JWT")
        return jsonify({"error": "Token invalide - pas d'ID utilisateur"}), 422
    
    # Convertir l'ID utilisateur en entier pour la base de données
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        print("DEBUG - Invalid user_id format")
        return jsonify({"error": "Token invalide - format d'ID utilisateur incorrect"}), 422
        
    db = DataBase(host="localhost")
    user_data = db.get_user_by_id(user_id_int)
    print(f"DEBUG - User data from DB: {user_data}")
    
    if not user_data:
        print("DEBUG - User not found in database")
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    return jsonify({
        "user": {
            "id": user_data['id'],
            "username": user_data['username'],
            "email": user_data['email'],
            "created_at": user_data['created_at'],
            "last_login": user_data['last_login']
        }
    }), 200


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Demande de réinitialisation de mot de passe"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()

        if not email:
            return jsonify({"error": "Adresse email requise"}), 400

        # Connexion à la base de données
        db = DataBase(host="localhost")

        # Vérifier si l'email existe
        user_data = db.get_user_by_email(email)
        if not user_data:
            # Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
            return jsonify({"message": "Si cette adresse email est enregistrée, vous recevrez un email de réinitialisation"}), 200

        # Générer un token de réinitialisation
        reset_token = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(hours=24)

        # Supprimer les anciens tokens pour cet utilisateur
        db.cleanup_expired_tokens()

        # Insérer le nouveau token
        try:
            db.insert_password_reset_token(user_data['id'], reset_token, expires_at)
        except Exception as e:
            return jsonify({"error": f"Erreur lors de la création du token: {str(e)}"}), 500

        # Envoyer l'email de réinitialisation
        success, message = email_service.send_password_reset_email(
            email, user_data['username'], reset_token
        )

        if not success:
            return jsonify({"error": f"Erreur lors de l'envoi de l'email: {message}"}), 500

        return jsonify({"message": "Si cette adresse email est enregistrée, vous recevrez un email de réinitialisation"}), 200

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Réinitialisation du mot de passe avec token"""
    try:
        data = request.get_json()
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '')

        if not token or not new_password:
            return jsonify({"error": "Token et nouveau mot de passe requis"}), 400

        # Connexion à la base de données
        db = DataBase(host="localhost")

        # Vérifier le token
        token_data = db.get_password_reset_token(token)
        if not token_data:
            return jsonify({"error": "Token invalide ou expiré"}), 400

        # Créer l'objet utilisateur pour valider le nouveau mot de passe
        user = User(password=new_password)
        is_valid, errors = user.validate_password()
        if not is_valid:
            return jsonify({"error": "Mot de passe invalide", "details": errors}), 400

        # Hacher le nouveau mot de passe
        success, message = user.hash_password()
        if not success:
            return jsonify({"error": message}), 500

        # Mettre à jour le mot de passe
        try:
            db.update_user_password(token_data['user_id'], user.password)
            # Supprimer le token utilisé
            db.delete_password_reset_token(token)
        except Exception as e:
            return jsonify({"error": f"Erreur lors de la mise à jour du mot de passe: {str(e)}"}), 500

        return jsonify({"message": "Mot de passe réinitialisé avec succès"}), 200

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Récupérer le classement des meilleurs joueurs"""
    try:
        limit = request.args.get('limit', 50, type=int)
        
        # Limiter à 100 joueurs maximum
        if limit > 100:
            limit = 100
        
        db = DataBase(host="localhost")
        leaderboard = db.get_top_players_by_score(limit=limit)
        
        # Convert all Decimal values to float
        leaderboard = convert_decimals(leaderboard)
        
        db.close()
        return jsonify({"leaderboard": leaderboard}), 200
        
    except Exception as e:
        print(f"ERROR in get_leaderboard: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/import-opgg', methods=['POST'])
@jwt_required()
def import_from_opgg():
    """Importe une équipe depuis un lien OP.GG multi-search"""
    try:
        from urllib.parse import urlparse, parse_qs, unquote
        
        data = request.get_json()
        opgg_url = data.get('opgg_url', '').strip()
        
        if not opgg_url:
            return jsonify({"error": "URL OP.GG requise"}), 400
        
        # Parser l'URL OP.GG
        parsed_url = urlparse(opgg_url)
        query_params = parse_qs(parsed_url.query)
        
        summoners_param = query_params.get('summoners', [])
        if not summoners_param:
            return jsonify({"error": "Aucun joueur trouvé dans l'URL"}), 400
        
        # Décoder et séparer les noms de joueurs
        summoners_str = unquote(summoners_param[0])
        player_names = [s.strip() for s in summoners_str.split(',') if s.strip()]
        
        if len(player_names) > 5:
            return jsonify({"error": "Maximum 5 joueurs autorisés"}), 400
        
        # Positions par défaut dans l'ordre
        positions = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
        
        db = DataBase(host="localhost")
        all_champions = db.get_all_champion()
        players_data = []
        errors = []
        
        for idx, player_name in enumerate(player_names):
            try:
                if '#' not in player_name:
                    errors.append(f"{player_name}: Format invalide (attendu: nom#tag)")
                    continue
                
                name, tag = player_name.split('#', 1)
                player = Player(name=name, tag=tag, API_KEY=API_KEY)
                
                if not player.puuid:
                    errors.append(f"{player_name}: Joueur non trouvé sur EUW")
                    continue
                
                # Insérer ou mettre à jour le joueur
                player_id = db.insert_player(
                    name=player.name, 
                    tag=player.tag, 
                    puuid=player.puuid, 
                    soloq=player.soloq, 
                    flex=player.flexq
                )
                
                players_data.append({
                    'id': player_id,
                    'name': player.name,
                    'tag': player.tag,
                    'soloq': player.soloq,
                    'flexq': player.flexq,
                    'position': positions[idx] if idx < len(positions) else 'SUB'
                })
                
            except Exception as e:
                errors.append(f"{player_name}: {str(e)}")
        
        db.close()
        
        return jsonify({
            "players": players_data,
            "errors": errors,
            "success": len(players_data) > 0
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/search', methods=['POST'])
def search_player():
    """Recherche d'un joueur par nom et tag avec gestion des changements de pseudo"""
    try:
        data = request.get_json()
        username = data.get('username')
        
        if not username or '#' not in username:
            return jsonify({"error": "Please provide a username and a tag!"}), 400
        
        name, tag = username.split('#', 1)
        
        # Utiliser la fonction utilitaire pour gérer la recherche intelligente
        player, player_id, db = find_or_create_player_with_pseudo_check(name, tag, API_KEY)
        
        if not player or not player_id:
            db.close()
            return jsonify({"error": "This player does not exist in EUW server!"}), 404
        
        all_champions = db.get_all_champion()
        
        # Récupérer les jeux existants
        filters = {"player_id": player_id}
        games = db.get_games(**filters)
        
        if games:
            for game in games:
                player.build_stats(game)
            player.get_all_stats(["all"])
        
        # Préparer la réponse
        response = {
            "player": {
                "id": player_id,
                "name": player.name,
                "tag": player.tag,
                "soloq": player.soloq,
                "flexq": player.flexq,
                "global_kda": player.global_kda,
                "global_kill": player.global_kill,
                "global_death": player.global_death,
                "global_assists": player.global_assists,
                "global_kp": player.global_kp,
                "global_winrate": player.global_winrate,
                "nb_game": player.nb_game,
                "nb_win": player.nb_win,
                "nb_lose": player.nb_lose,
                "score_moyen": player.score_moyen,
                "role": player.role
            },
            "champions": [
                {
                    "nom": champ.nom,
                    "nombre_de_parties": champ.nombre_de_parties,
                    "nombre_win": champ.nombre_win,
                    "nombre_lose": champ.nombre_lose,
                    "winrate": champ.winrate,
                    "kill": champ.kill,
                    "death": champ.death,
                    "assit": champ.assit,
                    "dangerousness": champ.dangerousness,
                    "kda": champ.get_kda(),
                    "kill_participation": champ.get_kill_participation()
                }
                for champ in player.champions
            ],
            "all_champions": all_champions
        }
        
        db.close()
        return jsonify(response)
        
    except Exception as e:
        print(f"ERROR in search_player: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/filter', methods=['POST'])
def filter_games():
    """Filtrage des jeux d'un joueur avec gestion des changements de pseudo"""
    try:
        data = request.get_json()
        username = data.get('username')
        role = data.get('role', ['all'])
        champion = data.get('champion', ['all'])
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        match_types = data.get('match_types', ['all'])
        seasons = data.get('seasons', ['all'])
        
        if not username or '#' not in username:
            return jsonify({"error": "Please provide a username and a tag!"}), 400
        
        name, tag = username.split('#', 1)
        
        # Utiliser la fonction utilitaire pour gérer la recherche intelligente
        player, player_id, db = find_or_create_player_with_pseudo_check(name, tag, API_KEY)
        
        if not player or not player_id:
            db.close()
            return jsonify({"error": "This player does not exist in EUW server!"}), 404
        
        all_champions = db.get_all_champion()
        
        if "all" in match_types:
            match_types = ["soloq", "flex", "normal", "tourney"]
        
        filters = {"player_id": player_id}
        
        if "all" not in role and role:
            filters["role_"] = role
        if "all" not in champion and champion:
            filters["champion"] = champion
        if match_types:
            filters["type_game"] = match_types
        if "all" not in seasons and seasons:
            # Convertir les saisons en entiers
            season_ints = [int(s) for s in seasons if s.isdigit()]
            if season_ints:
                filters["season"] = season_ints
        if start_date and end_date:
            filters["date_range"] = [start_date, end_date]
        
        games = db.get_games(**filters)
        if games:
            for game in games:
                player.build_stats(game)
            player.get_all_stats(role)
        
        # Préparer la réponse
        response = {
            "player": {
                "name": player.name,
                "tag": player.tag,
                "soloq": player.soloq,
                "flexq": player.flexq,
                "global_kda": player.global_kda,
                "global_kill": player.global_kill,
                "global_death": player.global_death,
                "global_assists": player.global_assists,
                "global_kp": player.global_kp,
                "global_winrate": player.global_winrate,
                "nb_game": player.nb_game,
                "nb_win": player.nb_win,
                "nb_lose": player.nb_lose,
                "score_moyen": player.score_moyen,
                "role": player.role
            },
            "champions": [
                {
                    "nom": champ.nom,
                    "nombre_de_parties": champ.nombre_de_parties,
                    "nombre_win": champ.nombre_win,
                    "nombre_lose": champ.nombre_lose,
                    "winrate": champ.winrate,
                    "kill": champ.kill,
                    "death": champ.death,
                    "assit": champ.assit,
                    "dangerousness": champ.dangerousness,
                    "kda": champ.get_kda(),
                    "kill_participation": champ.get_kill_participation()
                }
                for champ in player.champions
            ],
            "all_champions": all_champions
        }
        
        db.close()
        return jsonify(response)
        
    except Exception as e:
        print(f"ERROR in filter_games: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/download', methods=['POST'])
def download_games():
    """Téléchargement de nouveaux jeux pour un joueur"""
    try:
        data = request.get_json()
        username = data.get('username')
        nb_games = data.get('nb_games', 1)
        session_id = data.get('session_id', str(uuid.uuid4()))
        start_time = data.get('startTime')  # Optional: epoch timestamp in seconds
        end_time = data.get('endTime')      # Optional: epoch timestamp in seconds
        
        print(start_time, end_time)

        if not username or '#' not in username:
            return jsonify({"error": "Please provide a username and a tag!"}), 400
        
        # Démarrer le téléchargement en arrière-plan
        socketio.start_background_task(
            target=process_download, 
            username=username, 
            nb_games=nb_games, 
            session_id=session_id,
            start_time=start_time,
            end_time=end_time
        )
        
        return jsonify({"status": "started", "session_id": session_id})
        
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# ==================== WEBSOCKET EVENTS ====================

@socketio.on('join')
def on_join(data):
    session_id = data.get('session_id')
    if session_id:
        join_room(session_id)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def process_download(username, nb_games, session_id, start_time=None, end_time=None):
    """Traitement du téléchargement des jeux en arrière-plan avec gestion des changements de pseudo"""
    try:
        name, tag = username.split('#', 1)
        
        # Utiliser la fonction utilitaire pour gérer la recherche intelligente
        player, player_id, db = find_or_create_player_with_pseudo_check(name, tag, API_KEY)
        
        if not player or not player_id:
            socketio.emit('download_error', {'error': 'This player does not exist in EUW server!'}, room=session_id)
            db.close()
            return
        
        match_dict = {
            "soloq": 420,
            "flex": 440,
        }

        print(start_time, end_time)
        
        soloq_matchs = player.get_matchs_history(start_time=start_time, end_time=end_time, match_type=match_dict["soloq"], count=nb_games)
        flex_matchs = player.get_matchs_history(start_time=start_time, end_time=end_time, match_type=match_dict["flex"], count=nb_games)
        normal_matchs = player.get_matchs_history(start_time=start_time, end_time=end_time, match_type="normal", count=nb_games)
        tournament_matchs = player.get_matchs_history(start_time=start_time, end_time=end_time, match_type="tourney", count=nb_games)
        
        all_matchs = [soloq_matchs, flex_matchs, normal_matchs, tournament_matchs]
        total_games = sum(len(m) for m in all_matchs)
        print(total_games)
        
        rate_limiter = RateLimiter()
        games_processed = 0
        
        for index, matchs in enumerate(all_matchs):
            for match_id in matchs:
                try:
                    # Attendre un slot avant la requête
                    rate_limiter.wait_for_slot()
                    
                    # Récupérer les informations du match
                    game = player.get_match_info(match_id)
                    
                    games_processed += 1
                    progress = round(games_processed / total_games * 100)
                    socketio.emit('progress', {'progress': progress}, room=session_id)
                    socketio.sleep(0)
                    
                    if game is None:
                        continue
                    
                    match_type = ["soloq", "flex", "normal", "tourney"][index]
                    champion_id = db.get_champion(game["Champion"])["id"]
                    player.add_data_to_db(db, player_id=player_id, champion_id=champion_id, game=game, type_game=match_type)
                    
                except Exception as e:
                    print(f"Erreur lors du traitement du match {match_id}: {e}")
                    # Continuer avec le match suivant même en cas d'erreur
                    games_processed += 1
                    progress = round(games_processed / total_games * 100)
                    socketio.emit('progress', {'progress': progress}, room=session_id)
                    continue
        
        socketio.emit('download_complete', {'username': username}, room=session_id)
        socketio.sleep(0)
        
    except Exception as e:
        socketio.emit('download_error', {'error': str(e)}, room=session_id)

# ==================== AI ANALYSIS ROUTES ====================

@app.route('/api/matchups/<int:matchup_id>/ai-analysis/player', methods=['POST'])
@jwt_required()
def analyze_player_matchup(matchup_id):
    """Analyse IA d'un matchup entre deux joueurs d'une position spécifique"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        data = request.get_json()
        position = data.get('position')
        
        if not position or position not in ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']:
            return jsonify({"error": "Position invalide"}), 400
        
        db = DataBase(host="localhost")
        
        # Vérifier que le matchup appartient à l'utilisateur
        matchup = db.get_matchup_by_id(matchup_id)
        if not matchup or matchup['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Matchup non trouvé ou accès non autorisé"}), 403
        
        # Récupérer les joueurs des deux équipes pour la position donnée
        team1_players = db.get_team_players_with_stats(matchup['team1_id'])
        team2_players = db.get_team_players_with_stats(matchup['team2_id'])
        
        player1 = next((p for p in team1_players if p['position'] == position and not p.get('is_sub')), None)
        player2 = next((p for p in team2_players if p['position'] == position and not p.get('is_sub')), None)
        
        if not player1 or not player2:
            db.close()
            return jsonify({"error": f"Joueurs non trouvés pour la position {position}"}), 404
        
        # Préparer les données pour l'IA
        def prepare_player_data(player):
            stats = player.get('player_stats', {})
            return {
                'name': player.get('player_name'),
                'tag': player.get('player_tag'),
                'ranked_solo': stats.get('ranked_solo', 'Non classé'),
                'ranked_flex': stats.get('ranked_flex', 'Non classé'),
                'total_games': stats.get('total_games', 0),
                'winrate': stats.get('winrate', 0),
                'kda': stats.get('kda', 0),
                'top_champions': player.get('top_champions', [])
            }
        
        player1_data = prepare_player_data(player1)
        player2_data = prepare_player_data(player2)
        
        db.close()
        
        # Appeler l'IA pour l'analyse
        try:
            coach = LoLCoach()
            analysis = coach.analyze_player_matchup(player1_data, player2_data, position)
            
            return jsonify({
                "analysis": analysis,
                "position": position,
                "player1": f"{player1_data['name']}#{player1_data['tag']}",
                "player2": f"{player2_data['name']}#{player2_data['tag']}"
            }), 200
            
        except requests.exceptions.ConnectionError:
            return jsonify({"error": "Le service IA n'est pas disponible. Assurez-vous que Ollama est en cours d'exécution."}), 503
        except Exception as e:
            return jsonify({"error": f"Erreur lors de l'analyse IA: {str(e)}"}), 500
        
    except Exception as e:
        print(f"ERROR in analyze_player_matchup: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/matchups/<int:matchup_id>/ai-analysis/team', methods=['POST'])
@jwt_required()
def analyze_team_draft(matchup_id):
    """Analyse IA complète d'une équipe et recommandations de draft"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        data = request.get_json()
        target_team = data.get('target_team', 1)  # 1 ou 2
        
        if target_team not in [1, 2]:
            return jsonify({"error": "target_team doit être 1 ou 2"}), 400
        
        db = DataBase(host="localhost")
        
        # Vérifier que le matchup appartient à l'utilisateur
        matchup = db.get_matchup_by_id(matchup_id)
        if not matchup or matchup['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Matchup non trouvé ou accès non autorisé"}), 403
        
        # Récupérer les détails des deux équipes
        team1 = db.get_team_by_id(matchup['team1_id'])
        team2 = db.get_team_by_id(matchup['team2_id'])
        
        team1_players = db.get_team_players_with_stats(matchup['team1_id'])
        team2_players = db.get_team_players_with_stats(matchup['team2_id'])
        
        # Calculer les stats des équipes
        def calculate_team_stats(players):
            total_games = 0
            total_wins = 0
            
            players_team = Team("temp", players)
            
            for player in players:
                if player.get('player_stats'):
                    stats = player['player_stats']
                    total_games += stats.get('total_games', 0)
                    total_wins += stats.get('total_wins', 0)
            
            winrate = round((total_wins / total_games * 100), 2) if total_games > 0 else 0
            ranked_solo_avg = players_team.get_average_solo_rank()
            ranked_flex_avg = players_team.get_average_flex_rank()
            
            return {
                "total_games": total_games,
                "winrate": float(winrate) if isinstance(winrate, Decimal) else winrate,
                "ranked_solo_avg": ranked_solo_avg,
                "ranked_flex_avg": ranked_flex_avg
            }
        
        team1_data = {
            'team_name': team1['team_name'],
            'stats': calculate_team_stats(team1_players),
            'players': team1_players
        }
        
        team2_data = {
            'team_name': team2['team_name'],
            'stats': calculate_team_stats(team2_players),
            'players': team2_players
        }
        
        db.close()
        
        # Appeler l'IA pour l'analyse
        try:
            coach = LoLCoach()
            analysis = coach.analyze_team_draft(team1_data, team2_data, target_team)
            
            target_team_name = team1_data['team_name'] if target_team == 1 else team2_data['team_name']
            
            return jsonify({
                "analysis": analysis,
                "target_team": target_team,
                "target_team_name": target_team_name
            }), 200
            
        except requests.exceptions.ConnectionError:
            return jsonify({"error": "Le service IA n'est pas disponible. Assurez-vous que Ollama est en cours d'exécution."}), 503
        except Exception as e:
            return jsonify({"error": f"Erreur lors de l'analyse IA: {str(e)}"}), 500
        
    except Exception as e:
        print(f"ERROR in analyze_team_draft: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

# ==================== DRAFT SIMULATION ROUTES ====================

@app.route('/api/matchups/<int:matchup_id>/draft/start', methods=['POST'])
@jwt_required()
def start_draft_simulation(matchup_id):
    """Démarre une nouvelle simulation de draft"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        data = request.get_json()
        player_side = data.get('player_side')  # "BLUE" ou "RED"
        player_team = data.get('player_team')  # 1 ou 2
        
        if player_side not in ["BLUE", "RED"]:
            return jsonify({"error": "player_side doit être BLUE ou RED"}), 400
        
        if player_team not in [1, 2]:
            return jsonify({"error": "player_team doit être 1 ou 2"}), 400
        
        db = DataBase(host="localhost")
        
        # Vérifier que le matchup appartient à l'utilisateur
        matchup = db.get_matchup_by_id(matchup_id)
        if not matchup or matchup['user_id'] != int(user_id):
            db.close()
            return jsonify({"error": "Matchup non trouvé ou accès non autorisé"}), 403
        
        # Récupérer les détails des deux équipes
        team1 = db.get_team_by_id(matchup['team1_id'])
        team2 = db.get_team_by_id(matchup['team2_id'])
        
        team1_players = db.get_team_players_with_stats(matchup['team1_id'])
        team2_players = db.get_team_players_with_stats(matchup['team2_id'])
        
        # Calculer les stats des équipes
        def calculate_team_stats(players):
            total_games = 0
            total_wins = 0
            
            players_team = Team("temp", players)
            
            for player in players:
                if player.get('player_stats'):
                    stats = player['player_stats']
                    total_games += stats.get('total_games', 0)
                    total_wins += stats.get('total_wins', 0)
            
            winrate = round((total_wins / total_games * 100), 2) if total_games > 0 else 0
            ranked_solo_avg = players_team.get_average_solo_rank()
            ranked_flex_avg = players_team.get_average_flex_rank()
            
            return {
                "total_games": total_games,
                "winrate": float(winrate) if isinstance(winrate, Decimal) else winrate,
                "ranked_solo_avg": ranked_solo_avg,
                "ranked_flex_avg": ranked_flex_avg
            }
        
        team1_data = {
            'team_name': team1['team_name'],
            'stats': calculate_team_stats(team1_players),
            'players': team1_players
        }
        
        team2_data = {
            'team_name': team2['team_name'],
            'stats': calculate_team_stats(team2_players),
            'players': team2_players
        }
        
        # Récupérer tous les champions AVANT de fermer la connexion
        all_champions = db.get_all_champion()
        champion_names = [c['name'] for c in all_champions]
        
        db.close()
        
        # Créer une nouvelle session de draft
        session_id = str(uuid.uuid4())
        simulator = DraftSimulator(team1_data, team2_data, player_side, player_team)
        
        # Stocker le simulateur et les champions pour cette session
        draft_sessions[session_id] = {
            'simulator': simulator,
            'champions': champion_names
        }
        
        # Obtenir l'état initial et retourner immédiatement
        # L'IA jouera côté frontend avec un délai visuel
        state = simulator.get_draft_state()
        state['session_id'] = session_id
        
        return jsonify(state), 200
        
    except Exception as e:
        print(f"ERROR in start_draft_simulation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/draft/<session_id>/action', methods=['POST'])
@jwt_required()
def draft_action(session_id):
    """Effectue une action dans le draft (ban ou pick du joueur)"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        data = request.get_json()
        champion = data.get('champion')
        
        if not champion:
            return jsonify({"error": "Champion requis"}), 400
        
        # Récupérer la session de draft
        if session_id not in draft_sessions:
            return jsonify({"error": "Session de draft non trouvée ou expirée"}), 404
        
        session_data = draft_sessions[session_id]
        simulator = session_data['simulator']
        
        # Vérifier que c'est bien le tour du joueur
        state = simulator.get_draft_state()
        if not state['current_phase'] or not state['current_phase']['is_player_turn']:
            return jsonify({"error": "Ce n'est pas votre tour"}), 400
        
        # Appliquer l'action du joueur
        result = simulator.process_action(champion, is_player_action=True)
        
        if 'error' in result:
            return jsonify(result), 400
        
        # Note: La session n'est PAS supprimée quand le draft est terminé
        # L'utilisateur doit manuellement quitter la page
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"ERROR in draft_action: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/draft/<session_id>/state', methods=['GET'])
@jwt_required()
def get_draft_state_route(session_id):
    """Récupère l'état actuel d'une session de draft"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        if session_id not in draft_sessions:
            return jsonify({"error": "Session de draft non trouvée ou expirée"}), 404
        
        session_data = draft_sessions[session_id]
        simulator = session_data['simulator']
        state = simulator.get_draft_state()
        state['session_id'] = session_id
        
        return jsonify(state), 200
        
    except Exception as e:
        print(f"ERROR in get_draft_state: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/draft/<session_id>/ai-play', methods=['POST'])
@jwt_required()
def ai_play_turn(session_id):
    """Fait jouer l'IA pour son tour"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        if session_id not in draft_sessions:
            return jsonify({"error": "Session de draft non trouvée ou expirée"}), 404
        
        session_data = draft_sessions[session_id]
        simulator = session_data['simulator']
        champion_names = session_data['champions']
        
        state = simulator.get_draft_state()
        
        # Debug logs
        print(f"DEBUG ai_play_turn: current_phase={state.get('current_phase')}")
        if state.get('current_phase'):
            print(f"DEBUG ai_play_turn: is_player_turn={state['current_phase'].get('is_player_turn')}")
        
        # Vérifier que c'est bien le tour de l'IA
        if not state['current_phase'] or state['current_phase']['is_player_turn']:
            print(f"DEBUG ai_play_turn: Rejeté - ce n'est pas le tour de l'IA")
            return jsonify({"error": "Ce n'est pas le tour de l'IA"}), 400
        
        # Faire jouer l'IA
        ai_choice = simulator.ai_make_decision(
            state['current_phase']['phase'],
            champion_names
        )
        
        if ai_choice:
            result = simulator.process_action(ai_choice, is_player_action=False)
            result['ai_action'] = {
                'champion': ai_choice,
                'phase': state['current_phase']['phase']
            }
        else:
            return jsonify({"error": "L'IA n'a pas pu choisir de champion"}), 500
        
        # Note: La session n'est PAS supprimée quand le draft est terminé
        # L'utilisateur doit manuellement quitter la page
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"ERROR in ai_play_turn: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.route('/api/draft/<session_id>/cancel', methods=['DELETE'])
@jwt_required()
def cancel_draft(session_id):
    """Annule une session de draft"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        if session_id in draft_sessions:
            del draft_sessions[session_id]
        
        return jsonify({"message": "Session de draft annulée"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500

@app.errorhandler(Exception)
def handle_exception(error):
    return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)
