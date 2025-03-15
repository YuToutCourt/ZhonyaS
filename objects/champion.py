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
        winrate_weight = 4 + (self.nombre_de_parties / 20)
        kda_weight = 4 + (self.nombre_de_parties / 20)
        parties_weight = 3
        kill_participation_weight = 2.5 + (self.nombre_de_parties / 20)

        score = (
            winrate_weight * self.winrate +
            parties_weight * self.nombre_de_parties +
            kda_weight * self.get_kda() +
            kill_participation_weight * self.get_kill_participation()
        )

        if self.nombre_de_parties >= 15 and self.winrate >= 52:
            score += self.winrate

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