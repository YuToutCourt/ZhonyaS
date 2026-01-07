# Importer toutes les entités pour que SQLAlchemy les enregistre
from .champion import Champion
from .game import Game
from .matchup import Matchup
from .player import Player
from .team import Team
from .teamPlayer import TeamPlayer
from .user import User

__all__ = ["User", "Player", "Team", "Champion", "TeamPlayer", "Matchup", "Game"]
