from Database.database import Base, dbo
from icecream import ic
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import Session


class Champion(Base):
    __tablename__ = "Champion"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=True)
    url_image = Column(String(255), nullable=True)

    # Ajout de l'élément Champion à la base de donnée
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

    # Mise à jour de l'élément Champion à la base de donnée
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

    # Suppression de l'élément Champion à la base de donnée
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
