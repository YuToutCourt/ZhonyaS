import requests
import json


class LoLCoach:
    def __init__(self, model="deepseek-r1", endpoint="http://localhost:11434/api/chat"):
        self.model = model
        self.endpoint = endpoint
        self.pre_prompt = """Tu es un coach professionnel de League of Legends avec une expertise approfondie du jeu.
Tu as une connaissance détaillée des champions, des stratégies, des matchups et de la méta actuelle.
Tu dois fournir des analyses précises, stratégiques et actionnables basées sur les données fournies.
Tes réponses doivent être claires, structurées et directement applicables en jeu."""
        self.messages = [
            {"role": "system", "content": self.pre_prompt}
        ]
    
    def ask(self, question, stream=False):
        """Envoie une question au modèle AI et retourne la réponse"""
        self.messages.append({"role": "user", "content": question})
        payload = {
            "model": self.model,
            "messages": self.messages,
            "stream": stream
        }

        if stream:
            with requests.post(self.endpoint, json=payload, stream=True) as response:
                full_response = ""
                for line in response.iter_lines():
                    if line:
                        data = json.loads(line.decode("utf-8"))
                        if "message" in data and "content" in data["message"]:
                            content = data["message"]["content"]
                            full_response += content
                self.messages.append({"role": "assistant", "content": full_response})
                return full_response
        else:
            response = requests.post(self.endpoint, json=payload)
            data = response.json()
            answer = data["message"]["content"]
            self.messages.append({"role": "assistant", "content": answer})
            return answer
    
    def reset_conversation(self):
        """Réinitialise la conversation en gardant uniquement le prompt système"""
        self.messages = [
            {"role": "system", "content": self.pre_prompt}
        ]
    
    def analyze_player_matchup(self, player1_data, player2_data, position):
        """
        Analyse un matchup entre deux joueurs d'une position spécifique
        
        Args:
            player1_data: Dictionnaire contenant les données du joueur 1
            player2_data: Dictionnaire contenant les données du joueur 2
            position: La position (TOP, JUNGLE, MID, ADC, SUPPORT)
        
        Returns:
            str: L'analyse du matchup
        """
        # Construire le prompt pour l'analyse
        prompt = f"""Analyse le matchup {position} entre ces deux joueurs:

**Joueur 1: {player1_data.get('name')}#{player1_data.get('tag')}**
- Rank Solo/Duo: {player1_data.get('ranked_solo', 'Non classé')}
- Rank Flex: {player1_data.get('ranked_flex', 'Non classé')}
- Total de parties: {player1_data.get('total_games', 0)}
- Winrate: {player1_data.get('winrate', 0):.1f}%
- KDA: {player1_data.get('kda', 0):.2f}
- Pool de champions (Top 3):
"""
        
        # Ajouter les champions du joueur 1
        for i, champ in enumerate(player1_data.get('all_champions', [])[:3], 1):
            prompt += f"  {i}. {champ['champion_name']} - {champ['games_played']} parties, {champ['winrate']:.1f}% WR, {champ['kda']:.2f} KDA\n"
        
        prompt += f"""

**Joueur 2: {player2_data.get('name')}#{player2_data.get('tag')}**
- Rank Solo/Duo: {player2_data.get('ranked_solo', 'Non classé')}
- Rank Flex: {player2_data.get('ranked_flex', 'Non classé')}
- Total de parties: {player2_data.get('total_games', 0)}
- Winrate: {player2_data.get('winrate', 0):.1f}%
- KDA: {player2_data.get('kda', 0):.2f}
- Pool de champions (Top 3):
"""
        
        # Ajouter les champions du joueur 2
        for i, champ in enumerate(player2_data.get('all_champions', [])[:3], 1):
            prompt += f"  {i}. {champ['champion_name']} - {champ['games_played']} parties, {champ['winrate']:.1f}% WR, {champ['kda']:.2f} KDA\n"
        
        prompt += """

En tenant compte de ces données, fournis une analyse détaillée comprenant:

1. **Avantage de niveau et expérience**: Compare les rangs et l'expérience des deux joueurs
2. **Matchups de champions**: Analyse les matchups possibles entre leurs pools de champions
3. **Points forts et faibles**: Identifie les forces et faiblesses de chaque joueur
4. **Recommandations stratégiques**: Comment le Joueur 1 devrait aborder ce matchup
5. **Picks et bans suggérés**: Quels champions pick ou ban en priorité

Sois concis mais précis dans ton analyse."""
        
        return self.ask(prompt)
    
    def analyze_team_draft(self, team1_data, team2_data, target_team=1):
        """
        Analyse complète d'une équipe et donne des recommandations de draft
        
        Args:
            team1_data: Dictionnaire contenant les données de l'équipe 1
            team2_data: Dictionnaire contenant les données de l'équipe 2
            target_team: Quelle équipe analyser (1 ou 2)
        
        Returns:
            str: L'analyse de draft
        """
        target = team1_data if target_team == 1 else team2_data
        opponent = team2_data if target_team == 1 else team1_data
        
        prompt = f"""Analyse cette composition d'équipe et fournis des recommandations de draft:

**ÉQUIPE À ANALYSER: {target['team_name']}**
- Rank moyen Solo/Duo: {target['stats'].get('ranked_solo_avg', 'Non classé')}
- Rank moyen Flex: {target['stats'].get('ranked_flex_avg', 'Non classé')}
- Total de parties: {target['stats'].get('total_games', 0)}
- Winrate global: {target['stats'].get('winrate', 0):.1f}%

**Composition et pools de champions:**
"""
        
        positions = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
        for pos in positions:
            player = next((p for p in target['players'] if p['position'] == pos), None)
            if player and not player.get('is_sub'):
                prompt += f"\n{pos} - {player['player_name']}#{player['player_tag']}:\n"
                if player.get('player_stats'):
                    stats = player['player_stats']
                    prompt += f"  - Rank: {stats.get('ranked_solo', 'Non classé')}\n"
                    prompt += f"  - Winrate: {stats.get('winrate', 0):.1f}% sur {stats.get('total_games', 0)} parties\n"
                
                if player.get('all_champions'):
                    prompt += "  - Champions principaux:\n"
                    for champ in player['all_champions'][:5]:
                        prompt += f"    • {champ['champion_name']}: {champ['games_played']}G, {champ['winrate']:.1f}% WR, {champ['kda']:.2f} KDA\n"
        
        prompt += f"""

**ÉQUIPE ADVERSE: {opponent['team_name']}**
- Rank moyen Solo/Duo: {opponent['stats'].get('ranked_solo_avg', 'Non classé')}
- Rank moyen Flex: {opponent['stats'].get('ranked_flex_avg', 'Non classé')}
- Total de parties: {opponent['stats'].get('total_games', 0)}
- Winrate global: {opponent['stats'].get('winrate', 0):.1f}%

**Composition adverse (résumé):**
"""
        
        for pos in positions:
            player = next((p for p in opponent['players'] if p['position'] == pos), None)
            if player and not player.get('is_sub'):
                prompt += f"\n{pos} - {player['player_name']}#{player['player_tag']}:\n"
                if player.get('all_champions'):
                    champs_list = ", ".join([c['champion_name'] for c in player['all_champions'][:3]])
                    prompt += f"  - Pool principal: {champs_list}\n"
        
        prompt += """

En tenant compte de ces informations, fournis une analyse stratégique complète:

1. **Forces et faiblesses de l'équipe**: Analyse globale du niveau et du style de jeu
2. **Synergies de champions**: Quels champions de leur pool fonctionnent bien ensemble
3. **Menaces adverses**: Identifie les dangers principaux de l'équipe adverse
4. **Stratégie de draft recommandée**:
   - Phase de bans: Quels champions bannir et pourquoi
   - Priorités de picks: Quels champions choisir en priorité pour chaque position
   - Composition suggérée: Une composition d'équipe idéale en fonction des pools disponibles
5. **Plan de jeu**: Comment approcher la partie (early game, objectifs, teamfights, etc.)

Sois stratégique et prends en compte les synergies possibles entre les champions disponibles dans les pools."""
        
        return self.ask(prompt)

