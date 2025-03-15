[![Contributors][contributors-shield]][contributors-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<img src="static/images/logo.png" width=100>

# ZhonyaS

<img src="https://img.shields.io/badge/Python-3-brightgreen.svg?style=plastic">
<img src="https://img.shields.io/badge/Flask-aqua.svg?style=plastic">
<img src="https://img.shields.io/badge/Docker-blue.svg?style=plastic">
<img src="https://img.shields.io/badge/MariaDB-yellow.svg?style=plastic">
<img src="https://img.shields.io/badge/Riot Api-red.svg?style=plastic">

## Introduction

Have you always wanted a tool to quickly scout a player before a scrim, tournament, or Clash?

**ZhonyaS** is here for you. Using Riot Games' API, it retrieves all games of any player from June 2021 to the present. And get a summary of the player!

*Personal use for now. No SaaS ready*

## Installation 
```bash
git clone https://github.com/YuToutCourt/OtakuEyes-Flask.git
cd ZhonyaS
pip install -r ./setup/requirements.txt
docker-compose up -d
# Create the tables with the sql script 
```

Make sur to replace the .env data with yours

## Usage

```bash
python3 app.py
# And then goto this url : http://127.0.0.1:5000
```

## Upcoming features
- Better UX/UI
- Riot API prod to get more request

## TODO
- Refacto the code 

----

Feel free to give your opinion about the application and on what it can be improved

[contributors-shield]: https://img.shields.io/github/contributors/YuToutCourt/OtakuEyes?style=for-the-badge
[contributors-url]: https://github.com/YuToutCourt/OtakuEyes/graphs/contributors
[stars-shield]: https://img.shields.io/github/stars/YuToutCourt/OtakuEyes.svg?style=for-the-badge
[stars-url]: https://github.com/YuToutCourt/OtakuEyes/stargazers
[issues-shield]: https://img.shields.io/github/issues/YuToutCourt/OtakuEyes.svg?style=for-the-badge
[issues-url]: https://github.com/YuToutCourt/OtakuEyes/issues