# Guide de Migration - Refactorisation MVC

## Résumé de la Refactorisation

Votre projet ZhonyaS a été entièrement refactorisé selon le modèle MVC (Model-View-Controller) pour une meilleure séparation des responsabilités et une maintenance facilitée.

## Changements Principaux

### 1. Nouvelle Structure des Dossiers

**Avant :**
```
ZhonyaS/
├── backend/
│   └── app.py (757 lignes - tout en un)
├── objects/
│   ├── player.py
│   ├── user.py
│   └── champion.py
├── database/
├── utils/
└── frontend/
```

**Après :**
```
ZhonyaS/
├── api/                    # API REST
│   ├── app.py             # Application principale
│   ├── config.py          # Configuration centralisée
│   ├── websocket_events.py # Gestion WebSockets
│   └── routes/            # Routes séparées par domaine
│       ├── auth.py        # Authentification
│       ├── player.py      # Gestion joueurs
│       └── teams.py       # Gestion équipes
├── entity/                 # Modèles de données
│   ├── user.py
│   ├── player.py
│   └── champion.py
├── services/               # Services métier
│   ├── auth_service.py
│   ├── player_service.py
│   └── team_service.py
├── web/                    # Interface web (préparé)
├── database/              # Couche base de données
├── utils/                 # Utilitaires
└── frontend/              # Interface Next.js
```

### 2. Séparation des Responsabilités

#### Routes API (`api/routes/`)
- **auth.py** : Inscription, connexion, réinitialisation mot de passe
- **player.py** : Recherche, filtrage, téléchargement des joueurs
- **teams.py** : CRUD des équipes

#### Services Métier (`services/`)
- **AuthService** : Logique d'authentification
- **PlayerService** : Logique des joueurs et statistiques
- **TeamService** : Logique des équipes

#### Modèles (`entity/`)
- **User** : Modèle utilisateur avec validation
- **Player** : Modèle joueur avec statistiques
- **Champion** : Modèle champion

### 3. Configuration Centralisée

Tous les paramètres sont maintenant dans `api/config.py` :
- Variables d'environnement
- Configuration par environnement (dev, prod, test)
- Paramètres JWT, base de données, email, etc.

## Migration des Fonctionnalités

### ✅ Fonctionnalités Migrées

1. **Authentification**
   - Inscription utilisateur
   - Connexion utilisateur
   - Récupération profil
   - Mot de passe oublié
   - Réinitialisation mot de passe

2. **Gestion des Joueurs**
   - Recherche de joueur
   - Filtrage des jeux
   - Téléchargement des jeux
   - Statistiques

3. **Gestion des Équipes**
   - CRUD complet des équipes
   - Gestion des permissions
   - Validation des données

4. **WebSockets**
   - Connexion/déconnexion
   - Téléchargement en arrière-plan
   - Progression en temps réel

## Utilisation

### Démarrage Local

```bash
# Depuis la racine du projet
cd api
python app.py
```

### Démarrage avec Docker

```bash
# Utiliser le nouveau docker-compose
docker-compose -f docker-compose.dev.yml up
```

### Variables d'Environnement

Créer un fichier `.env` à la racine :
```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zhonyas
DB_USER=zhonyas
DB_PASSWORD=zhonyas123

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

## Tests

Un script de test est disponible pour vérifier la structure :

```bash
python test_mvc_simple.py
```

## Avantages de la Nouvelle Structure

### 1. Maintenabilité
- Code organisé par domaine fonctionnel
- Chaque fichier a une responsabilité claire
- Facilite les tests unitaires

### 2. Évolutivité
- Ajout de nouvelles fonctionnalités facilité
- Modification d'une partie sans impact sur les autres
- Réutilisation des services

### 3. Séparation des Responsabilités
- **Routes** : Gestion des requêtes HTTP uniquement
- **Services** : Logique métier et traitement des données
- **Entity** : Modèles de données et validation
- **Database** : Accès aux données

### 4. Configuration Centralisée
- Tous les paramètres dans un seul endroit
- Environnements séparés
- Gestion des variables d'environnement

## Fichiers Sauvegardés

- `backend/app_old.py` : Ancien fichier principal (sauvegardé)
- `objects/` : Anciens modèles (conservés pour référence)

## Prochaines Étapes Recommandées

1. **Tests Unitaires** : Créer des tests pour chaque service
2. **Documentation API** : Générer la documentation avec Swagger
3. **Logging** : Ajouter un système de logs centralisé
4. **Monitoring** : Ajouter des métriques et monitoring
5. **Sécurité** : Renforcer la sécurité (rate limiting, validation, etc.)

## Support

Si vous rencontrez des problèmes avec la nouvelle structure :
1. Vérifiez que tous les tests passent : `python test_mvc_simple.py`
2. Consultez le fichier `REFACTORING_MVC.md` pour plus de détails
3. Vérifiez la configuration dans `api/config.py`
