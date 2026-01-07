import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool

load_dotenv()
HOST = os.getenv("DB_HOST")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DATABASE = os.getenv("DB_DATABASE")
PORT = os.getenv("DB_PORT")

# Chaîne de connexion SQLAlchemy pour MySQL
SQLALCHEMY_DATABASE_URL = (
    f"mysql+mysqlconnector://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"
)

# Configuration optimisée du pool de connexion
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_timeout=60,
    pool_recycle=3600,
    pool_pre_ping=True,
    connect_args={
        # 'connect_timeout': 60,
        # 'read_timeout': 60,
        # 'write_timeout': 60,
        "charset": "utf8mb4",
        "autocommit": False,
        "sql_mode": "STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO",
    },
)

dbo = sessionmaker(bind=engine, autoflush=False, future=True)
Base = declarative_base()


class Database:
    def __init__(self):
        self.session = dbo()

    def close(self):
        if self.session:
            self.session.close()

    def __enter__(self):
        return self.session

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.session()


# Fonction utilitaire pour gérer les connexions de manière sûre
def get_db_session():
    db = Database()
    try:
        return db.session
    except Exception as e:
        raise e
