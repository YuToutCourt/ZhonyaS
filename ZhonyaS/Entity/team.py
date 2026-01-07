from Database.database import Base, dbo
from icecream import ic
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Session, relationship


class Team(Base):
    __tablename__ = "Team"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    user = Column(Integer, ForeignKey("User.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    userRelation = relationship("User", foreign_keys=[user])

    # Ajout de l'élément Team à la base de donnée
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

    # Mise à jour de l'élément Team à la base de donnée
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

    # Suppression de l'élément Team à la base de donnée
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
