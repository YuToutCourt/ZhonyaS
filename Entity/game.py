from django.db import models
from Entity.player import Player
from Entity.champion import Champion


class Game(models.Model):
	objects = models.Manager()

	id = models.AutoField(primary_key=True)
	date = models.DateField(null=True, blank=True)
	type_game = models.CharField(max_length=255, null=True, blank=True)
	win = models.IntegerField(null=True, blank=True)
	role = models.CharField(max_length=255, null=True, blank=True)
	kill = models.IntegerField(null=True, blank=True)
	death = models.IntegerField(null=True, blank=True)
	assist = models.IntegerField(null=True, blank=True)
	total_team_kill = models.IntegerField(null=True, blank=True)
	player = models.ForeignKey(Player, on_delete=models.CASCADE, null=True, blank=True)
	champion = models.ForeignKey(Champion, on_delete=models.CASCADE, null=True, blank=True)
	other = models.

	class Meta:
		db_table = "Game"

	def __str__(self) -> str:
		return f"Game {self.id} - {self.player.name if self.player else 'N/A'} ({self.date})"


def getAllGame():
	"""
	Permet de retourner toutes les entités Game

	Returns:
		Liste de toutes les games
	"""
	return list(Game.objects.all())
