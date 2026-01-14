from django.db import models

from Entity.player import Player
from Entity.team import Team


class TeamPlayer(models.Model):
	objects = models.Manager()

	class Position(models.TextChoices):
		TOP = "TOP"
		JUNGLE = "JUNGLE"
		MID = "MID"
		BOTTOM = "BOTTOM"
		SUPPORT = "SUPPORT"
		SUB = "SUB"


	id = models.AutoField(primary_key=True)
	team = models.OneToOneField(Team, on_delete=models.CASCADE, null=False, blank=False)
	player = models.OneToOneField(Player, on_delete=models.CASCADE, null=False, blank=False)
	position = models.CharField(max_length=255, choices=Position.choices, null=False, blank=False)
	isSub = models.IntegerField()

	class Meta:
		db_table = "TeamPlayer"

	def __str__(self):
		return str(self.id)
