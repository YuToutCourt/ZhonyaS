"""
Routes pour le streaming de téléchargement avec Server-Sent Events
"""
from flask import Blueprint, Response, request, jsonify
import json
import time
import threading
import sys
import os
import uuid
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.player_service import PlayerService

# Créer le blueprint pour les routes de streaming
download_stream_bp = Blueprint('download_stream', __name__)

# Initialiser le service des joueurs
api_key = os.getenv("API_KEY")
player_service = PlayerService(api_key)

# Stockage des sessions de téléchargement
download_sessions = {}

def cleanup_old_sessions():
    """Nettoie les sessions anciennes (plus de 5 minutes)"""
    import time
    current_time = time.time()
    sessions_to_remove = []
    
    for session_id, session in download_sessions.items():
        if 'created_at' in session and current_time - session['created_at'] > 300:  # 5 minutes
            sessions_to_remove.append(session_id)
    
    for session_id in sessions_to_remove:
        del download_sessions[session_id]
        print(f"DEBUG - Cleaned up old session: {session_id}")

@download_stream_bp.route('/download/stream/<session_id>')
def stream_download(session_id):
    """Stream des mises à jour de progression via Server-Sent Events"""
    
    def generate():
        print(f"DEBUG - SSE stream started for session: {session_id}")
        
        # Attendre que la session soit créée (max 10 secondes)
        timeout = 0
        while session_id not in download_sessions and timeout < 100:
            time.sleep(0.1)
            timeout += 1
        
        if session_id not in download_sessions:
            print(f"DEBUG - Session {session_id} not found after timeout")
            data = {
                'type': 'error',
                'error': 'Session not found',
                'status': 'error'
            }
            yield f"data: {json.dumps(data)}\n\n"
            return
        
        session = download_sessions[session_id]
        print(f"DEBUG - Session found: {session}")
        
        # Vérifier si la session est déjà fermée
        if session.get('closed', False):
            print(f"DEBUG - Session {session_id} is already closed, sending completion message")
            # Si la session est fermée mais terminée avec succès, envoyer le message de completion
            if session['status'] == 'completed':
                data = {
                    'type': 'completed',
                    'progress': 100,
                    'status': 'completed'
                }
                print(f"DEBUG - Sending completion for closed session: {data}")
                yield f"data: {json.dumps(data)}\n\n"
                # Attendre un peu pour s'assurer que le message est envoyé
                time.sleep(0.5)
            else:
                data = {
                    'type': 'error',
                    'error': 'Session already closed',
                    'status': 'error'
                }
                print(f"DEBUG - Sending error for closed session: {data}")
                yield f"data: {json.dumps(data)}\n\n"
                # Attendre un peu pour s'assurer que le message est envoyé
                time.sleep(0.5)
            return
        
        # Vérifier si la session est déjà terminée
        if session['status'] == 'completed':
            data = {
                'type': 'completed',
                'progress': 100,
                'status': 'completed'
            }
            print(f"DEBUG - Session already completed, sending: {data}")
            yield f"data: {json.dumps(data)}\n\n"
            # Attendre un peu pour s'assurer que le message est envoyé
            time.sleep(0.5)
        elif session['status'] == 'error':
            data = {
                'type': 'error',
                'error': session['error'],
                'status': 'error'
            }
            print(f"DEBUG - Session already errored, sending: {data}")
            yield f"data: {json.dumps(data)}\n\n"
            # Attendre un peu pour s'assurer que le message est envoyé
            time.sleep(0.5)
        else:
            # Envoyer les mises à jour de progression
            while session['status'] in ['running', 'starting']:
                data = {
                    'type': 'progress',
                    'progress': session['progress'],
                    'status': session['status']
                }
                print(f"DEBUG - Sending progress: {data}")
                yield f"data: {json.dumps(data)}\n\n"
                
                if session['status'] == 'completed':
                    data = {
                        'type': 'completed',
                        'progress': 100,
                        'status': 'completed'
                    }
                    print(f"DEBUG - Sending completed: {data}")
                    yield f"data: {json.dumps(data)}\n\n"
                    break
                elif session['status'] == 'error':
                    data = {
                        'type': 'error',
                        'error': session['error'],
                        'status': 'error'
                    }
                    print(f"DEBUG - Sending error: {data}")
                    yield f"data: {json.dumps(data)}\n\n"
                    break
                
                time.sleep(0.5)  # Mise à jour toutes les 500ms
        
        print(f"DEBUG - SSE stream ended for session: {session_id}")
        
        # Marquer la session comme fermée pour éviter les reconnexions
        if session_id in download_sessions:
            download_sessions[session_id]['closed'] = True
            print(f"DEBUG - Session {session_id} marked as closed")
        
        # Ne pas nettoyer la session immédiatement, laisser le client se déconnecter
        # La session sera nettoyée par le garbage collector ou après un délai plus long
    
    return Response(generate(), mimetype='text/event-stream', headers={
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    })

