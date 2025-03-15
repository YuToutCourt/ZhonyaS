import mysql.connector
from mysql.connector import Error
from icecream import ic
import os
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
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            ic(f"Erreur SQL: {e}")
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



