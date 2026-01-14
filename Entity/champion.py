from django.db import models


class Champion(models.Model):
	objects = models.Manager()

	id = models.AutoField(primary_key=True)
	name = models.CharField(max_length=255, null=False, blank=False)
	url_image = models.CharField(max_length=255, null=False, blank=False)

	class Meta:
		db_table = "Champion"

	def __str__(self):
		return str(self.name)


def getAllChampion():
	"""
	Permet de retourner toutes les entités Champion

	Returns:
		Liste de tous les champions
	"""

	return list(Champion.objects.all())
