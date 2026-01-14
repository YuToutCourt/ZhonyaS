from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class User(models.Model):
	objects = models.Manager()

	id = models.AutoField(primary_key=True)
	username = models.CharField(max_length=255, unique=True, null=False, blank=False)
	password = models.CharField(max_length=255, null=False, blank=False)
	email = models.EmailField(max_length=255, unique=True, null=False, blank=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "User"

	def __str__(self):
		return str(self.username)

	def setPassword(self, rawPassword: str) -> None:
		"""Hash le mot de passe et le stocke sans sauvegarder"""
		self.password = make_password(rawPassword)

	def checkPassword(self, rawPassword: str) -> bool:
		"""Vérifie le mot de passe"""
		return check_password(rawPassword, self.password)


def getAllUser():
	"""
	Permet de retourner toutes les entités User

	Returns:
		Liste de tous les utilisateurs
	"""

	return list(User.objects.all())
