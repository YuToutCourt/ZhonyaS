"""
Routes de gestion des équipes
Gère la création, modification, suppression et récupération des équipes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.team_service import TeamService

# Créer le blueprint pour les routes des équipes
teams_bp = Blueprint('teams', __name__)

# Initialiser le service des équipes
team_service = TeamService()


@teams_bp.route('/', methods=['GET'])
@jwt_required()
def get_teams():
    """Récupérer toutes les équipes de l'utilisateur connecté"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        success, message, result = team_service.get_user_teams(int(user_id))
        
        if success:
            return jsonify(result), 200
        else:
            return jsonify({"error": message}), 500

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@teams_bp.route('/', methods=['POST'])
@jwt_required()
def create_team():
    """Créer une nouvelle équipe"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        data = request.get_json()
        team_name = data.get('team_name', '').strip()
        players = data.get('players', [])

        success, message, result = team_service.create_team(int(user_id), team_name, players)
        
        if success:
            return jsonify(result), 201
        else:
            return jsonify({"error": message}), 400 if "requis" in message else 500

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@teams_bp.route('/<int:team_id>', methods=['GET'])
@jwt_required()
def get_team(team_id):
    """Récupérer une équipe spécifique"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        success, message, result = team_service.get_team(team_id, int(user_id))
        
        if success:
            return jsonify(result), 200
        else:
            if "non trouvée" in message:
                return jsonify({"error": message}), 404
            elif "non autorisé" in message:
                return jsonify({"error": message}), 403
            else:
                return jsonify({"error": message}), 500

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@teams_bp.route('/<int:team_id>', methods=['PUT'])
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

        success, message, result = team_service.update_team(team_id, int(user_id), team_name, players)
        
        if success:
            return jsonify(result), 200
        else:
            if "requis" in message:
                return jsonify({"error": message}), 400
            elif "non trouvée" in message:
                return jsonify({"error": message}), 404
            elif "non autorisé" in message:
                return jsonify({"error": message}), 403
            else:
                return jsonify({"error": message}), 500

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500


@teams_bp.route('/<int:team_id>', methods=['DELETE'])
@jwt_required()
def delete_team(team_id):
    """Supprimer une équipe"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({"error": "Token invalide"}), 422
        
        success, message, result = team_service.delete_team(team_id, int(user_id))
        
        if success:
            return jsonify({"message": message}), 200
        else:
            if "non trouvée" in message:
                return jsonify({"error": message}), 404
            elif "non autorisé" in message:
                return jsonify({"error": message}), 403
            else:
                return jsonify({"error": message}), 500

    except Exception as e:
        return jsonify({"error": f"Erreur serveur: {str(e)}"}), 500
