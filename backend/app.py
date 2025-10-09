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

# Ajouter le répertoire parent au path Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import DataBase
from objects.player import Player
from objects.user import User
from utils.ratelimit import RateLimiter
from utils.email_service import EmailService
from objects.team import Team

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

CORS(app, origins=["http://localhost:3000"])  # Autoriser le frontend Next.js
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

# Initialiser le service email
email_service = EmailService()

# Helper function to convert Decimal to float in nested structures
def convert_decimals(obj):
    """Recursively convert Decimal objects to float"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    return obj

# ==================== API ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de l'état de l'API"""
    return jsonify({"status": "healthy", "message": "API is running"})

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

    print(f"DEBUG - Players: {players}")
    print(f"DEBUG - Team name: {team_name}")

    if not team_name:
        return jsonify({"error": "Nom de l'équipe requis"}), 400
    
    db = DataBase(host="localhost")
    
    # Créer l'équipe
    team_id = db.insert_team(team_name, int(user_id))
    
    print(f"DEBUG - Team id: {team_id}")

    # Ajouter les joueurs à l'équipe
    for player in players:
        print(f"DEBUG - Adding player to team: {player}")
        print(f"DEBUG - player_id type: {type(player['player_id'])}, value: {player['player_id']}")
        print(f"DEBUG - team_id type: {type(team_id)}, value: {team_id}")
        print(f"DEBUG - position: {player['position']}")
        print(f"DEBUG - is_sub: {player.get('is_sub', False)}")
        
        db.insert_team_player(
            team_id=team_id,
            player_id=player['player_id'],
            position=player['position'],
            is_sub=player.get('is_sub', False)
        )
    
    # Récupérer l'équipe créée avec ses joueurs
    print(f"DEBUG - Retrieving team with ID: {team_id}")
    try:
        team = db.get_team_by_id(team_id)
        print(f"DEBUG - Team retrieved successfully: {team}")
        return jsonify({"team": team}), 201
    except Exception as e:
        print(f"DEBUG - Error retrieving team: {e}")
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

        print(team)
        
        db.close()
        return jsonify({"team": team}), 200
        
    except Exception as e:
        print(f"ERROR in get_team_details: {str(e)}")
        import traceback
        traceback.print_exc()
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

@app.route('/api/search', methods=['POST'])
def search_player():
    """Recherche d'un joueur par nom et tag"""
    try:
        data = request.get_json()
        username = data.get('username')
        
        if not username or '#' not in username:
            return jsonify({"error": "Please provide a username and a tag!"}), 400
        
        name, tag = username.split('#', 1)
        
        db = DataBase(host="localhost")
        all_champions = db.get_all_champion()
        player = Player(name=name, tag=tag, API_KEY=API_KEY)
        
        if not player.puuid:
            return jsonify({"error": "This player does not exist in EUW server!"}), 404
        
        # Insérer ou mettre à jour le joueur
        db.insert_player(name=player.name, tag=player.tag, puuid=player.puuid, soloq=player.soloq, flex=player.flexq)
        player_id = db.get_player(name=player.name, tag=player.tag)["id"]
        
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
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/filter', methods=['POST'])
def filter_games():
    """Filtrage des jeux d'un joueur"""
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
        
        db = DataBase(host="localhost")
        all_champions = db.get_all_champion()
        player = Player(name=name, tag=tag, API_KEY=API_KEY)
        player_id = db.get_player(name=player.name, tag=player.tag)["id"]
        
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
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/download', methods=['POST'])
def download_games():
    """Téléchargement de nouveaux jeux pour un joueur"""
    try:
        data = request.get_json()
        username = data.get('username')
        nb_games = data.get('nb_games', 1)
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        if not username or '#' not in username:
            return jsonify({"error": "Please provide a username and a tag!"}), 400
        
        # Démarrer le téléchargement en arrière-plan
        socketio.start_background_task(
            target=process_download, 
            username=username, 
            nb_games=nb_games, 
            session_id=session_id
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

def process_download(username, nb_games, session_id):
    """Traitement du téléchargement des jeux en arrière-plan"""
    try:
        name, tag = username.split('#', 1)
        
        player = Player(name=name, tag=tag, API_KEY=API_KEY)
        db = DataBase(host="localhost")
        
        player_id = db.get_player(name=player.name, tag=player.tag)["id"]
        
        match_dict = {
            "soloq": 420,
            "flex": 440,
        }
        
        soloq_matchs = player.get_matchs_history(match_type=match_dict["soloq"], count=nb_games)
        flex_matchs = player.get_matchs_history(match_type=match_dict["flex"], count=nb_games)
        normal_matchs = player.get_matchs_history(match_type="normal", count=nb_games)
        tournament_matchs = player.get_matchs_history(match_type="tourney", count=nb_games)
        
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

@app.errorhandler(Exception)
def handle_exception(error):
    return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port=5001)
