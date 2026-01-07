import os
from datetime import timedelta

from Controller.health import health_bp
from Controller.player import player_bp
from Database.database import engine
from Database.init_db import init_db, print_tables
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from Util.emailService import EmailService

SECRET_KEY = os.getenv("SECRET_KEY")

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config["JWT_SECRET_KEY"] = SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

# Debug JWT configuration
print(f"DEBUG - JWT_SECRET_KEY configured: {bool(SECRET_KEY)}")
print(f"DEBUG - SECRET_KEY length: {len(SECRET_KEY) if SECRET_KEY else 0}")

# Init JWT
jwt = JWTManager(app)

# Config CORS pour connexion externe
CORS(app, origin="*", supports_credentials=True)
socketIO = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(player_bp, url_prefix="/api")

# Init Email Service
email_service = EmailService()

# Initialiser la base de données
print("Initialisation de la base de données...")
init_db(engine, package_name="Entity", create_tables=True)
print("Base de données initialisée avec succès!")
print_tables(engine)

if __name__ == "__main__":
    socketIO.run(app, debug=True, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
