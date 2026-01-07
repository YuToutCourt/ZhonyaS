from Database.database import Base, dbo
from icecream import ic
from sqlalchemy import Column, Integer, String, select
from sqlalchemy.orm import Session


class Player(Base):
    __tablename__ = "Player"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=True)
    tag = Column(String(255), nullable=True)
    puuid = Column(String(255), nullable=True)
    soloq = Column(String(255), nullable=True)
    flex = Column(String(255), nullable=True)

    # Ajout de l'élément Player à la base de donnée
    def Add(self):
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

    # Mise à jour de l'élément Player à la base de donnée
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

    # Suppression de l'élément Player à la base de donnée
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


def FindByUsername(username, tag):
    session = dbo()
    stmt = select(Player).where(Player.name == username, Player.tag == tag)
    user = session.scalar(stmt)
    session.close()
    return user