@download_stream_bp.route('/download/start', methods=['POST'])
def start_download():
    """Démarrer un téléchargement et retourner un session_id"""
    try:
        data = request.get_json()
        username = data.get('username')
        nb_games = data.get('nb_games', 1)
        
        if not username or '#' not in username:
            return jsonify({"error": "Please provide a username and a tag!"}), 400
        
        # Générer un session_id unique
        import uuid
        session_id = str(uuid.uuid4())
        
        # Nettoyer les anciennes sessions
        cleanup_old_sessions()
        
        # Créer la session
        download_sessions[session_id] = {
            'status': 'starting',
            'progress': 0,
            'username': username,
            'nb_games': nb_games,
            'created_at': time.time()
        }
        
        # Démarrer le téléchargement en arrière-plan
        thread = threading.Thread(
            target=process_download_with_sse,
            args=(username, nb_games, session_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "status": "started", 
            "session_id": session_id,
            "stream_url": f"/api/download/stream/{session_id}"
        })
        
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

def process_download_with_sse(username, nb_games, session_id):
    """Traitement du téléchargement avec mise à jour des sessions SSE"""
    try:
        session = download_sessions[session_id]
        session['status'] = 'running'
        
        print(f"DEBUG - Début du téléchargement SSE pour {username}")
        
        name, tag = username.split('#', 1)
        
        # Créer un objet Player pour le téléchargement
        from entity.player import Player
        player = Player(name=name, tag=tag, API_KEY=api_key)
        
        if not player.puuid:
            print(f"DEBUG - Joueur {username} non trouvé")
            session['status'] = 'error'
            session['error'] = f'Joueur {username} non trouvé'
            return
        
        # Connexion à la base de données
        from database.db import DataBase
        db = DataBase(host="localhost")
        
        # Insérer ou mettre à jour le joueur dans la base de données
        db.insert_player(name=player.name, tag=player.tag, puuid=player.puuid, soloq=player.soloq, flex=player.flexq)
        player_data = db.get_player(name=player.name, tag=player.tag)
        
        if not player_data:
            print(f"DEBUG - Impossible de récupérer les données du joueur {username}")
            session['status'] = 'error'
            session['error'] = f'Impossible de récupérer les données du joueur {username}'
            return
        
        player_id = player_data["id"]
        print(f"DEBUG - Player ID: {player_id}")
        
        # Récupérer l'historique des matchs
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
            session['status'] = 'completed'
            session['progress'] = 100
            session['message'] = 'Aucun nouveau match trouvé'
            return
        
        games_processed = 0
        
        print(f"DEBUG - Début du traitement de {total_games} matchs")
        
        # Rate limiter
        from utils.ratelimit import RateLimiter
        rate_limiter = RateLimiter()
        
        for index, matchs in enumerate(all_matchs):
            match_type_name = ["soloq", "flex", "normal", "tourney"][index]
            print(f"DEBUG - Traitement des matchs {match_type_name}: {len(matchs)} matchs")
            
            for match_index, match_id in enumerate(matchs):
                try:
                    print(f"DEBUG - Traitement du match {match_index + 1}/{len(matchs)} ({match_type_name}): {match_id}")
                    
                    # Attendre un slot avant la requête
                    print(f"DEBUG - Attente d'un slot rate limiter...")
                    rate_limiter.wait_for_slot()
                    print(f"DEBUG - Slot obtenu, récupération des infos du match...")
                    
                    # Récupérer les informations du match
                    game = player.get_match_info(match_id)
                    print(f"DEBUG - Infos du match récupérées: {game is not None}")
                    
                    if game is None:
                        print(f"DEBUG - Match {match_id} ignoré (game is None)")
                        games_processed += 1
                        progress = round(games_processed / total_games * 100)
                        session['progress'] = progress
                        print(f"DEBUG - Progression: {games_processed}/{total_games} ({progress}%)")
                        continue
                    
                    games_processed += 1
                    progress = round(games_processed / total_games * 100)
                    session['progress'] = progress
                    print(f"DEBUG - Progression: {games_processed}/{total_games} ({progress}%)")
                    
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
                    session['progress'] = progress
                    print(f"DEBUG - Progression après erreur: {games_processed}/{total_games} ({progress}%)")
                    continue
        
        print(f"DEBUG - Téléchargement terminé pour {username}")
        session['status'] = 'completed'
        session['progress'] = 100
        
        # Attendre un peu pour s'assurer que le client reçoit le message
        time.sleep(2)
        
    except Exception as e:
        print(f"DEBUG - Erreur dans process_download_with_sse: {e}")
        import traceback
        traceback.print_exc()
        session['status'] = 'error'
        session['error'] = str(e)
