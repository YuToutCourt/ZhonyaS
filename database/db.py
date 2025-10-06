import mysql.connector
from mysql.connector import Error
from icecream import ic
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

USER_DB = os.getenv("USER_DB")
PASSWORD_DB = os.getenv("PASSWORD_DB")
DATABASE_NAME = os.getenv("DATABASE_NAME")

class DataBase:
    def __init__(self, host):
        """Initialisation de la connexion à la base de données."""
        self.host = host
        self.user = USER_DB
        self.password = PASSWORD_DB
        self.database = DATABASE_NAME
        self.connection = None
        self.connect()

    def connect(self):
        """Connexion à la base de données."""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            if self.connection.is_connected():
                ic("Connexion réussie à la base de données.")

        except Error as e:
            ic(f"Erreur lors de la connexion à MySQL: {e}")
            raise Exception(f"Erreur lors de la connexion à MySQL: {e}")

    def close(self):
        """Fermeture de la connexion."""
        if self.connection.is_connected():
            self.connection.close()

    def execute_query(self, query, params=None):
        """Exécute une requête SQL (INSERT, UPDATE, DELETE)."""
        try:
            ic(f"DEBUG - execute_query called with:")
            ic(f"  query: {query}")
            ic(f"  params: {params}")
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            cursor.close()
            ic("DEBUG - execute_query successful")
            return True
        except Error as e:
            ic(f"Erreur SQL: {e}")
            ic(f"DEBUG - Query that failed: {query}")
            ic(f"DEBUG - Params that failed: {params}")
            raise Exception(f"Erreur SQL: {e}")

    def fetch_query(self, query, params=None):
        """Exécute une requête SQL (SELECT) et retourne les résultats."""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            result = cursor.fetchall()
            cursor.close()
            return result
        except Error as e:
            ic(f"Erreur SQL: {e}")
            raise Exception(f"Erreur SQL: {e}")

    # ==================== PLAYER ====================

    def __check_if_player_exists(self, name, tag):
        """Vérifie si un joueur existe déjà dans la base de données."""
        query = "SELECT id FROM Player WHERE name = %s AND tag = %s"
        result = self.fetch_query(query, (name, tag))
        if result:
            return result[0]['id']
        return None

    def insert_player(self, name, tag, puuid, soloq, flex):
        """Insère un joueur dans la base de données."""

        # Vérifie si le joueur existe déjà
        player_id = self.__check_if_player_exists(name, tag)
        if player_id:
            # Si le joueur existe déjà, met à jour ses informations
            self.update_player(player_id, puuid=puuid, soloq=soloq, flex=flex)
            return False  # Joueur existant mis à jour, pas d'insertion
        
        query = """
        INSERT INTO Player (name, tag, puuid, soloq, flex) 
        VALUES (%s, %s, %s, %s, %s)
        """
        return self.execute_query(query, (name, tag, puuid, soloq, flex))

    def update_player(self, player_id, **kwargs):
        """Met à jour un joueur avec des valeurs spécifiques."""
        set_clause = ", ".join(f"{key} = %s" for key in kwargs.keys())
        values = list(kwargs.values()) + [player_id]
        query = f"UPDATE Player SET {set_clause} WHERE id = %s"
        return self.execute_query(query, values)
    
    def get_player(self, **kwargs):
        """Récupère un joueur par ses critères."""
        where_clause = " AND ".join(f"{key} = %s" for key in kwargs.keys())
        values = list(kwargs.values())
        query = f"SELECT * FROM Player WHERE {where_clause}"
        return self.fetch_query(query, values)[0]

    # ==================== CHAMPION ====================

    def insert_champion(self, name, url_image):
        """Insère un champion dans la base de données."""
        query = """
        INSERT INTO Champion (name, url_image) 
        VALUES (%s, %s)
        """
        return self.execute_query(query, (name, url_image))

    def update_champion(self, champion_id, **kwargs):
        """Met à jour un champion avec des valeurs spécifiques."""
        set_clause = ", ".join(f"{key} = %s" for key in kwargs.keys())
        values = list(kwargs.values()) + [champion_id]
        query = f"UPDATE Champion SET {set_clause} WHERE id = %s"
        return self.execute_query(query, values)

    def get_champion(self, name):
        """Récupère un champion par son nom."""
        query = "SELECT * FROM Champion WHERE name = %s"
        return self.fetch_query(query, (name,))[0]
    
    def get_all_champion(self):
        """Récupère tous les champions de la base de données."""
        query = "SELECT * FROM Champion"
        return self.fetch_query(query)

    # ==================== USER ====================

    def insert_user(self, username, password_hash, email=None):
        """Insère un utilisateur dans la base de données."""
        query = """
        INSERT INTO User (username, password_hash, email, created_at) 
        VALUES (%s, %s, %s, %s)
        """
        created_at = datetime.now()
        return self.execute_query(query, (username, password_hash, email, created_at))

    def get_user_by_username(self, username):
        """Récupère un utilisateur par son nom d'utilisateur."""
        query = "SELECT * FROM User WHERE username = %s"
        result = self.fetch_query(query, (username,))
        return result[0] if result else None

    def get_user_by_email(self, email):
        """Récupère un utilisateur par son email."""
        query = "SELECT * FROM User WHERE email = %s"
        result = self.fetch_query(query, (email,))
        return result[0] if result else None

    def get_user_by_id(self, user_id):
        """Récupère un utilisateur par son ID."""
        query = "SELECT * FROM User WHERE id = %s"
        result = self.fetch_query(query, (user_id,))
        return result[0] if result else None

    def update_user_last_login(self, user_id):
        """Met à jour la dernière connexion de l'utilisateur."""
        query = "UPDATE User SET last_login = %s WHERE id = %s"
        return self.execute_query(query, (datetime.now(), user_id))

    def update_user_password(self, user_id, new_password_hash):
        """Met à jour le mot de passe de l'utilisateur."""
        query = "UPDATE User SET password_hash = %s WHERE id = %s"
        return self.execute_query(query, (new_password_hash, user_id))

    def check_username_exists(self, username):
        """Vérifie si un nom d'utilisateur existe déjà."""
        query = "SELECT id FROM User WHERE username = %s"
        result = self.fetch_query(query, (username,))
        return len(result) > 0

    def check_email_exists(self, email):
        """Vérifie si un email existe déjà."""
        query = "SELECT id FROM User WHERE email = %s"
        result = self.fetch_query(query, (email,))
        return len(result) > 0

    # ==================== PASSWORD RESET ====================

    def insert_password_reset_token(self, user_id, token, expires_at):
        """Insère un token de réinitialisation de mot de passe."""
        query = """
        INSERT INTO PasswordReset (user_id, token, expires_at, created_at) 
        VALUES (%s, %s, %s, %s)
        """
        return self.execute_query(query, (user_id, token, expires_at, datetime.now()))

    def get_password_reset_token(self, token):
        """Récupère un token de réinitialisation de mot de passe."""
        query = """
        SELECT pr.*, u.username, u.email 
        FROM PasswordReset pr 
        JOIN User u ON pr.user_id = u.id 
        WHERE pr.token = %s AND pr.expires_at > %s
        """
        result = self.fetch_query(query, (token, datetime.now()))
        return result[0] if result else None

    def delete_password_reset_token(self, token):
        """Supprime un token de réinitialisation de mot de passe."""
        query = "DELETE FROM PasswordReset WHERE token = %s"
        return self.execute_query(query, (token,))

    def cleanup_expired_tokens(self):
        """Supprime tous les tokens expirés."""
        query = "DELETE FROM PasswordReset WHERE expires_at < %s"
        return self.execute_query(query, (datetime.now(),))

    # ==================== TEAM MANAGEMENT ====================

    def insert_team(self, team_name, user_id):
        """Crée une nouvelle équipe et retourne son ID."""
        query = "INSERT INTO Team (team_name, user_id, created_at, updated_at) VALUES (%s, %s, %s, %s)"
        created_at = datetime.now()
        updated_at = datetime.now()
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, (team_name, user_id, created_at, updated_at))
            self.connection.commit()
            team_id = cursor.lastrowid
            cursor.close()
            return team_id
        except mysql.connector.Error as err:
            ic(f"Erreur SQL lors de l'insertion de l'équipe: {err}")
            self.connection.rollback()
            raise

    def get_user_teams(self, user_id):
        """Récupère toutes les équipes d'un utilisateur avec leurs joueurs."""
        query = """
        SELECT t.*, 
               pt.id as player_team_id,
               pt.player_id,
               pt.position,
               pt.is_sub,
               p.name as player_name,
               p.tag as player_tag
        FROM Team t
        LEFT JOIN TeamPlayer pt ON t.id = pt.team_id
        LEFT JOIN Player p ON pt.player_id = p.id
        WHERE t.user_id = %s
        ORDER BY t.created_at DESC
        """
        results = self.fetch_query(query, (user_id,))
        
        # Organiser les résultats par équipe en utilisant les noms de colonnes
        teams_dict = {}
        for row in results:
            team_id = row['id']  # t.id
            if team_id not in teams_dict:
                teams_dict[team_id] = {
                    'id': row['id'],
                    'team_name': row['team_name'],
                    'user_id': row['user_id'],
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at'],
                    'players': []
                }
            
            # Ajouter le joueur s'il existe
            if row['player_team_id'] is not None:  # player_team_id
                teams_dict[team_id]['players'].append({
                    'id': row['player_team_id'],
                    'team_id': team_id,  # Utiliser l'ID de l'équipe actuelle
                    'player_id': row['player_id'],
                    'position': row['position'],
                    'is_sub': bool(row['is_sub']),
                    'player_name': row['player_name'],
                    'player_tag': row['player_tag']
                })
        
        return list(teams_dict.values())

    def get_team_by_id(self, team_id):
        """Récupère une équipe par son ID avec ses joueurs."""
        query = """
        SELECT t.id as team_id,
               t.team_name,
               t.user_id,
               t.created_at,
               t.updated_at,
               pt.id as player_team_id,
               pt.player_id,
               pt.position,
               pt.is_sub,
               p.name as player_name,
               p.tag as player_tag
        FROM Team t
        LEFT JOIN TeamPlayer pt ON t.id = pt.team_id
        LEFT JOIN Player p ON pt.player_id = p.id
        WHERE t.id = %s
        """
        results = self.fetch_query(query, (team_id,))
        
        if not results:
            return None
        
        # Organiser les résultats en utilisant les noms de colonnes
        team = {
            'id': results[0]['team_id'],
            'team_name': results[0]['team_name'],
            'user_id': results[0]['user_id'],
            'created_at': results[0]['created_at'],
            'updated_at': results[0]['updated_at'],
            'players': []
        }
        
        for row in results:
            if row['player_team_id'] is not None:  # player_team_id
                team['players'].append({
                    'id': row['player_team_id'],
                    'team_id': row['team_id'],
                    'player_id': row['player_id'],
                    'position': row['position'],
                    'is_sub': bool(row['is_sub']),
                    'player_name': row['player_name'],
                    'player_tag': row['player_tag']
                })
        
        return team

    def update_team(self, team_id, team_name):
        """Met à jour le nom d'une équipe."""
        query = "UPDATE Team SET team_name = %s, updated_at = %s WHERE id = %s"
        return self.execute_query(query, (team_name, datetime.now(), team_id))

    def delete_team(self, team_id):
        """Supprime une équipe."""
        query = "DELETE FROM Team WHERE id = %s"
        return self.execute_query(query, (team_id,))

    def insert_team_player(self, team_id, player_id, position, is_sub=False):
        """Ajoute un joueur à une équipe."""
        ic(f"DEBUG - insert_team_player called with:")
        ic(f"  team_id: {team_id} (type: {type(team_id)})")
        ic(f"  player_id: {player_id} (type: {type(player_id)})")
        ic(f"  position: {position} (type: {type(position)})")
        ic(f"  is_sub: {is_sub} (type: {type(is_sub)})")
        
        query = "INSERT INTO TeamPlayer (team_id, player_id, position, is_sub) VALUES (%s, %s, %s, %s)"
        return self.execute_query(query, (team_id, player_id, position, is_sub))

    def delete_team_players(self, team_id):
        """Supprime tous les joueurs d'une équipe."""
        query = "DELETE FROM TeamPlayer WHERE team_id = %s"
        return self.execute_query(query, (team_id,))

    # ==================== GAME ====================

    def _check_if_game_exists(self, player_id, id_match):
        """Vérifie si un match existe déjà dans la base de données."""
        query = "SELECT * FROM Games WHERE player_id = %s AND id_match = %s"
        return self.fetch_query(query, (player_id, id_match))


    def insert_game(self, date, type_game, win, role, kill, death, assists, total_team_kill, player_id, champion_id, id_match):
        """Insère un match dans la base de données."""

        # Vérifie si le match existe déjà
        if self._check_if_game_exists(player_id, id_match):
            return False

        query = """
        INSERT INTO Games (champion_id, player_id, kills, death, assists, total_team_kill, win, role_, date, type_game, id_match) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        return self.execute_query(query, (champion_id, player_id, kill, death, assists, total_team_kill, win, role, date, type_game, id_match))

    def update_game(self, game_id, **kwargs):
        """Met à jour un match avec des valeurs spécifiques."""
        set_clause = ", ".join(f"{key} = %s" for key in kwargs.keys())
        values = list(kwargs.values()) + [game_id]
        query = f"UPDATE Games SET {set_clause} WHERE id = %s"
        return self.execute_query(query, values)

    def get_games(self, **kwargs):
        """Récupère les matchs avec filtres dynamiques, incluant le nom du champion et le type de match."""

        where_clauses = []
        values = []
        for key, value in kwargs.items():
            if key == "date_range":  # Gestion des dates
                where_clauses.append("g.date BETWEEN %s AND %s")
                values.extend(value)
            elif key == "type_game":  # Gestion des types de match
                if isinstance(value, list):
                    placeholders = ", ".join(["%s"] * len(value))
                    where_clauses.append(f"g.type_game IN ({placeholders})")
                    values.extend(value)
                else:
                    where_clauses.append("g.type_game = %s")
                    values.extend(value)
            elif key == "champion":  # Gestion du champion
                placeholders = ", ".join(["%s"] * len(value))
                where_clauses.append(f"c.name IN ({placeholders})")
                values.extend(value)  
            elif key == "season":  # Gestion des saisons (calculées à partir de la date)
                if isinstance(value, list):
                    # Créer des conditions pour chaque saison
                    season_conditions = []
                    for season in value:
                        season_conditions.append(f"YEAR(g.date) = %s")
                        values.append(int(season) + 2010)  # Convertir saison en année
                    where_clauses.append(f"({' OR '.join(season_conditions)})")
                else:
                    where_clauses.append("YEAR(g.date) = %s")
                    values.append(int(value) + 2010)  # Convertir saison en année
            elif key == "role_":
                placeholders = ", ".join(["%s"] * len(value))
                where_clauses.append(f"g.{key} IN ({placeholders})")
                values.extend(value)
            else:
                where_clauses.append(f"g.{key} = %s")
                values.append(value)

        where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
        ic(where_clauses, where_clause)
        query = f"""
        SELECT g.*, c.name AS champion_name
        FROM Games g
        JOIN Champion c ON g.champion_id = c.id
        WHERE {where_clause}
        """

        ic(query)

        return self.fetch_query(query, values)



