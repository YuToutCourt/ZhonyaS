from Database.database import Base, dbo
from icecream import ic
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Session, relationship


class Matchup(Base):
    __tablename__ = "Matchup"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user = Column(Integer, ForeignKey("User.id"), nullable=False)
    teamOne = Column(Integer, ForeignKey("Team.id"), nullable=False)
    teamTwo = Column(Integer, ForeignKey("Team.id"), nullable=False)
    name = Column(String(255), nullable=False)
    scheduled_date = Column(DateTime, nullable=True)
    status = Column(Enum("UPCOMING", "COMPLETED", "CANCELLED"), default="UPCOMING")
    userRelation = relationship("User", foreign_keys=[user])
    teamOneRelation = relationship("Team", foreign_keys=[teamOne])
    teamTwoRelation = relationship("Team", foreign_keys=[teamTwo])

    # Ajout de l'élément Matchup à la base de donnée
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

    # Mise à jour de l'élément Matchup à la base de donnée
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

    # Suppression de l'élément Matchup à la base de donnée
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
