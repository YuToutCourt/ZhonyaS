"""
Application principale de l'API
Configure Flask et enregistre les blueprints
"""
import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from flask_jwt_extended import JWTManager
from datetime import timedelta

# Ajouter le répertoire parent au path Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importer les blueprints
from api.routes.auth import auth_bp
from api.routes.player import player_bp
from api.routes.teams import teams_bp
from services.player_service import PlayerService
from api.config import config
from api.websocket_events import register_socketio_events

# Configuration
config_name = os.getenv('FLASK_ENV', 'default')
app_config = config[config_name]

app = Flask(__name__)
app.secret_key = app_config.SECRET_KEY
app.config['JWT_SECRET_KEY'] = app_config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=app_config.JWT_ACCESS_TOKEN_EXPIRES)

# Debug JWT configuration
print(f"DEBUG - JWT_SECRET_KEY configured: {bool(app_config.SECRET_KEY)}")
print(f"DEBUG - SECRET_KEY length: {len(app_config.SECRET_KEY) if app_config.SECRET_KEY else 0}")

# Initialiser JWT
jwt = JWTManager(app)

CORS(app, origins=app_config.CORS_ORIGINS)
socketio = SocketIO(app, cors_allowed_origins=app_config.SOCKETIO_CORS_ORIGINS)

# Exposer socketio dans l'application pour les routes
app.socketio = socketio

# Initialiser le service des joueurs pour les WebSockets
player_service = PlayerService(app_config.API_KEY)

# ==================== ENREGISTREMENT DES BLUEPRINTS ====================

# Enregistrer les blueprints avec des préfixes
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(player_bp, url_prefix='/api')
app.register_blueprint(teams_bp, url_prefix='/api/teams')

# ==================== ROUTES GÉNÉRALES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de l'état de l'API"""
    return jsonify({"status": "healthy", "message": "API is running"})

# ==================== WEBSOCKET EVENTS ====================

# Enregistrer les événements WebSocket
register_socketio_events(socketio)

# ==================== GESTION D'ERREURS ====================

@app.errorhandler(Exception)
def handle_exception(error):
    return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port=5001)
