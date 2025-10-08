"""
Routes d'authentification
Gère l'inscription, la connexion, la réinitialisation de mot de passe
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.auth_service import AuthService

# Créer le blueprint pour les routes d'authentification
auth_bp = Blueprint('auth', __name__)

# Initialiser le service d'authentification
auth_service = AuthService()


@auth_bp.route('/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        email = data.get('email', '').strip() if data.get('email') else None

        success, message, result = auth_service.register_user(username, password, email)
        
        if success:
            return jsonify({
                "message": message,
                "user": result
            }), 201
        else:
            if result:  # Si result contient des erreurs de validation
                return jsonify({"error": message, "details": result}), 400
            else:
                return jsonify({"error": message}), 400 if "déjà" in message else 500

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        success, message, result = auth_service.login_user(username, password)
        
        if success:
            # Créer le token JWT
            user_id = result['id']
            access_token = create_access_token(identity=str(user_id))

            return jsonify({
                "message": message,
                "access_token": access_token,
                "user": result
            }), 200
        else:
            return jsonify({"error": message}), 401

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Récupérer les informations de l'utilisateur connecté"""
    try:
        user_id = get_jwt_identity()
        
        if not user_id:
            return jsonify({"error": "Token invalide - pas d'ID utilisateur"}), 422
        
        # Convertir l'ID utilisateur en entier pour la base de données
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Token invalide - format d'ID utilisateur incorrect"}), 422
        
        success, message, result = auth_service.get_user_by_id(user_id_int)
        
        if success:
            return jsonify({"user": result}), 200
        else:
            return jsonify({"error": message}), 404

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Demande de réinitialisation de mot de passe"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()

        success, message, result = auth_service.forgot_password(email)
        
        if success:
            return jsonify({"message": message}), 200
        else:
            return jsonify({"error": message}), 500

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Réinitialisation du mot de passe avec token"""
    try:
        data = request.get_json()
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '')

        success, message, result = auth_service.reset_password(token, new_password)
        
        if success:
            return jsonify({"message": message}), 200
        else:
            if result:  # Si result contient des erreurs de validation
                return jsonify({"error": message, "details": result}), 400
            else:
                return jsonify({"error": message}), 400

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500
