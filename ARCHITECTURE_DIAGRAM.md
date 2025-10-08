# Architecture MVC - ZhonyaS

## Diagramme de l'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                      │
│                    http://localhost:3000                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/WebSocket
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                               │
│                    http://localhost:5001                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   AUTH      │  │   PLAYER    │  │   TEAMS     │            │
│  │   ROUTES    │  │   ROUTES    │  │   ROUTES    │            │
│  │             │  │             │  │             │            │
│  │ • register  │  │ • search    │  │ • create    │            │
│  │ • login     │  │ • filter    │  │ • read      │            │
│  │ • reset     │  │ • download  │  │ • update    │            │
│  │ • profile   │  │ • stats     │  │ • delete    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   AUTH      │  │   PLAYER    │  │   TEAM      │            │
│  │  SERVICE    │  │  SERVICE    │  │  SERVICE    │            │
│  │             │  │             │  │             │            │
│  │ • validation│  │ • search    │  │ • CRUD      │            │
│  │ • hashing   │  │ • stats     │  │ • permissions│           │
│  │ • email     │  │ • download  │  │ • validation│            │
│  │ • tokens    │  │ • rate limit│  │ • business  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ENTITY LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │    USER     │  │   PLAYER    │  │  CHAMPION   │            │
│  │   MODEL     │  │   MODEL     │  │   MODEL     │            │
│  │             │  │             │  │             │            │
│  │ • validation│  │ • stats     │  │ • stats     │            │
│  │ • password  │  │ • API calls │  │ • calculations│           │
│  │ • email     │  │ • data      │  │ • winrate   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                              │
│                    MySQL Database                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   USERS     │  │   PLAYERS   │  │   GAMES     │            │
│  │   TABLE     │  │   TABLE     │  │   TABLE     │            │
│  │             │  │             │  │             │            │
│  │ • id        │  │ • id        │  │ • id        │            │
│  │ • username  │  │ • name      │  │ • player_id │            │
│  │ • email     │  │ • tag       │  │ • champion  │            │
│  │ • password  │  │ • puuid     │  │ • stats     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Flux de Données

### 1. Authentification
```
Frontend → Auth Routes → Auth Service → User Entity → Database
```

### 2. Recherche de Joueur
```
Frontend → Player Routes → Player Service → Player Entity → Riot API + Database
```

### 3. Gestion d'Équipe
```
Frontend → Team Routes → Team Service → Database
```

## Composants Principaux

### API Layer (`api/`)
- **app.py** : Application Flask principale
- **config.py** : Configuration centralisée
- **websocket_events.py** : Gestion des WebSockets
- **routes/** : Routes HTTP séparées par domaine

### Service Layer (`services/`)
- **auth_service.py** : Logique d'authentification
- **player_service.py** : Logique des joueurs
- **team_service.py** : Logique des équipes

### Entity Layer (`entity/`)
- **user.py** : Modèle utilisateur
- **player.py** : Modèle joueur
- **champion.py** : Modèle champion

### Database Layer (`database/`)
- **db.py** : Accès aux données MySQL

## Avantages de cette Architecture

1. **Séparation des Responsabilités** : Chaque couche a un rôle précis
2. **Maintenabilité** : Code organisé et modulaire
3. **Testabilité** : Chaque service peut être testé indépendamment
4. **Évolutivité** : Ajout de nouvelles fonctionnalités facilité
5. **Réutilisabilité** : Services réutilisables dans différents contextes
