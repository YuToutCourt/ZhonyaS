from Database.database import Base, dbo
from icecream import ic
from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Session, relationship


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
