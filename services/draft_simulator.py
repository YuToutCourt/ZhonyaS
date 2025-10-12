import random
from typing import List, Dict, Optional, Tuple
from services.lol_ai_coach import LoLCoach


class DraftPhase:
    """Représente une phase du draft"""
    BAN = "BAN"
    PICK = "PICK"


class DraftSide:
    """Représente un côté de la map"""
    BLUE = "BLUE"
    RED = "RED"


class DraftSimulator:
    """Simule un draft de League of Legends avec IA"""
    
    # Séquence complète du draft (side, phase, nombre)
    DRAFT_SEQUENCE = [
        # Phase 1: 6 bans alternés
        (DraftSide.BLUE, DraftPhase.BAN, 1),
        (DraftSide.RED, DraftPhase.BAN, 1),
        (DraftSide.BLUE, DraftPhase.BAN, 1),
        (DraftSide.RED, DraftPhase.BAN, 1),
        (DraftSide.BLUE, DraftPhase.BAN, 1),
        (DraftSide.RED, DraftPhase.BAN, 1),
        
        # Phase 2: 6 picks (bleu, rouge x2, bleu x2, rouge)
        (DraftSide.BLUE, DraftPhase.PICK, 1),
        (DraftSide.RED, DraftPhase.PICK, 1),
        (DraftSide.RED, DraftPhase.PICK, 2),
        (DraftSide.BLUE, DraftPhase.PICK, 2),
        (DraftSide.BLUE, DraftPhase.PICK, 3),
        (DraftSide.RED, DraftPhase.PICK, 3),
        
        # Phase 3: 4 bans alternés
        (DraftSide.RED, DraftPhase.BAN, 2),
        (DraftSide.BLUE, DraftPhase.BAN, 2),
        (DraftSide.RED, DraftPhase.BAN, 2),
        (DraftSide.BLUE, DraftPhase.BAN, 2),
        
        # Phase 4: 4 picks finaux
        (DraftSide.RED, DraftPhase.PICK, 4),
        (DraftSide.BLUE, DraftPhase.PICK, 4),
        (DraftSide.BLUE, DraftPhase.PICK, 5),
        (DraftSide.RED, DraftPhase.PICK, 5),
    ]
    
    # Les positions ne sont pas assignées pendant le draft
    # Elles seront décidées par l'équipe après le draft
    
    def __init__(self, team1_data: Dict, team2_data: Dict, player_side: str, player_team: int):
        """
        Initialise le simulateur de draft
        
        Args:
            team1_data: Données de l'équipe 1
            team2_data: Données de l'équipe 2
            player_side: Côté du joueur (BLUE ou RED)
            player_team: Équipe du joueur (1 ou 2)
        """
        self.team1_data = team1_data
        self.team2_data = team2_data
        self.player_side = player_side
        self.player_team = player_team
        
        # Déterminer quelle équipe est contrôlée par l'IA
        self.ai_team = 2 if player_team == 1 else 1
        self.ai_side = DraftSide.RED if player_side == DraftSide.BLUE else DraftSide.BLUE
        
        # État du draft
        self.blue_bans = []   # Bans de l'équipe bleue
        self.red_bans = []    # Bans de l'équipe rouge
        self.blue_picks = []  # Liste de (champion, pick_number)
        self.red_picks = []   # Liste de (champion, pick_number)
        self.current_step = 0
        
        # Coach IA
        self.coach = LoLCoach()
    
    def get_current_phase(self) -> Optional[Tuple[str, str, int]]:
        """Retourne la phase actuelle du draft"""
        if self.current_step >= len(self.DRAFT_SEQUENCE):
            return None
        phase = self.DRAFT_SEQUENCE[self.current_step]
        print(f"DEBUG get_current_phase: current_step={self.current_step}, phase={phase}")
        return phase
    
    def is_draft_complete(self) -> bool:
        """Vérifie si le draft est terminé"""
        return self.current_step >= len(self.DRAFT_SEQUENCE)
    
    def get_available_champions(self, all_champions: List[str]) -> List[str]:
        """Retourne la liste des champions disponibles (non bannis et non pickés)"""
        picked_champions = [p[0] for p in self.blue_picks] + [p[0] for p in self.red_picks]
        banned_champions = self.blue_bans + self.red_bans
        unavailable = banned_champions + picked_champions
        return [champ for champ in all_champions if champ not in unavailable]
    
    def get_team_data(self, team_num: int) -> Dict:
        """Retourne les données d'une équipe"""
        return self.team1_data if team_num == 1 else self.team2_data
    
    def get_player_pool(self, team_num: int, position: str) -> List[str]:
        """Retourne le pool de champions d'un joueur à une position donnée"""
        team_data = self.get_team_data(team_num)
        
        for player in team_data.get('players', []):
            if player.get('position') == position and not player.get('is_sub'):
                champions = player.get('all_champions', [])
                # Retourner TOUS les champions du joueur, pas seulement le top 3 ou 10
                return [champ['champion_name'] for champ in champions]
        
        return []
    
    def ai_make_decision(self, phase: str, all_champions: List[str]) -> str:
        """L'IA prend une décision de ban ou pick"""
        available_champions = self.get_available_champions(all_champions)
        
        if not available_champions:
            return None
        
        # Préparer le contexte pour l'IA
        context = self._build_ai_context(phase)
        
        if phase == DraftPhase.BAN:
            prompt = self._build_ban_prompt(context, available_champions)
        else:
            prompt = self._build_pick_prompt(context, available_champions)
        
        try:
            # Demander à l'IA
            response = self.coach.ask(prompt)
            
            # Extraire le champion de la réponse
            champion = self._extract_champion_from_response(response, available_champions)
            
            if champion:
                return champion
            
        except Exception as e:
            print(f"Erreur IA: {e}")
        
        # Fallback: choix intelligent basique
        return self._fallback_decision(phase, available_champions)
    
    def _build_ai_context(self, phase: str) -> str:
        """Construit le contexte actuel du draft pour l'IA"""
        ai_team_data = self.get_team_data(self.ai_team)
        player_team_data = self.get_team_data(self.player_team)
        
        ai_picks = self.blue_picks if self.ai_side == DraftSide.BLUE else self.red_picks
        player_picks = self.red_picks if self.ai_side == DraftSide.BLUE else self.blue_picks
        
        # Construire les strings de picks pour éviter les f-strings imbriqués
        ai_picks_str = ', '.join([f"{p[0]} ({p[1]})" for p in ai_picks]) if ai_picks else 'Aucun'
        player_picks_str = ', '.join([f"{p[0]} ({p[1]})" for p in player_picks]) if player_picks else 'Aucun'
        
        context = f"""
**État actuel du draft:**

**Équipe IA ({ai_team_data['team_name']}) - Side {self.ai_side}:**
- Picks: {ai_picks_str}
- Pool de champions disponibles par position:
"""
        
        for position in ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']:
            pool = self.get_player_pool(self.ai_team, position)
            # Exclure les champions bannis et pickés
            available_pool = [c for c in pool if c in self.get_available_champions(pool)]
            if available_pool:
                # Afficher tous les champions disponibles du pool
                context += f"  - {position}: {', '.join(available_pool)}\n"
        
        # Construire les strings de bans pour éviter les f-strings imbriqués
        blue_bans_str = ', '.join(self.blue_bans) if self.blue_bans else 'Aucun'
        red_bans_str = ', '.join(self.red_bans) if self.red_bans else 'Aucun'
        
        context += f"""
**Équipe Adverse ({player_team_data['team_name']}) - Side {self.player_side}:**
- Picks: {player_picks_str}

**Champions bannis:**
- Équipe Bleue: {blue_bans_str}
- Équipe Rouge: {red_bans_str}

**Phase actuelle:** {phase}
"""
        
        return context
    
    def _build_ban_prompt(self, context: str, available_champions: List[str]) -> str:
        """Construit le prompt pour un ban"""
        player_team_data = self.get_team_data(self.player_team)
        
        # Analyser les menaces dans le pool adverse
        threats = []
        for position in ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']:
            pool = self.get_player_pool(self.player_team, position)
            available_pool = [c for c in pool if c in available_champions]
            if available_pool:
                # Prendre TOUS les champions disponibles du pool
                threats.extend(available_pool)
        
        prompt = f"""{context}

Tu dois choisir UN champion à bannir.

**Champions menaçants de l'équipe adverse (par position):**
"""
        # Afficher les menaces par position pour mieux informer l'IA
        for position in ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']:
            pool = self.get_player_pool(self.player_team, position)
            available_pool = [c for c in pool if c in available_champions]
            if available_pool:
                prompt += f"- {position}: {', '.join(available_pool)}\n"
        
        prompt += f"""

**Critères de décision:**
1. Bannir les champions signature de l'adversaire (champions avec beaucoup de parties et bon winrate)
2. Bannir les champions meta actuellement forts
3. Éviter de bannir des champions déjà faibles ou hors meta
4. Considérer les synergies avec ce qui a déjà été banni

Réponds UNIQUEMENT avec le nom exact du champion à bannir, rien d'autre.
Exemple de réponse: "Yasuo" ou "Lee Sin" ou "Twisted Fate"
"""
        
        return prompt
    
    def _build_pick_prompt(self, context: str, available_champions: List[str]) -> str:
        """Construit le prompt pour un pick"""
        ai_picks = self.blue_picks if self.ai_side == DraftSide.BLUE else self.red_picks
        next_pick_number = len(ai_picks) + 1
        
        # Obtenir tous les pools de champions disponibles
        all_available_pools = {}
        for position in ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']:
            player_pool = self.get_player_pool(self.ai_team, position)
            available_pool = [c for c in player_pool if c in available_champions]
            if available_pool:
                # Afficher TOUS les champions disponibles du pool
                all_available_pools[position] = available_pool
        
        pools_text = "\n".join([f"  - {pos}: {', '.join(champs)}" for pos, champs in all_available_pools.items()])
        
        prompt = f"""{context}

Tu dois choisir UN champion (pick #{next_pick_number}).

**Champions disponibles dans les pools de l'équipe (par position):**
{pools_text if pools_text else 'Pools limités - choisir parmi tous les champions disponibles'}

**Critères de décision:**
1. Choisir un champion des pools de l'équipe (ils le maîtrisent)
2. Créer des synergies avec les picks déjà effectués
3. Counterpick l'adversaire si possible
4. Rester flexible (champions flex qui peuvent jouer plusieurs positions)
5. Prioriser les champions forts dans la méta
6. Ne pas assigner de position maintenant (décidé après le draft)

Réponds UNIQUEMENT avec le nom exact du champion à pick, rien d'autre.
Exemple de réponse: "Jinx" ou "Thresh" ou "Ahri"
"""
        
        return prompt
    
    def _extract_champion_from_response(self, response: str, available_champions: List[str]) -> Optional[str]:
        """Extrait le nom du champion de la réponse de l'IA"""
        # Nettoyer la réponse
        response = response.strip().strip('"\'.,!?')
        
        # Chercher une correspondance exacte
        for champion in available_champions:
            if champion.lower() == response.lower():
                return champion
        
        # Chercher une correspondance partielle
        for champion in available_champions:
            if champion.lower() in response.lower() or response.lower() in champion.lower():
                return champion
        
        return None
    
    def _fallback_decision(self, phase: str, available_champions: List[str]) -> str:
        """Décision de secours si l'IA échoue"""
        if phase == DraftPhase.BAN:
            # Bannir des champions du pool adverse
            player_team_data = self.get_team_data(self.player_team)
            threats = []
            
            for player in player_team_data.get('players', []):
                if not player.get('is_sub'):
                    # Prendre TOUS les champions du joueur
                    top_champs = player.get('top_champions', [])
                    for champ in top_champs:
                        if champ['champion_name'] in available_champions:
                            threats.append((champ['champion_name'], champ.get('winrate', 50)))
            
            # Trier par winrate et prendre le meilleur
            if threats:
                threats.sort(key=lambda x: x[1], reverse=True)
                return threats[0][0]
        
        else:  # PICK
            # Choisir du pool de l'IA (toutes positions confondues)
            all_pools = []
            for position in ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']:
                player_pool = self.get_player_pool(self.ai_team, position)
                available_pool = [c for c in player_pool if c in available_champions]
                all_pools.extend(available_pool)
            
            # Retirer les doublons
            all_pools = list(set(all_pools))
            
            if all_pools:
                return all_pools[0]
        
        # Dernier recours: choix aléatoire
        return random.choice(available_champions) if available_champions else None
    
    def process_action(self, champion: str, is_player_action: bool = True) -> Dict:
        """
        Traite une action (ban ou pick) et avance le draft
        
        Args:
            champion: Nom du champion
            is_player_action: True si c'est l'action du joueur, False si c'est l'IA
        
        Returns:
            État mis à jour du draft
        """
        if self.is_draft_complete():
            return {"error": "Draft déjà terminé"}
        
        phase_info = self.get_current_phase()
        if not phase_info:
            return {"error": "Phase invalide"}
        
        side, phase, pick_number = phase_info
        
        # La validation que le champion est disponible est faite côté backend
        # avec la liste complète des champions de la BDD
        
        # Appliquer l'action
        if phase == DraftPhase.BAN:
            # Utiliser directement le side de la phase pour déterminer l'équipe
            if side == DraftSide.BLUE:
                self.blue_bans.append(champion)
            else:
                self.red_bans.append(champion)
        else:  # PICK
            # Utiliser directement le side de la phase pour déterminer l'équipe
            if side == DraftSide.BLUE:
                self.blue_picks.append((champion, pick_number))
            else:
                self.red_picks.append((champion, pick_number))
        
        # Avancer
        print(f"DEBUG process_action: Avant avancement, current_step={self.current_step}")
        self.current_step += 1
        print(f"DEBUG process_action: Après avancement, current_step={self.current_step}")
        
        return self.get_draft_state()
    
    def _is_player_turn(self, current_phase: Tuple[str, str, int]) -> bool:
        """
        Détermine si c'est le tour du joueur basé sur la phase actuelle et le player_side
        
        Args:
            current_phase: Tuple (side, phase, pick_number)
        
        Returns:
            True si c'est le tour du joueur, False si c'est le tour de l'IA
        """
        if not current_phase:
            return False
        
        side, phase, pick_number = current_phase
        
        # Le joueur joue quand c'est son côté dans la séquence
        # L'IA joue quand c'est le côté opposé
        return side == self.player_side
    
    def get_draft_state(self) -> Dict:
        """Retourne l'état actuel du draft"""
        current_phase = self.get_current_phase()
        
        # Déterminer quelle équipe est bleue et laquelle est rouge
        # L'IA est toujours du côté opposé au joueur
        if self.player_side == DraftSide.BLUE:
            # Joueur est bleu, IA est rouge
            blue_team_data = self.team1_data if self.player_team == 1 else self.team2_data
            red_team_data = self.team2_data if self.player_team == 1 else self.team1_data
        else:
            # Joueur est rouge, IA est bleu
            blue_team_data = self.team2_data if self.player_team == 1 else self.team1_data
            red_team_data = self.team1_data if self.player_team == 1 else self.team2_data
        
        return {
            "current_step": self.current_step,
            "is_complete": self.is_draft_complete(),
            "current_phase": {
                "side": current_phase[0] if current_phase else None,
                "phase": current_phase[1] if current_phase else None,
                "pick_number": current_phase[2] if current_phase else None,
                "is_player_turn": self._is_player_turn(current_phase) if current_phase else False
            } if current_phase else None,
            "blue_team": {
                "name": blue_team_data['team_name'],
                "bans": self.blue_bans,
                "picks": [{"champion": p[0], "pick_order": p[1]} for p in self.blue_picks],
                "is_player": self.player_side == DraftSide.BLUE
            },
            "red_team": {
                "name": red_team_data['team_name'],
                "bans": self.red_bans,
                "picks": [{"champion": p[0], "pick_order": p[1]} for p in self.red_picks],
                "is_player": self.player_side == DraftSide.RED
            }
        }
    

