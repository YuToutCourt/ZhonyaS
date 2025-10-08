"""
Service d'authentification
Gère l'inscription, la connexion, la réinitialisation de mot de passe
"""
import uuid
from datetime import datetime, timedelta
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from entity.user import User
from database.db import DataBase
from utils.email_service import EmailService


class AuthService:
    def __init__(self):
        self.email_service = EmailService()
    
    def register_user(self, username, password, email=None):
        """Inscription d'un nouvel utilisateur"""
        try:
            # Créer l'objet utilisateur
            user = User(username=username, password=password, email=email)

            # Valider les données
            is_valid, errors = user.validate_all()
            if not is_valid:
                return False, "Données invalides", errors

            # Connexion à la base de données
            db = DataBase(host="localhost")

            # Vérifier si le nom d'utilisateur existe déjà
            if db.check_username_exists(username):
                return False, "Ce nom d'utilisateur est déjà utilisé", None

            # Vérifier si l'email existe déjà (si fourni)
            if email and db.check_email_exists(email):
                return False, "Cette adresse email est déjà utilisée", None

            # Hacher le mot de passe
            success, message = user.hash_password()
            if not success:
                return False, message, None

            # Insérer l'utilisateur dans la base de données
            db.insert_user(username, user.password, email)
            
            # Envoyer un email de bienvenue si l'email est fourni
            if email:
                self.email_service.send_welcome_email(email, username)

            return True, "Utilisateur créé avec succès", {
                "username": username,
                "email": email
            }

        except Exception as e:
            return False, f"Erreur lors de la création de l'utilisateur: {str(e)}", None

    def login_user(self, username, password):
        """Connexion d'un utilisateur"""
        try:
            if not username or not password:
                return False, "Nom d'utilisateur et mot de passe requis", None

            # Connexion à la base de données
            db = DataBase(host="localhost")

            # Récupérer l'utilisateur
            user_data = db.get_user_by_username(username)
            if not user_data:
                return False, "Nom d'utilisateur ou mot de passe incorrect", None

            # Créer l'objet utilisateur pour vérifier le mot de passe
            user = User(
                user_id=user_data['id'],
                username=user_data['username'],
                password=user_data['password_hash'],
                email=user_data['email']
            )

            # Vérifier le mot de passe
            if not user.verify_password(password):
                return False, "Nom d'utilisateur ou mot de passe incorrect", None

            # Mettre à jour la dernière connexion
            db.update_user_last_login(user_data['id'])

            return True, "Connexion réussie", {
                "id": user_data['id'],
                "username": user_data['username'],
                "email": user_data['email'],
                "last_login": user_data['last_login']
            }

        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None

    def get_user_by_id(self, user_id):
        """Récupérer un utilisateur par son ID"""
        try:
            db = DataBase(host="localhost")
            user_data = db.get_user_by_id(user_id)
            
            if not user_data:
                return False, "Utilisateur non trouvé", None

            return True, "Utilisateur trouvé", {
                "id": user_data['id'],
                "username": user_data['username'],
                "email": user_data['email'],
                "created_at": user_data['created_at'],
                "last_login": user_data['last_login']
            }

        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None

    def forgot_password(self, email):
        """Demande de réinitialisation de mot de passe"""
        try:
            if not email:
                return False, "Adresse email requise", None

            # Connexion à la base de données
            db = DataBase(host="localhost")

            # Vérifier si l'email existe
            user_data = db.get_user_by_email(email)
            if not user_data:
                # Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
                return True, "Si cette adresse email est enregistrée, vous recevrez un email de réinitialisation", None

            # Générer un token de réinitialisation
            reset_token = str(uuid.uuid4())
            expires_at = datetime.now() + timedelta(hours=24)

            # Supprimer les anciens tokens pour cet utilisateur
            db.cleanup_expired_tokens()

            # Insérer le nouveau token
            db.insert_password_reset_token(user_data['id'], reset_token, expires_at)

            # Envoyer l'email de réinitialisation
            success, message = self.email_service.send_password_reset_email(
                email, user_data['username'], reset_token
            )

            if not success:
                return False, f"Erreur lors de l'envoi de l'email: {message}", None

            return True, "Si cette adresse email est enregistrée, vous recevrez un email de réinitialisation", None

        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None

    def reset_password(self, token, new_password):
        """Réinitialisation du mot de passe avec token"""
        try:
            if not token or not new_password:
                return False, "Token et nouveau mot de passe requis", None

            # Connexion à la base de données
            db = DataBase(host="localhost")

            # Vérifier le token
            token_data = db.get_password_reset_token(token)
            if not token_data:
                return False, "Token invalide ou expiré", None

            # Créer l'objet utilisateur pour valider le nouveau mot de passe
            user = User(password=new_password)
            is_valid, errors = user.validate_password()
            if not is_valid:
                return False, "Mot de passe invalide", errors

            # Hacher le nouveau mot de passe
            success, message = user.hash_password()
            if not success:
                return False, message, None

            # Mettre à jour le mot de passe
            db.update_user_password(token_data['user_id'], user.password)
            # Supprimer le token utilisé
            db.delete_password_reset_token(token)

            return True, "Mot de passe réinitialisé avec succès", None

        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None
