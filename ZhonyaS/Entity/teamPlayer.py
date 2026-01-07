from Database.database import Base, dbo
from icecream import ic
from sqlalchemy import Column, Enum, ForeignKey, Integer
from sqlalchemy.orm import Session, relationship


class TeamPlayer(Base):
    __tablename__ = "TeamPlayer"
    id = Column(Integer, primary_key=True, autoincrement=True)
    team = Column(Integer, ForeignKey("Team.id"), nullable=False)
    player = Column(Integer, ForeignKey("Player.id"), nullable=False)
    position = Column(Enum("TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT", "SUB"))
    is_sub = Column(Integer, default=0)
    teamRelation = relationship("Team", foreign_keys=[team])
    playerRelation = relationship("Player", foreign_keys=[player])

    # Ajout de l'élément TeamPlayer à la base de donnée
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

    # Mise à jour de l'élément TeamPlayer à la base de donnée
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

    # Suppression de l'élément TeamPlayer à la base de donnée
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
