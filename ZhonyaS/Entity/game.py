from Database.database import Base, dbo
from icecream import ic
from sqlalchemy import Column, Date, ForeignKey, Integer, String, extract, or_, select
from sqlalchemy.orm import Session, relationship

from ZhonyaS.Entity.champion import Champion


class Game(Base):
    __tablename__ = "Game"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=True)
    type_game = Column(String(255), nullable=True)
    win = Column(Integer, nullable=True)
    role = Column(String(255), nullable=True)
    kill = Column(Integer, nullable=True)
    death = Column(Integer, nullable=True)
    assist = Column(Integer, nullable=True)
    total_team_kill = Column(Integer, nullable=True)
    player = Column(Integer, ForeignKey("Player.id", ondelete="CASCADE"), nullable=True)
    champion = Column(
        Integer, ForeignKey("Champion.id", ondelete="CASCADE"), nullable=True
    )
    playerRelation = relationship("Player", foreign_keys=[player])
    championRelation = relationship("Champion", foreign_keys=[champion])

    # Ajout de l'élément Game à la base de donnée
    def add(self):
        session = dbo()
        try:
            session.add(self)
            session.commit()
            session.close()
            return True
        except Exception as e:
            ic(e)
            session.rollback()
            session.close()
            return False

    # Mise à jour de l'élément Game à la base de donnée
    def Update(self):
        session = dbo()
        try:
            session.merge(self)
            session.commit()
            session.close()
            return True
        except Exception as e:
            ic(e)
            session.rollback()
            session.close()
            return False

    # Suppression de l'élément Game à la base de donnée
    def Delete(self):
        session = dbo()
        try:
            session.delete(self)
            session.commit()
            session.close()
            return True
        except Exception as e:
            ic(e)
            session.rollback()
            session.close()
            return False

def FindGamesByFilters(**filters):
    """Récupère les matchs avec filtres dynamiques, incluant le nom du champion et le type de match."""
    session = dbo()
    try:
        stmt = select(Game).join(Champion, Game.champion == Champion.id)

        for key, value in filters.items():
            if key == "date_range":
                stmt = stmt.where(Game.date.between(value[0], value[1]))
            elif key == "type_game":
                if isinstance(value, list):
                    stmt = stmt.where(Game.type_game.in_(value))
                else:
                    stmt = stmt.where(Game.type_game == value)
            elif key == "champion":
                if isinstance(value, list):
                    stmt = stmt.where(Champion.name.in_(value))
                else:
                    stmt = stmt.where(Champion.name == value)
            elif key == "season":
                if isinstance(value, list):
                    conditions = [extract('year', Game.date) == (int(s) + 2010) for s in value]
                    stmt = stmt.where(or_(*conditions))
                else:
                    stmt = stmt.where(extract('year', Game.date) == (int(value) + 2010))
            elif key == "role":
                if isinstance(value, list):
                    stmt = stmt.where(Game.role.in_(value))
                else:
                    stmt = stmt.where(Game.role == value)
            elif hasattr(Game, key):
                stmt = stmt.where(getattr(Game, key) == value)

        games = session.scalars(stmt).all()
        session.close()
        return games
    except Exception as e:
        ic(f"Error retrieving games: {e}")
        session.close()
        return None
