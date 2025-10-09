"""
Service de gestion des joueurs
Gère la recherche, les statistiques et les données des joueurs
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from entity.player import Player
from database.db import DataBase
from utils.ratelimit import RateLimiter
import uuid


class PlayerService:
    def __init__(self, api_key):
        self.api_key = api_key
        self.rate_limiter = RateLimiter()
    
    def get_player_id(self, name, tag):
        """Récupérer l'ID d'un joueur par son nom et tag"""
        try:
            if not name or not tag:
                return False, "Nom et tag requis", None
            
            db = DataBase(host="localhost")
            player = db.get_player(name=name, tag=tag)
            
            if not player:
                return False, "Joueur non trouvé", None
            
            return True, "Joueur trouvé", {"player_id": player['id']}
            
        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None

    def search_player(self, username):
        """Recherche d'un joueur par nom et tag"""
        try:
            if not username or '#' not in username:
                return False, "Please provide a username and a tag!", None
            
            name, tag = username.split('#', 1)
            
            db = DataBase(host="localhost")
            all_champions = db.get_all_champion()
            player = Player(name=name, tag=tag, API_KEY=self.api_key)
            
            if not player.puuid:
                return False, "This player does not exist in EUW server!", None
            
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
            
            return True, "Joueur trouvé", response
            
        except Exception as e:
            return False, f"An error occurred: {str(e)}", None

    def filter_games(self, username, role=None, champion=None, start_date=None, 
                    end_date=None, match_types=None, seasons=None):
        """Filtrage des jeux d'un joueur"""
        try:
            if not username or '#' not in username:
                return False, "Please provide a username and a tag!", None
            
            name, tag = username.split('#', 1)
            
            db = DataBase(host="localhost")
            all_champions = db.get_all_champion()
            player = Player(name=name, tag=tag, API_KEY=self.api_key)
            
            if not player.puuid:
                return False, "This player does not exist in EUW server!", None
            
            # Insérer ou mettre à jour le joueur
            db.insert_player(name=player.name, tag=player.tag, puuid=player.puuid, soloq=player.soloq, flex=player.flexq)
            player_data = db.get_player(name=player.name, tag=player.tag)
            
            if not player_data:
                return False, "Player data not found", None
                
            player_id = player_data["id"]
            
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
            
            return True, "Filtrage réussi", response
            
        except Exception as e:
            return False, f"An error occurred: {str(e)}", None

    def start_download_games(self, username, nb_games, session_id=None):
        """Démarrer le téléchargement de nouveaux jeux pour un joueur"""
        try:
            if not username or '#' not in username:
                return False, "Please provide a username and a tag!", None
            
            if not session_id:
                session_id = str(uuid.uuid4())
            
            return True, "Téléchargement démarré", {"session_id": session_id}
            
        except Exception as e:
            return False, f"An error occurred: {str(e)}", None

    def process_download(self, username, nb_games, session_id, socketio):
        """Traitement du téléchargement des jeux en arrière-plan"""
        try:
            print(f"DEBUG - Début du téléchargement pour {username}")
            
            name, tag = username.split('#', 1)
            
            player = Player(name=name, tag=tag, API_KEY=self.api_key)
            if not player.puuid:
                print(f"DEBUG - Joueur {username} non trouvé")
                socketio.emit('download_error', {'error': f'Joueur {username} non trouvé'}, room=session_id)
                return
                
            db = DataBase(host="localhost")
            
            # Insérer ou mettre à jour le joueur dans la base de données
            db.insert_player(name=player.name, tag=player.tag, puuid=player.puuid, soloq=player.soloq, flex=player.flexq)
            player_data = db.get_player(name=player.name, tag=player.tag)
            
            if not player_data:
                print(f"DEBUG - Impossible de récupérer les données du joueur {username}")
                socketio.emit('download_error', {'error': f'Impossible de récupérer les données du joueur {username}'}, room=session_id)
                return
                
            player_id = player_data["id"]
            print(f"DEBUG - Player ID: {player_id}")
            
            match_dict = {
                "soloq": 420,
                "flex": 440,
            }
            
            print(f"DEBUG - Récupération de l'historique des matchs...")
            soloq_matchs = player.get_matchs_history(match_type=match_dict["soloq"], count=nb_games)
            flex_matchs = player.get_matchs_history(match_type=match_dict["flex"], count=nb_games)
            normal_matchs = player.get_matchs_history(match_type="normal", count=nb_games)
            tournament_matchs = player.get_matchs_history(match_type="tourney", count=nb_games)
            
            all_matchs = [soloq_matchs, flex_matchs, normal_matchs, tournament_matchs]
            total_games = sum(len(m) for m in all_matchs)
            print(f"DEBUG - Total des matchs trouvés: {total_games}")
            
            if total_games == 0:
                print("DEBUG - Aucun match trouvé")
                socketio.emit('download_complete', {'username': username, 'message': 'Aucun nouveau match trouvé'}, room=session_id)
                return
            
            games_processed = 0
            
            print(f"DEBUG - Début du traitement de {total_games} matchs")
            
            for index, matchs in enumerate(all_matchs):
                match_type_name = ["soloq", "flex", "normal", "tourney"][index]
                print(f"DEBUG - Traitement des matchs {match_type_name}: {len(matchs)} matchs")
                
                for match_index, match_id in enumerate(matchs):
                    try:
                        print(f"DEBUG - Traitement du match {match_index + 1}/{len(matchs)} ({match_type_name}): {match_id}")
                        
                        # Attendre un slot avant la requête
                        print(f"DEBUG - Attente d'un slot rate limiter...")
                        self.rate_limiter.wait_for_slot()
                        print(f"DEBUG - Slot obtenu, récupération des infos du match...")
                        
                        # Récupérer les informations du match
                        game = player.get_match_info(match_id)
                        print(f"DEBUG - Infos du match récupérées: {game is not None}")
                        
                        if game is None:
                            print(f"DEBUG - Match {match_id} ignoré (game is None)")
                            games_processed += 1
                            progress = round(games_processed / total_games * 100)
                            print(f"DEBUG - Progression: {games_processed}/{total_games} ({progress}%)")
                            socketio.emit('progress', {'progress': progress}, room=session_id)
                            continue
                        
                        games_processed += 1
                        progress = round(games_processed / total_games * 100)
                        print(f"DEBUG - Progression: {games_processed}/{total_games} ({progress}%)")
                        print(f"DEBUG - Émission de l'événement progress: {progress}%")
                        socketio.emit('progress', {'progress': progress}, room=session_id)
                        print(f"DEBUG - Événement progress émis avec succès")
                        
                        # Ajouter un petit délai pour s'assurer que l'événement est traité
                        import time
                        time.sleep(0.05)
                        
                        print(f"DEBUG - Ajout du match {match_id} à la base de données...")
                        match_type = ["soloq", "flex", "normal", "tourney"][index]
                        champion_id = db.get_champion(game["Champion"])["id"]
                        player.add_data_to_db(db, player_id=player_id, champion_id=champion_id, game=game, type_game=match_type)
                        print(f"DEBUG - Match {match_id} ajouté avec succès")
                        
                    except Exception as e:
                        print(f"DEBUG - Erreur lors du traitement du match {match_id}: {e}")
                        import traceback
                        traceback.print_exc()
                        # Continuer avec le match suivant même en cas d'erreur
                        games_processed += 1
                        progress = round(games_processed / total_games * 100)
                        print(f"DEBUG - Progression après erreur: {games_processed}/{total_games} ({progress}%)")
                        socketio.emit('progress', {'progress': progress}, room=session_id)
                        continue
            
            print(f"DEBUG - Émission de l'événement download_complete pour {username}")
            socketio.emit('download_complete', {'username': username}, room=session_id)
            print(f"DEBUG - Événement download_complete émis avec succès")
            
        except Exception as e:
            socketio.emit('download_error', {'error': str(e)}, room=session_id)
