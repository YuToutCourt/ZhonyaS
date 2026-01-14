from django.db import models


class Player(models.Model):
	objects = models.Manager()

	id = models.AutoField(primary_key=True)
	name = models.CharField(max_length=255, null=False, blank=False)
	tag = models.CharField(max_length=255, null=False, blank=False)
	puuid = models.CharField(max_length=255, null=True, blank=True)
	soloq = models.CharField(max_length=255, null=True, blank=True)
	flexq = models.CharField(max_length=255, null=True, blank=True)

	class Meta:
		db_table = "Player"

	def __str__(self):
		return str(self.name)


def getAllPlayer():
	"""
	Permet de retourner toutes les entités Player

	Returns:
		Liste de tous les joueurs
	"""

	return list(Player.objects.all())
