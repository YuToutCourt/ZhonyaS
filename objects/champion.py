import math

class Champion:
    def __init__(self, nom):
        self.nom = nom
        self.kill = 0
        self.death = 0
        self.assit = 0
        self.nombre_win = 0
        self.nombre_lose = 0
        self.nombre_de_parties = 0
        self.winrate = None
        self.dangerousness = None
        self.team_kills = 0

    def calculates_winrate(self):
        return round(100 * self.nombre_win / (self.nombre_win + self.nombre_lose), 2)

    def calculates_dangerousness(self):
        if self.nombre_de_parties == 0:
            return 0

        # --- 1. Performance micro (faible influence) ---
        kda_score = min(self.get_kda() / 10, 1)  # normalisé, plafonné à 1
        kp_score = self.get_kill_participation() / 100  # entre 0 et 1
        micro_performance = (0.6 * kda_score + 0.4 * kp_score) * 100

        # --- 2. Efficacité (winrate non linéaire) ---
        winrate_factor = 1 / (1 + math.exp(-(self.winrate - 50) / 5))
        efficiency = 100 * winrate_factor

        # --- 3. Fiabilité (nombre de parties) ---
        raw_confidence = 1 / (1 + math.exp(-(self.nombre_de_parties - 10) / 2))
        confidence = 0.3 + 0.7 * raw_confidence  # min 0.3, max 1

        # --- 4. Bonus par paliers de 25 parties ---
        # 0–24 → 0
        # 25–49 → +10
        # 50–74 → +20
        # ...
        # Limité à 100 (modifiable)
        palier_bonus = (self.nombre_de_parties // 25) * 10
        palier_bonus = min(palier_bonus, 100)

        # --- 5. Score global ---
        score = (
            0.65 * efficiency +        # Winrate : poids principal
            0.25 * micro_performance + # Micro-perf : poids moyen
            palier_bonus               # Bonus d’expérience par paliers
        )

        score *= confidence  # fiabilité (volume) → amplifie les valeurs sûres

        return round(score, 2)

    
    def add_win(self, nombre_win):
        self.nombre_win += nombre_win
        self.nombre_de_parties += nombre_win
        self.winrate = self.calculates_winrate()
        self.dangerousness = self.calculates_dangerousness()

    def add_lose(self, nombre_lose):
        self.nombre_lose += nombre_lose
        self.nombre_de_parties += nombre_lose
        self.winrate = self.calculates_winrate()
        self.dangerousness = self.calculates_dangerousness()

    def get_kda(self):
        return round((self.kill + self.assit) / max(1, self.death), 2)
    
    def get_kill_participation(self):
        return round((self.kill + self.assit) / max(1, self.team_kills)* 100, 2)

    def add_kill(self, nb_kill):
        self.kill += nb_kill

    def add_death(self, nb_death):
        self.death += nb_death

    def add_assit(self, nb_assit):
        self.assit += nb_assit

    def add_team_kills(self, team_kills):
        self.team_kills += team_kills
    
    def __eq__(self, __value: object) -> bool:
        return self.nom == __value.nom
    
    def __hash__(self) -> int:
        return hash(self.nom)