from Entity.player import FindByUsername, Player
from icecream import ic

from Util.requestService import requestRiot


def UserCheck(name, tag):
    # Chercher l'utilisateur par son name et tag
    player = FindByUsername(name, tag)

    # Vérifier si la donnée à bien été retournée
    if player is not None:
        # Comparer l'utilisateur en BDD et l'utilisateur en API
        tempPlayer = FindByPuuid(player.puuid)
        # Si différent, mettre à jour
        if tempPlayer is not None and  tempPlayer.name != player.name or tempPlayer.tag != player.tag:
            player.name = tempPlayer.name
            player.tag = tempPlayer.tag
            check = Player.Update(player)
            # Vérifie si le retour de l'udapte est True
            if check is True:
                player = FindByPuuid(player.puuid)
                if player is None:
                    return None
            else:
                ic("Error : Problème lors de l'update du joueur")
    else:
        player = FindNewPlayer(name, tag)
        if player is None:
            return None
        check = Player.Add(player)
        if check is False:
            ic("Error : Problème lors de la création du nouveau joueur")
            return None

    return player


def FindByPuuid(puuid):
    url = f"https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/{puuid}"

    accountData = requestRiot(url)

    if (
        accountData is False
        or not accountData.get("gameName")
        or not accountData.get("tagLine")
    ):
        ic("Error Data : Donnée corrompu")
        return None

    return {
        "name": accountData["gameName"],
        "tag": accountData["tagLine"],
        "puuid": accountData["puuid"],
    }


def FindNewPlayer(name, tag):
    url = f"https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{name}/{tag}"

    accountData = requestRiot(url)

    if accountData is False or not accountData.get("puuid"):
        ic("Error Data : Donnée corrompu")
        return None

    url = f"https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/{accountData['puuid']}"

    rankdata = requestRiot(url)

    if rankdata is False:
        ic("Error Data : Donnée corrompu")
        return None

    for data in rankdata:
        if data["queueType"] == "RANKED_SOLO_5x5":
            accountData["soloq"] = (
                f"{data['tier']} {data['rank']} ({data['leaguePoints']} LP) - {data['wins']}W/{data['losses']}L (Winrate: {data['wins'] / (data['wins'] + data['losses']) * 100:.2f}%)"
            )

        if data["queueType"] == "RANKED_FLEX_SR":
            accountData["flexq"] = (
                f"{data['tier']} {data['rank']} ({data['leaguePoints']} LP) - {data['wins']}W/{data['losses']}L (Winrate: {data['wins'] / (data['wins'] + data['losses']) * 100:.2f}%)"
            )

    return accountData
