"""
Gestion des événements WebSocket
Sépare la logique WebSocket du fichier principal
"""
from flask_socketio import emit, join_room
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.player_service import PlayerService

# Initialiser le service des joueurs
api_key = os.getenv("API_KEY")
player_service = PlayerService(api_key)

def register_socketio_events(socketio):
    """Enregistre tous les événements WebSocket"""
    
    @socketio.on('join')
    def on_join(data):
        session_id = data.get('session_id')
        print(f"DEBUG - Client joining room: {session_id}")
        if session_id:
            join_room(session_id)
            print(f"DEBUG - Client successfully joined room: {session_id}")

    @socketio.on('connect')
    def handle_connect():
        print('Client connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')

    @socketio.on('start_download')
    def handle_start_download(data):
        """Démarrer le téléchargement des jeux"""
        username = data.get('username')
        nb_games = data.get('nb_games', 1)
        session_id = data.get('session_id')
        
        if username and session_id:
            # Démarrer le traitement en arrière-plan
            socketio.start_background_task(
                target=process_download,
                username=username,
                nb_games=nb_games,
                session_id=session_id,
                socketio=socketio
            )

def process_download(username, nb_games, session_id, socketio):
    """Traitement du téléchargement des jeux en arrière-plan"""
    player_service.process_download(username, nb_games, session_id, socketio)
