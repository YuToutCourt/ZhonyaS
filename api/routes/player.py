"""
Routes de gestion des joueurs
Gère la recherche, les statistiques et les données des joueurs
"""
from flask import Blueprint, request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.player_service import PlayerService

# Créer le blueprint pour les routes des joueurs
player_bp = Blueprint('player', __name__)

# Initialiser le service des joueurs
api_key = os.getenv("API_KEY")
player_service = PlayerService(api_key)


@player_bp.route('/player-id', methods=['POST'])
def get_player_id():
    """Récupérer l'ID d'un joueur par son nom et tag"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        tag = data.get('tag', '').strip()
        
        success, message, result = player_service.get_player_id(name, tag)
        
        if success:
            return jsonify(result), 200
        else:
            return jsonify({"error": message}), 400 if "requis" in message else 404

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@player_bp.route('/search', methods=['POST'])
def search_player():
    """Recherche d'un joueur par nom et tag"""
    try:
        data = request.get_json()
        username = data.get('username')
        
        success, message, result = player_service.search_player(username)
        
        if success:
            return jsonify(result)
        else:
            return jsonify({"error": message}), 400 if "provide" in message else 404

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@player_bp.route('/filter', methods=['POST'])
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
        
        success, message, result = player_service.filter_games(
            username, role, champion, start_date, end_date, match_types, seasons
        )
        
        if success:
            return jsonify(result)
        else:
            return jsonify({"error": message}), 400 if "provide" in message else 500

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@player_bp.route('/download', methods=['POST'])
def download_games():
    """Téléchargement de nouveaux jeux pour un joueur"""
    try:
        data = request.get_json()
        username = data.get('username')
        nb_games = data.get('nb_games', 1)
        session_id = data.get('session_id')
        
        if not username or '#' not in username:
            return jsonify({"error": "Please provide a username and a tag!"}), 400
        
        # Générer un session_id si non fourni
        if not session_id:
            import uuid
            session_id = str(uuid.uuid4())
        
        # Démarrer le téléchargement en arrière-plan
        from api.websocket_events import process_download
        from flask import current_app
        
        # Récupérer socketio depuis le contexte de l'application
        socketio = getattr(current_app, 'socketio', None)
        if not socketio:
            # Fallback: importer directement
            from api.app import socketio
        
        # Attendre un peu pour s'assurer que le client est dans la room
        import time
        time.sleep(0.2)
        
        # Émettre l'événement de début de téléchargement
        print(f"DEBUG - Émission de l'événement download_start depuis l'API pour {username}")
        socketio.emit('download_start', {'username': username}, room=session_id)
        print(f"DEBUG - Événement download_start émis depuis l'API avec succès")
        
        # Démarrer la tâche en arrière-plan
        socketio.start_background_task(
            target=process_download,
            username=username,
            nb_games=nb_games,
            session_id=session_id,
            socketio=socketio
        )
        
        return jsonify({"status": "started", "session_id": session_id})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
