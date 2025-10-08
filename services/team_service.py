"""
Service de gestion des équipes
Gère la création, modification, suppression et récupération des équipes
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import DataBase


class TeamService:
    def __init__(self):
        pass
    
    def get_user_teams(self, user_id):
        """Récupérer toutes les équipes de l'utilisateur connecté"""
        try:
            if not user_id:
                return False, "ID utilisateur requis", None
            
            db = DataBase(host="localhost")
            teams = db.get_user_teams(int(user_id))
            
            return True, "Équipes récupérées", {"teams": teams}
            
        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None

    def create_team(self, user_id, team_name, players):
        """Créer une nouvelle équipe"""
        try:
            if not user_id:
                return False, "ID utilisateur requis", None
            
            if not team_name:
                return False, "Nom de l'équipe requis", None
            
            db = DataBase(host="localhost")
            
            # Créer l'équipe
            team_id = db.insert_team(team_name, int(user_id))
            
            # Ajouter les joueurs à l'équipe
            for player in players:
                db.insert_team_player(
                    team_id=team_id,
                    player_id=player['player_id'],
                    position=player['position'],
                    is_sub=player.get('is_sub', False)
                )
            
            # Récupérer l'équipe créée avec ses joueurs
            team = db.get_team_by_id(team_id)
            
            return True, "Équipe créée avec succès", {"team": team}
            
        except Exception as e:
            return False, f"Erreur lors de la création de l'équipe: {str(e)}", None

    def get_team(self, team_id, user_id):
        """Récupérer une équipe spécifique"""
        try:
            if not user_id:
                return False, "ID utilisateur requis", None
            
            db = DataBase(host="localhost")
            team = db.get_team_by_id(team_id)
            
            if not team:
                return False, "Équipe non trouvée", None
            
            # Vérifier que l'utilisateur est propriétaire de l'équipe
            if team['user_id'] != int(user_id):
                return False, "Accès non autorisé", None
            
            return True, "Équipe récupérée", {"team": team}
            
        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None

    def update_team(self, team_id, user_id, team_name, players):
        """Mettre à jour une équipe"""
        try:
            if not user_id:
                return False, "ID utilisateur requis", None
            
            if not team_name:
                return False, "Nom de l'équipe requis", None
            
            db = DataBase(host="localhost")
            
            # Vérifier que l'équipe existe et appartient à l'utilisateur
            team = db.get_team_by_id(team_id)
            if not team:
                return False, "Équipe non trouvée", None
            
            if team['user_id'] != int(user_id):
                return False, "Accès non autorisé", None
            
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
            
            return True, "Équipe mise à jour avec succès", {"team": updated_team}
            
        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None

    def delete_team(self, team_id, user_id):
        """Supprimer une équipe"""
        try:
            if not user_id:
                return False, "ID utilisateur requis", None
            
            db = DataBase(host="localhost")
            
            # Vérifier que l'équipe existe et appartient à l'utilisateur
            team = db.get_team_by_id(team_id)
            if not team:
                return False, "Équipe non trouvée", None
            
            if team['user_id'] != int(user_id):
                return False, "Accès non autorisé", None
            
            # Supprimer l'équipe (les joueurs seront supprimés automatiquement par CASCADE)
            db.delete_team(team_id)
            
            return True, "Équipe supprimée avec succès", None
            
        except Exception as e:
            return False, f"Erreur serveur: {str(e)}", None
