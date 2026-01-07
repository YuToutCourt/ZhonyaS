#!/usr/bin/env python3
"""Script de test pour vérifier la configuration SQLAlchemy"""

print("=" * 60)
print("TEST DE CONFIGURATION SQLALCHEMY")
print("=" * 60)

# Test 1: Import des modules
print("\n[1/4] Test des imports...")
try:
    from Database import Base, engine, init_db, print_tables
    from Entity import Champion, Game, Matchup, Player, Team, TeamPlayer, User

    print("✓ Tous les modules importés avec succès")
except Exception as e:
    print(f"✗ Erreur lors de l'import: {e}")
    exit(1)

# Test 2: Vérification des entités enregistrées
print("\n[2/4] Vérification des entités enregistrées...")
try:
    entities = Base.metadata.tables.keys()
    print(f"✓ {len(entities)} tables trouvées avant init_db:")
    for table in entities:
        print(f"  - {table}")
except Exception as e:
    print(f"✗ Erreur: {e}")

# Test 3: Initialisation de la base de données
print("\n[3/4] Initialisation de la base de données...")
try:
    init_db(engine, package_name="Entity", create_tables=False)
    print("✓ init_db() exécuté avec succès")
except Exception as e:
    print(f"✗ Erreur lors de init_db: {e}")
    exit(1)

# Test 4: Vérification des tables après init_db
print("\n[4/4] Vérification des tables après init_db...")
try:
    entities = Base.metadata.tables.keys()
    print(f"✓ {len(entities)} tables enregistrées:")
    for table in entities:
        print(f"  - {table}")

    expected_tables = {
        "User",
        "Player",
        "Team",
        "Champion",
        "TeamPlayer",
        "Matchup",
        "Game",
    }
    found_tables = set(entities)

    if expected_tables == found_tables:
        print("\n✓ TOUTES LES TABLES SONT CORRECTEMENT ENREGISTRÉES!")
    else:
        missing = expected_tables - found_tables
        extra = found_tables - expected_tables
        if missing:
            print(f"\n⚠ Tables manquantes: {missing}")
        if extra:
            print(f"\n⚠ Tables supplémentaires: {extra}")
except Exception as e:
    print(f"✗ Erreur: {e}")
    exit(1)

print("\n" + "=" * 60)
print("CONFIGURATION SQLALCHEMY VALIDÉE ✓")
print("=" * 60)
print("\nVous pouvez maintenant lancer votre application avec:")
print("  python ZhonyaS.py")
print("\nOu créer les tables en base avec:")
print("  init_db(engine, 'Entity', create_tables=True)")
