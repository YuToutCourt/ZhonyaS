from django.db import models
from Entity.user import User
from Entity.team import Team


class Matchup(models.Model):
	class Status(models.TextChoices):
		UPCOMING = "UPCOMING"
		COMPLETED = "COMPLETED"
		CANCELLED = "CANCELLED"

	objects = models.Manager()

	id = models.AutoField(primary_key=True)
	user = models.ForeignKey(User, on_delete=models.CASCADE, null=False, blank=False)
	teamOne = models.ForeignKey(Team, on_delete=models.CASCADE, null=False, blank=False, related_name='matchups_as_team_one')
	teamTwo = models.ForeignKey(Team, on_delete=models.CASCADE, null=False, blank=False, related_name='matchups_as_team_two')
	name = models.CharField(max_length=255, null=False, blank=False)
	scheduled_date = models.DateTimeField(null=True, blank=True)
	status = models.CharField(max_length=255, choices=Status.choices, default=Status.UPCOMING)

	class Meta:
		db_table = "Matchup"

	def __str__(self) -> str:
		return f"{self.name}"


def getAllMatchup():
	"""
	Permet de retourner toutes les entités Matchup

	Returns:
		Liste de tous les matchups
	"""
	return list(Matchup.objects.all())
