import os

from database.db import DataBase
from objects.player import Player
from utils.ratelimit import RateLimiter

from icecream import ic
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, join_room
import uuid

load_dotenv()

API_KEY = os.getenv("API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")

app = Flask(__name__)
app.secret_key = SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*")

@app.before_request
def assign_session():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())

@app.route('/', methods=['GET'])
def index():
    return render_template("index.html")

@app.route('/search', methods=['GET','POST'])
def search():
    ic(request)
    if request.method == 'POST':
        ic(request.form)
        username = request.form.get("name")
    else:
        ic(request.args)
        username = request.args.get("name")

    if '#' not in username:
        return render_template("error.html", error_message="Please provide a username and a tag !")

    name, tag = username.split('#')

    db = DataBase(host="localhost")
    all_champions = db.get_all_champion()
    player = Player(name=name, tag=tag, API_KEY=API_KEY)

    if not player.puuid :
        return render_template("error.html", error_message="This player does not exist in EUW server !")
    
    db.insert_player(name=player.name, tag=player.tag, puuid=player.puuid, soloq=player.soloq, flex=player.flexq)
    player_id = db.get_player(name=player.name, tag=player.tag)["id"]

    filters = {"player_id": player_id}
    games = db.get_games(**filters)

    if games:
        for game in games: 
            player.build_stats(game)
        player.get_all_stats(["all"])

    return render_template("player.html", player=player, all_champions=all_champions)

@app.route('/filter', methods=['POST'])
def filter():
    ic(request, request.form)
    username = request.form.get("player_name")
    name, tag = username.split('#')
    role = request.form.getlist("role")
    champion = request.form.getlist("champion")
    date = request.form.get("start-date")
    final_date = request.form.get("end-date") 
    match_types = request.form.getlist("match")

    db = DataBase(host="localhost")
    all_champions = db.get_all_champion()
    player = Player(name=name, tag=tag, API_KEY=API_KEY)
    player_id = db.get_player(name=player.name, tag=player.tag)["id"]

    if "all" in match_types:
        match_types = ["soloq", "flex", "normal", "tourney"]

    filters = {"player_id": player_id}
    
    ic(date)
    ic(champion)
    if "all" in role[0]:
        role = ["all"]
    else:
        role = role[0].split('-')

    if role[0] != '' and "all" not in role:
        filters["role_"] = role
    if "all" not in champion and champion != []:
        filters["champion"] = champion
    if match_types:
        filters["type_game"] = match_types
    if date and final_date:
        filters["date_range"] = [date, final_date]

    ic(filters)
        
    games = db.get_games(**filters)
    if games:
        for game in games: 
            player.build_stats(game)
        player.get_all_stats(role)

    return render_template("player.html", player=player, all_champions=all_champions)

@socketio.on('join')
def on_join():
    session_id = session.get("session_id")  # Récupère l'ID de session unique
    if session_id:
        join_room(session_id)  # L'utilisateur rejoint sa propre "room"

@socketio.on('connect')
def handle_connect():
    session_id = session.get("session_id")
    if session_id:
        join_room(session_id)  # L'utilisateur rejoint automatiquement sa "room"

def process_download(username, nb_games, session_id):
    
    name, tag = username.split('#')

    player = Player(name=name, tag=tag, API_KEY=API_KEY)
    db = DataBase(host="localhost")

    player_id = db.get_player(name=player.name, tag=player.tag)["id"]

    match_dict = {
        "soloq": 420,
        "flex": 440,
    }

    soloq_matchs = player.get_matchs_history(match_type=match_dict["soloq"], count=nb_games, matchs=[])
    flex_matchs = player.get_matchs_history(match_type=match_dict["flex"], count=nb_games, matchs=[])
    normal_matchs = player.get_matchs_history(match_type="normal", count=nb_games, matchs=[])
    tournament_matchs = player.get_matchs_history(match_type="tourney", count=nb_games, matchs=[])

    all_matchs = [soloq_matchs, flex_matchs, normal_matchs, tournament_matchs]
    total_games = sum(len(m) for m in all_matchs)
    ic(total_games)
    rate_limiter = RateLimiter()
    games_processed = 0

    for index, matchs in enumerate(all_matchs):
        for match_id in matchs:
            rate_limiter.wait_for_slot()
            game = player.get_match_info(match_id)

            # Calculer la progression et envoyer la mise à jour au front via WebSocket
            games_processed += 1
            progress = round(games_processed / total_games * 100)
            socketio.emit('progress', {'progress': progress}, room=session_id)
            socketio.sleep(0)

            if game is None:
                continue

            match_type = ["soloq", "flex", "normal", "tourney"][index]
            champion_id = db.get_champion(game["Champion"])["id"]
            player.add_data_to_db(db, player_id=player_id, champion_id=champion_id, game=game, type_game=match_type)


    socketio.emit('download_complete', {'name': username}, room=session_id)
    socketio.sleep(0)

@app.route('/download', methods=['POST'])
def download():
    ic(request, request.form)
    session_id = session.get("session_id")
    username = request.form.get("player_name")
    nb_games = int(request.form.get("nb_games"))

    socketio.start_background_task(target=process_download, username=username, nb_games=nb_games, session_id=session_id)

    return jsonify({"status": "started"})


@app.errorhandler(Exception)
def handle_exception(error):
    ic(error)
    return render_template("error.html", error_message="An unexpected error occurred. Please try again later."), 500


if  __name__ == '__main__':
    # socketio.run(app, debug=True, host="0.0.0.0", port=1234)
    socketio.run(app, debug=True, host="0.0.0.0")