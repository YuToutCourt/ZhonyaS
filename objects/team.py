class Team:
    def __init__(self, name, players):
        self.name = name
        self.players = players


    def get_average_solo_rank(self):
        """
        Each player has a rank, we need to get the average rank of the team
        Exemple of the rank: GOLD III (48 LP) - 17W/17L (Winrate: 50.00%) 

        Extract the rank from the string to get the rank and the LP value for each player
        """
        RANKS = ["I4", "I3", "I2", "I1", "B4", "B3", "B2", "B1", "S4", "S3", "S2", "S1", "G4", "G3", "G2", "G1", "P4", "P3", "P2", "P1", "E4", "E3", "E2", "E1", "D4", "D3", "D2", "D1","M1", "GM1", "C1"]

        points = 0
        for player in self.players:

            if player.get('player_stats').get('ranked_solo') is None:
                continue
            
            if player.get('player_stats').get('ranked_solo') == "GRANDMASTER":
                rank = "GM"
            else:
                rank = player.get('player_stats').get('ranked_solo').split(" ")[0][0]
            
            rank_number = player.get('player_stats').get('ranked_solo').split(" ")[1]
            rank_number = self._get_rank_number(rank_number)

            lp = int(player.get('player_stats').get('ranked_solo').split(" ")[2].replace("(", ""))

            points += RANKS.index(f"{rank}{rank_number}") * 100 + lp

        rank = RANKS[int((points/len(self.players)) // 100)]
        total_lp = int(points % 100)


        return f"{rank} {total_lp} LP"

    def get_average_flex_rank(self):

        RANKS = ["I4", "I3", "I2", "I1", "B4", "B3", "B2", "B1", "S4", "S3", "S2", "S1", "G4", "G3", "G2", "G1", "P4", "P3", "P2", "P1", "E4", "E3", "E2", "E1", "D4", "D3", "D2", "D1","M1", "GM1", "C1"]

        points = 0
        for player in self.players:
            if player.get('player_stats').get('ranked_flex') is None:
                continue
            
            if player.get('player_stats').get('ranked_flex') == "GRANDMASTER":
                rank = "GM"
            else:
                rank = player.get('player_stats').get('ranked_flex').split(" ")[0][0]
            
            rank_number = player.get('player_stats').get('ranked_flex').split(" ")[1]
            rank_number = self._get_rank_number(rank_number)

            lp = int(player.get('player_stats').get('ranked_flex').split(" ")[2].replace("(", ""))

            points += RANKS.index(f"{rank}{rank_number}") * 100 + lp

        rank = RANKS[int(points / len(self.players) // 100)]
        total_lp = int(points % 100)

        return f"{rank} {total_lp} LP"


    def _get_rank_number(self, rank_number):
        if rank_number == "I":
            return 1
        elif rank_number == "II":
            return 2
        elif rank_number == "III":
            return 3
        elif rank_number == "IV":
            return 4
