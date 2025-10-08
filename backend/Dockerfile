FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Copier les modules nécessaires depuis la racine
COPY ../api ./api
COPY ../entity ./entity
COPY ../services ./services
COPY ../database ./database
COPY ../utils ./utils

# Exposer le port
EXPOSE 5001

# Commande par défaut
CMD ["python", "app.py"]
