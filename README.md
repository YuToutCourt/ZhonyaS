[![Contributors][contributors-shield]][contributors-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<img src="frontend/public/images/logo.png" width=50>

# ZhonyaS
> League of Legends Player Scouting Platform - Scout players like a pro before tournaments, scrims, or Clash

ZhonyaS is a comprehensive League of Legends player scouting platform that helps teams and coaches analyze player performance before important matches. Using Riot Games' API, it fetches detailed game history from June 2021 to present and provides actionable insights for competitive play.

[![Python Badge](https://img.shields.io/badge/Python-3.11+-brightgreen.svg?style=plastic)](https://www.python.org/)
[![Next.js Badge](https://img.shields.io/badge/Next.js-15.5+-black.svg?style=plastic)](https://nextjs.org/)
[![Flask Badge](https://img.shields.io/badge/Flask-3.1+-aqua.svg?style=plastic)](https://flask.palletsprojects.com/)
[![Docker Badge](https://img.shields.io/badge/Docker-blue.svg?style=plastic)](https://www.docker.com/)
[![MariaDB Badge](https://img.shields.io/badge/MariaDB-yellow.svg?style=plastic)](https://mariadb.org/)
[![Riot API Badge](https://img.shields.io/badge/Riot%20API-red.svg?style=plastic)](https://developer.riotgames.com/)

## 🏗️ Architecture

### Frontend (Next.js 15)
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home page
│   │   └── player/page.tsx   # Player profile page
│   ├── components/           # Reusable components
│   ├── hooks/
│   │   └── useDownloadStream.ts  # SSE hook for downloads
│   └── lib/                  # Utilities and API client
```

### Backend (Flask)
```
backend/
├── api/
│   ├── app.py               # Main Flask application
│   └── routes/
│       ├── player.py        # Search and filter routes
│       └── download_stream.py  # SSE routes for downloads
├── services/
│   └── player_service.py    # Player business logic
├── entity/
│   ├── player.py           # Player model
│   └── champion.py         # Champion model
└── database/
    └── db.py               # Database management
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- Python 3.9+
- MySQL 8.0+
- Riot Games API Key

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend
API_KEY=YOUR_RIOT_API_KEY
USER_DB=your_user
PASSWORD_DB=your_pwd
DATABASE_NAME=lol_game_data
SECRET_KEY=YOUR_SECRET_KEY
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Database Setup

> Use the setup/create_database.sql file to create the database

## 🚀 Quick Start

1. **Clone the project**
```bash
git clone <repository-url>
cd ZhonyaS
```

2. **Start the backend**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

3. **Start the frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
- http://localhost:3000

## 🎯 Technologies

- **Frontend** : Next.js 15, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend** : Flask, Python 3.9+
- **Database** : MySQL
- **API** : Riot Games API

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


[contributors-shield]: https://img.shields.io/github/contributors/YuToutCourt/ZhonyaS?style=for-the-badge
[contributors-url]: https://github.com/YuToutCourt/ZhonyaS/graphs/contributors
[stars-shield]: https://img.shields.io/github/stars/YuToutCourt/ZhonyaS.svg?style=for-the-badge
[stars-url]: https://github.com/YuToutCourt/ZhonyaS/stargazers
[issues-shield]: https://img.shields.io/github/issues/YuToutCourt/ZhonyaS.svg?style=for-the-badge
[issues-url]: https://github.com/YuToutCourt/ZhonyaS/issues