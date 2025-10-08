# Refactorisation MVC - ZhonyaS

## Nouvelle Structure du Projet

Le projet a été refactorisé selon le modèle MVC (Model-View-Controller) pour une meilleure séparation des responsabilités et une maintenance facilitée.

### Structure des Dossiers

```
ZhonyaS/
├── api/                    # API REST
│   ├── __init__.py
│   ├── app.py             # Application principale Flask
│   ├── config.py          # Configuration centralisée
│   ├── websocket_events.py # Gestion des WebSockets
│   └── routes/            # Routes API séparées par domaine
│       ├── __init__.py
│       ├── auth.py        # Authentification (login, register, reset)
│       ├── player.py      # Gestion des joueurs (search, filter, download)
│       └── teams.py       # Gestion des équipes (CRUD)
├── web/                    # Interface web (si nécessaire)
│   ├── __init__.py
│   └── routes/
│       └── __init__.py
├── entity/                 # Modèles de données (ex-objects)
│   ├── __init__.py
│   ├── user.py           # Modèle utilisateur
│   ├── player.py         # Modèle joueur
│   └── champion.py       # Modèle champion
├── services/               # Services métier
│   ├── __init__.py
│   ├── auth_service.py   # Logique d'authentification
│   ├── player_service.py # Logique des joueurs
│   └── team_service.py   # Logique des équipes
├── database/              # Gestion base de données
│   ├── __init__.py
│   └── db.py
├── utils/                 # Utilitaires
│   ├── __init__.py
│   ├── email_service.py
│   ├── ratelimit.py
│   └── utils.py
├── frontend/              # Interface Next.js
└── backend/               # Ancien backend (sauvegardé)
    ├── app_old.py        # Ancien fichier principal
    └── app.py            # Nouveau fichier principal
```

## Avantages de la Refactorisation

### 1. Séparation des Responsabilités
- **API Routes** : Gestion des requêtes HTTP uniquement
- **Services** : Logique métier et traitement des données
- **Entity** : Modèles de données et validation
- **Database** : Accès aux données

### 2. Maintenabilité
- Code organisé par domaine fonctionnel
- Chaque fichier a une responsabilité claire
- Facilite les tests unitaires
- Réduction de la complexité

### 3. Évolutivité
- Ajout de nouvelles fonctionnalités facilité
- Modification d'une partie sans impact sur les autres
- Réutilisation des services

### 4. Configuration Centralisée
- Tous les paramètres dans `api/config.py`
- Environnements séparés (dev, prod, test)
- Gestion des variables d'environnement

## Migration des Fonctionnalités

### Authentification (`api/routes/auth.py`)
- ✅ Inscription utilisateur
- ✅ Connexion utilisateur
- ✅ Récupération profil utilisateur
- ✅ Mot de passe oublié
- ✅ Réinitialisation mot de passe

### Joueurs (`api/routes/player.py`)
- ✅ Recherche de joueur
- ✅ Filtrage des jeux
- ✅ Téléchargement des jeux
- ✅ Récupération ID joueur

### Équipes (`api/routes/teams.py`)
- ✅ Liste des équipes utilisateur
- ✅ Création d'équipe
- ✅ Récupération équipe spécifique
- ✅ Modification d'équipe
- ✅ Suppression d'équipe

### WebSockets (`api/websocket_events.py`)
- ✅ Connexion/déconnexion
- ✅ Rejoindre une session
- ✅ Téléchargement en arrière-plan
- ✅ Progression en temps réel

## Services Métier

### AuthService
- Validation des données utilisateur
- Hachage des mots de passe
- Gestion des tokens de réinitialisation
- Envoi d'emails

### PlayerService
- Recherche et filtrage des joueurs
- Gestion des statistiques
- Téléchargement des jeux
- Gestion du rate limiting

### TeamService
- CRUD des équipes
- Gestion des permissions
- Validation des données

## Configuration

### Variables d'Environnement
```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zhonyas
DB_USER=postgres
DB_PASSWORD=your_password

# API Riot Games
API_KEY=your_riot_api_key

# JWT
SECRET_KEY=your_secret_key

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email
SMTP_PASSWORD=your_password

# Environnement
FLASK_ENV=development
```

## Utilisation

### Démarrage de l'API
```bash
cd api
python app.py
```

### Démarrage avec Docker
```bash
docker-compose up
```

## Tests

Chaque service peut être testé indépendamment :
```python
from services.auth_service import AuthService

auth_service = AuthService()
success, message, result = auth_service.register_user("test", "password", "test@example.com")
```

## Prochaines Étapes

1. ✅ Création de la structure MVC
2. ✅ Migration des routes API
3. ✅ Création des services métier
4. ✅ Déplacement des modèles
5. ⏳ Tests unitaires
6. ⏳ Documentation API
7. ⏳ Optimisation des performances
