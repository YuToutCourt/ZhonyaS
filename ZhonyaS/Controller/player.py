from flask import Blueprint, request, jsonify
from icecream import ic
from Util.playerService import UserCheck

player_bp = Blueprint("player", __name__)

@player_bp.post("/search")
def search_player():
	try:
		data = request.get_json()
		username = data.get("username")

		if not username or '#' not in username:
			return jsonify({"Error": "Veuillez indiqué un nom de joueur et son tag"}), 400

		ic(f"Request API : SearchPlayer({username})")
		name, tag = username.split('#', 1)

		player = UserCheck(name, tag)

		if player is None:
			return jsonify({"Error": "Le joueur n'a pas été trouvé sur le serveur EUW"}), 404

		# all_champions = db.get_all_champion()

		# # Récupérer les jeux existants
		# filters = {"player_id": player_id}
		# games = db.get_games(**filters)

		# if games:
		# 	for game in games:
		# 		player.build_stats(game)
		# 	player.get_all_stats(["all"])

		# # Préparer la réponse
		# response = {
		# 	"player": {
		# 		"id": player_id,
		# 		"name": player.name,
		# 		"tag": player.tag,
		# 		"soloq": player.soloq,
		# 		"flexq": player.flexq,
		# 		"global_kda": player.global_kda,
		# 		"global_kill": player.global_kill,
		# 		"global_death": player.global_death,
		# 		"global_assists": player.global_assists,
		# 		"global_kp": player.global_kp,
		# 		"global_winrate": player.global_winrate,
		# 		"nb_game": player.nb_game,
		# 		"nb_win": player.nb_win,
		# 		"nb_lose": player.nb_lose,
		# 		"score_moyen": player.score_moyen,
		# 		"role": player.role
		# 	},
		# 	"champions": [
		# 		{
		# 			"nom": champ.nom,
		# 			"nombre_de_parties": champ.nombre_de_parties,
		# 			"nombre_win": champ.nombre_win,
		# 			"nombre_lose": champ.nombre_lose,
		# 			"winrate": champ.winrate,
		# 			"kill": champ.kill,
		# 			"death": champ.death,
		# 			"assit": champ.assit,
		# 			"dangerousness": champ.dangerousness,
		# 			"kda": champ.get_kda(),
		# 			"kill_participation": champ.get_kill_participation()
		# 		}
		# 		for champ in player.champions
		# 	],
		# 	"all_champions": all_champions
		# }

		# db.close()
		return jsonify(player)

	except Exception as e:
		return
