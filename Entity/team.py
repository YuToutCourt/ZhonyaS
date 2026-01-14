from django.db import models

from Entity.user import User

class Team(models.Model):
	objects = models.Manager()

	id = models.AutoField(primary_key=True)
	name = models.CharField(max_length=255, null=False, blank=False)
	user = models.OneToOneField(User, on_delete=models.CASCADE, null=False, blank=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "Team"

	def __str__(self):
		return str(self.name)


def getAllTeam():
	"""
	Permet de retourner toutes les entités Team

	Returns:
		Liste de tous les teams
	"""

	return list(Team.objects.all())
