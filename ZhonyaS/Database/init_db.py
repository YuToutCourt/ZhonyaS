import importlib
import pkgutil

from sqlalchemy import Engine, inspect

from Database.database import Base


def _import_entities(package_name: str = "Entity") -> None:
    """Importer tous les modules du package Entity pour enregistrer les mappings."""
    pkg = importlib.import_module(package_name)
    for _, modname, ispkg in pkgutil.iter_modules(pkg.__path__):
        importlib.import_module(f"{package_name}.{modname}")


def init_db(
    engine: Engine, package_name: str = "Entity", create_tables: bool = True
) -> None:
    """
    Initialise la DB pour dev/test :
    - importe les entités dnu package_name
    - appelle Base.metadata.create_all(engine) si create_tables True
    """
    _import_entities(package_name)
    if create_tables:
        Base.metadata.create_all(engine)


def print_tables(engine: Engine) -> None:
    """Utilitaire : affiche les tables connues après init_db."""
    print("tables:", inspect(engine).get_table_names())
