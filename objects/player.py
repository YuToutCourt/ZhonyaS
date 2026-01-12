import requests, time
from tabulate import tabulate
from objects.champion import Champion
from datetime import datetime

from icecream import ic

class Player:
    def __init__(self, name, tag, API_KEY):
        self.name = name
        self.tag = tag
        self.API_KEY = API_KEY # TODO: Move the way to call API
        self.champions = []
        self.puuid = self.__get_puuid()
        self.soloq = None
        self.flexq = None
        self.__get_rank() # Will set self.soloq and self.flexq
        self.profileIconId = None
        self.summonerLevel = None
        self.__get_summoner_details() # Will set profileIconId and summonerLevel
        self.global_kda = 0
        self.global_kill = 0
        self.global_death = 0
        self.global_assists = 0
        self.global_kp = 0
        self.global_winrate = 0
        self.nb_game = 0
        self.nb_win = 0
        self.nb_lose = 0
        self.team_kills = 0
        self.role = []
        self.score_moyen = 0


    def __get_puuid(self, retry_count=0):
        # Limite de tentatives pour éviter la récursion infinie
        if retry_count >= 10:
            print(f"Nombre maximum de tentatives atteint pour récupérer le PUUID")
            return False
            
        url = f"https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{self.name}/{self.tag}"
        headers = {"X-Riot-Token": self.API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:
            print(f"Rate limit atteint pour PUUID, tentative {retry_count + 1}/5")
            # Attendre plus longtemps pour les rate limits (5-30 secondes)
            wait_time = min(5 + (retry_count * 5), 30)  # 5s, 10s, 15s, 20s, 25s, 30s max
            print(f"Attente de {wait_time} secondes...")
            time.sleep(wait_time)
            return self.__get_puuid(retry_count + 1)
        
        if response.status_code != 200:
            print(f"Erreur {response.status_code}: {response.json()}")
            return False

        if response.json().get("puuid", None) is None:
            return False

        self.puuid = response.json()["puuid"]
        return self.puuid
    

    def __get_rank(self, retry_count=0):
        if self.puuid is None: return False
        
        # Limite de tentatives pour éviter la récursion infinie
        if retry_count >= 10:
            print(f"Nombre maximum de tentatives atteint pour récupérer le rank")
            return None
            
        url = f"https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/{self.puuid}"
        headers = {"X-Riot-Token": self.API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:
            print(f"Rate limit atteint pour rank, tentative {retry_count + 1}/5")
            # Attendre plus longtemps pour les rate limits (5-30 secondes)
            wait_time = min(5 + (retry_count * 5), 30)  # 5s, 10s, 15s, 20s, 25s, 30s max
            print(f"Attente de {wait_time} secondes...")
            time.sleep(wait_time)
            return self.__get_rank(retry_count + 1)
            
        if response.status_code != 200:
            print(f"Erreur {response.status_code}: {response.json()}")
            return None

        rank_data = response.json()

        for queue in rank_data:
            if queue["queueType"] == "RANKED_SOLO_5x5":
                self.soloq = f"{queue['tier']} {queue['rank']} ({queue['leaguePoints']} LP) - {queue['wins']}W/{queue['losses']}L (Winrate: {queue['wins'] / (queue['wins'] + queue['losses']) * 100:.2f}%)"
            elif queue["queueType"] == "RANKED_FLEX_SR":
                self.flexq = f"{queue['tier']} {queue['rank']} ({queue['leaguePoints']} LP) - {queue['wins']}W/{queue['losses']}L (Winrate: {queue['wins'] / (queue['wins'] + queue['losses']) * 100:.2f}%)"	

        return self.soloq, self.flexq
    
    def __get_summoner_details(self, retry_count=0):
        """
        Récupère les détails du summoner (profileIconId et summonerLevel) à partir du PUUID.
        Utilise l'endpoint GET /lol/summoner/v4/summoners/by-puuid/{puuid}
        
        :param retry_count: Nombre de tentatives déjà effectuées
        :return: Tuple (profileIconId, summonerLevel) ou (None, None) si erreur
        """
        if self.puuid is None:
            return None, None
            
        # Limite de tentatives pour éviter la récursion infinie
        if retry_count >= 10:
            print(f"Nombre maximum de tentatives atteint pour récupérer les détails du summoner")
            return None, None
            
        url = f"https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{self.puuid}"
        headers = {"X-Riot-Token": self.API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:
            print(f"Rate limit atteint pour les détails du summoner, tentative {retry_count + 1}/10")
            # Attendre plus longtemps pour les rate limits (5-30 secondes)
            wait_time = min(5 + (retry_count * 5), 30)  # 5s, 10s, 15s, 20s, 25s, 30s max
            print(f"Attente de {wait_time} secondes...")
            time.sleep(wait_time)
            return self.__get_summoner_details(retry_count + 1)
            
        if response.status_code != 200:
            print(f"Erreur {response.status_code}: {response.json()}")
            return None, None

        summoner_data = response.json()
        
        # Récupérer profileIconId et summonerLevel
        self.profileIconId = summoner_data.get("profileIconId")
        self.summonerLevel = summoner_data.get("summonerLevel")
        
        return self.profileIconId, self.summonerLevel

    def get_account_by_puuid(self, puuid, retry_count=0):
        """
        Récupère les informations de compte (nom et tag) à partir d'un PUUID.
        Utilise l'endpoint GET /riot/account/v1/accounts/by-puuid/{puuid}
        
        :param puuid: PUUID du joueur
        :param retry_count: Nombre de tentatives déjà effectuées
        :return: Dictionnaire avec gameName et tagLine, ou None si erreur
        """
        # Limite de tentatives pour éviter la récursion infinie
        if retry_count >= 10:
            print(f"Nombre maximum de tentatives atteint pour récupérer le compte par PUUID")
            return None
            
        url = f"https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/{puuid}"
        headers = {"X-Riot-Token": self.API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:
            print(f"Rate limit atteint pour compte par PUUID, tentative {retry_count + 1}/10")
            # Attendre plus longtemps pour les rate limits (5-30 secondes)
            wait_time = min(5 + (retry_count * 5), 30)  # 5s, 10s, 15s, 20s, 25s, 30s max
            print(f"Attente de {wait_time} secondes...")
            time.sleep(wait_time)
            return self.get_account_by_puuid(puuid, retry_count + 1)
            
        if response.status_code != 200:
            print(f"Erreur {response.status_code}: {response.json()}")
            return None

        account_data = response.json()
        
        # Vérifier que les champs requis sont présents
        if not account_data.get("gameName") or not account_data.get("tagLine"):
            print(f"Données de compte incomplètes: {account_data}")
            return None
            
        return {
            "gameName": account_data["gameName"],
            "tagLine": account_data["tagLine"],
            "puuid": account_data["puuid"]
        }


    def get_matchs_history(self, start_time=None, end_time=None, match_type=None, start=0, count=20, matchs=None, retry_count=0):
        """
        Récupère la liste des matchs d'un joueur à partir de son PUUID.

        :param puuid: Identifiant unique du joueur (PUUID)
        :param start_time: (Optionnel) Les datas des matchs disponibles commencent le 01/01/2023 (Linux Timestamp en secondes)
        :param end_time: (Optionnel) Linux Timestamp de fin en secondes pour la recherche
        :param queue: (Optionnel) ID de la file (ex: 420 pour Ranked Solo/Duo)
        :param match_type: (Optionnel) Type de match (ex: "ranked", "normal", "tourney")
        :param start: (Optionnel) Index de départ (par défaut: 0)
        :param count: (Optionnel) Nombre de matchs à récupérer (1-100, par défaut: 20)
        :param matchs: (Optionnel) Liste des matchs déjà récupérés
        :param retry_count: (Optionnel) Nombre de tentatives déjà effectuées
        :return: Liste des IDs des matchs
        """
        # Initialiser matchs si None
        if matchs is None:
            matchs = []
            
        # Limite de tentatives pour éviter la récursion infinie
        if retry_count >= 10:
            print(f"Nombre maximum de tentatives atteint pour l'historique des matchs")
            return matchs

        if count < 100:
            nb_matchs = count
        else:
            nb_matchs = 100

        url = f"https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/{self.puuid}/ids?start={start}&count={nb_matchs}"

        if start_time:
            url += f"&startTime={start_time}"
        if end_time:
            url += f"&endTime={end_time}"
        if match_type:
            if isinstance(match_type, str):
                url += f"&type={match_type}"
            elif isinstance(match_type, int):
                url += f"&queue={match_type}"
            else:
                ic(f"Issue on match type {match_type}")

        headers = {"X-Riot-Token": self.API_KEY}
        print(url, headers)
        response = requests.get(url, headers=headers)
        
        # Gestion des erreurs de rate limit avec retry intelligent
        if response.status_code == 429:
            print(f"Rate limit atteint pour l'historique, tentative {retry_count + 1}/10")
            
            # Récupération des headers de rate limit
            retry_after = response.headers.get('Retry-After')
            x_rate_limit_type = response.headers.get('X-Rate-Limit-Type', '')
            
            # Calcul du temps d'attente basé sur les headers API
            if retry_after:
                wait_time = int(retry_after)
                print(f"API recommande d'attendre {wait_time}s")
            else:
                # Attente progressive basée sur le type de rate limit
                if 'application' in x_rate_limit_type.lower():
                    wait_time = 60  # 1 minute pour rate limit application
                elif 'method' in x_rate_limit_type.lower():
                    wait_time = 30  # 30 secondes pour rate limit méthode
                else:
                    wait_time = min(5 + (retry_count * 3), 30)  # 5s, 8s, 11s, 14s, 17s, 20s, 23s, 26s, 29s, 30s max
            
            print(f"Attente de {wait_time} secondes...")
            time.sleep(wait_time)
            return self.get_matchs_history(start_time, end_time, match_type, start, count, matchs, retry_count + 1)
        
        if response.status_code != 200:
            print(f"Erreur {response.status_code}: {response.json()}")
            return matchs

        new_matchs = response.json()

        if len(new_matchs) == 0:
            return matchs

        matchs.extend(new_matchs)

        if len(matchs) < count:
            print(f"Récupération des matchs ({match_type}) {len(matchs)}/{count}")
            return self.get_matchs_history(start_time, end_time, match_type, len(matchs), count, matchs, 0)  # Reset retry_count for pagination
        
        return matchs
    
    def get_match_info(self, match_id, retry_count=0):
        """
        Récupère les informations d'un match à partir de son ID.

        :param match_id: ID du match
        :param retry_count: Nombre de tentatives déjà effectuées
        :return: Informations du match (Champions, KDA, Kill, death, assist, DPM, gameLength, KillParticipation, VisionScore, CS, Win/Lose)
        """
        # Limite de tentatives pour éviter la récursion infinie
        if retry_count >= 10:
            print(f"Nombre maximum de tentatives atteint pour le match {match_id}")
            return None
            
        url = f"https://europe.api.riotgames.com/lol/match/v5/matches/{match_id}"
        headers = {"X-Riot-Token": self.API_KEY}
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:
            print(f"Rate limit atteint pour le match {match_id}, tentative {retry_count + 1}/10")
            
            # Récupération des headers de rate limit
            retry_after = response.headers.get('Retry-After')
            x_rate_limit_type = response.headers.get('X-Rate-Limit-Type', '')
            
            # Calcul du temps d'attente basé sur les headers API
            if retry_after:
                wait_time = int(retry_after)
                print(f"API recommande d'attendre {wait_time}s")
            else:
                # Attente progressive basée sur le type de rate limit
                if 'application' in x_rate_limit_type.lower():
                    wait_time = 60  # 1 minute pour rate limit application
                elif 'method' in x_rate_limit_type.lower():
                    wait_time = 30  # 30 secondes pour rate limit méthode
                else:
                    wait_time = min(5 + (retry_count * 3), 30)  # 5s, 8s, 11s, 14s, 17s, 20s, 23s, 26s, 29s, 30s max
            
            print(f"Attente de {wait_time} secondes...")
            time.sleep(wait_time)
            return self.get_match_info(match_id, retry_count + 1)
        
        if response.status_code != 200:
            print(f"Erreur {response.status_code}: {response.json()}")
            ic(match_id)
            return None

        match_data = response.json()

        if match_data["info"]["gameMode"] != "CLASSIC":
            return None

        if len(match_data["metadata"]["participants"]) != 10:
            return None
        
        if match_data["info"]["gameDuration"] < 300:
            return None
        
        # Total des kills de l'équipe du joueur
        player_team_id = None
        total_team_kills = 0

        # Trouver l'équipe du joueur
        for participant in match_data["info"]["participants"]:
            if participant["puuid"] == self.puuid:
                player_team_id = participant["teamId"]
                break

        if player_team_id is None:
            return None

        # Calcul des kills de l'équipe
        for participant in match_data["info"]["participants"]:
            if participant["teamId"] == player_team_id:
                total_team_kills += participant["kills"]

        date = datetime.fromtimestamp(match_data["info"]["gameCreation"] // 1000).strftime("%Y-%m-%d")

        # Trouver les infos du joueur
        for participant in match_data["info"]["participants"]:
            if participant["puuid"] == self.puuid:
                stats = {
                    "Champion": participant["championName"],
                    "Kills": participant["kills"],
                    "Deaths": participant["deaths"],
                    "Assists": participant["assists"],
                    "total_kill": total_team_kills,
                    "Win": participant["win"],
                    "TeamPosition": participant["teamPosition"],
                    "Date": date,
                    "MatchId": match_id
                }
                return stats
        
        return None
    

    def add_data_to_db(self, db, player_id, champion_id, game, type_game):
        """
        Ajoute les données d'un match à la base de données.

        :param db: Objet de la base de données
        :param player_id: ID du joueur
        :param champion_id: ID du champion
        :param game: Informations d'un match
        """

        db.insert_game(
            date=game["Date"],
            type_game=type_game,
            win=game["Win"],
            role=game["TeamPosition"],
            kill=game["Kills"],
            death=game["Deaths"],
            assists=game["Assists"],
            total_team_kill=game["total_kill"],
            player_id=player_id,
            champion_id=champion_id,
            id_match=game["MatchId"]
        )

    
    def build_stats(self, game):
        """
        Construit les statistiques d'un joueur à partir d'un match.

        :param game: Informations d'un match
        Exemple:
        {'assists': 1,
        'champion_id': 52,
        'champion_name': 'Jax',
        'date': datetime.date(2025, 3, 3),
        'death': 5,
        'id': 27,
        'id_match': 'EUW1_7325519309',
        'kills': 1,
        'player_id': 2,
        'role_': 'JUNGLE',
        'total_team_kill': 4,
        'type_game': 'ranked',
        'win': 0}
        """

        champion = Champion(game["champion_name"])

        if champion not in self.champions:
            self.champions.append(champion)
        else:
            champion = self.champions[self.champions.index(champion)]

        if game["win"]:
            champion.add_win(1)
        else:
            champion.add_lose(1)

        champion.add_kill(game["kills"])
        champion.add_death(game["death"])
        champion.add_assit(game["assists"])
        champion.add_team_kills(game["total_team_kill"])

        return champion
    

    def get_all_stats(self, role):
        self.role = role
        ic(self.role, role)
        
        # Filter champions with at least 10 games for score calculation
        champions_with_min_games = [champion for champion in self.champions if champion.nombre_de_parties >= 10]
        
        for champion in self.champions:
            self.global_kill += champion.kill
            self.global_death += champion.death
            self.global_assists += champion.assit
            self.nb_game += champion.nombre_de_parties
            self.nb_win += champion.nombre_win
            self.nb_lose += champion.nombre_lose
            self.team_kills += champion.team_kills

        # Calculate score moyen only with champions having at least 10 games
        if champions_with_min_games:
            total_score = sum(champion.calculates_dangerousness() for champion in champions_with_min_games)
            self.score_moyen = round(total_score / len(champions_with_min_games), 2)
        else:
            self.score_moyen = 0
        
        self.global_kda = round((self.global_kill + self.global_assists) / max(1, self.global_death), 2)
        self.global_kp = round((self.global_kill + self.global_assists) / max(1, self.team_kills)* 100, 2)
        self.global_winrate = round((self.nb_win / self.nb_game) * 100, 2)

        return self.global_kda, self.global_kp, self.global_winrate, self.global_kill, self.global_death, self.global_assists, self.nb_game, self.nb_lose, self.role, self.score_moyen




    def display_stats(self):
        headers = ["Nom du Champion", "Nombre de Parties", "Winrate", "KDA", "KP", "Dangerosité"]
        data = []
        
        min_games_required = 1 if self.nb_game < 50 else (1 + ((self.nb_game // 100 - 1)))
        for champion in sorted(self.champions, key=lambda x: x.dangerousness, reverse=True):
            
            if champion.nombre_de_parties < min_games_required: continue
            data.append([
                champion.nom,
                champion.nombre_de_parties,
                f"{champion.winrate}% ({champion.nombre_win}W/{champion.nombre_lose}L)",
                f"{champion.get_kda()} ({champion.kill}/{champion.death}/{champion.assit})",
                f"{champion.get_kill_participation()}%",
                champion.dangerousness
            ])

        print(f"Joueur : {self.name}")
        print(f"SoloQ  : {self.soloq}")
        print(f"FlexQ  : {self.flexq}")
        print(f"Score Moyen : {self.score_moyen}")
        print(tabulate(data, headers=headers, tablefmt="pretty"))
