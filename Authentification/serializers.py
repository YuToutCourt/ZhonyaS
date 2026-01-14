from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.contrib.auth.hashers import check_password
from Entity.user import User


class LoginSerializer(serializers.Serializer):
	username = serializers.CharField(max_length=255, required=True)
	password = serializers.CharField(max_length=255, required=True, write_only=True)

	def validate(self, attrs):
		username = attrs.get("username")
		password = attrs.get("password")

		user = User.objects.filter(username=username).first()
		if not user:
			raise serializers.ValidationError("Username ou password incorrect")

		if not check_password(password, user.password):
			raise serializers.ValidationError("Username ou password incorrect")

		attrs["user"] = user
		return attrs

	def get_tokens(self, user):
		refresh = RefreshToken.for_user(user)
		return {
			"access": str(refresh.access_token),
			"refresh": str(refresh),
			"user_id": user.id,
			"username": user.username
		}


class RegisterSerializer(serializers.Serializer):
	username = serializers.CharField(max_length=255, required=True)
	email = serializers.EmailField(required=True)
	password = serializers.CharField(max_length=255, required=True, write_only=True)
	password_confirm = serializers.CharField(max_length=255, required=True, write_only=True)

	def validate(self, attrs):
		if attrs["password"] != attrs["password_confirm"]:
			raise serializers.ValidationError("Les mots de passe ne sont pas identiques")
		return attrs

	def create(self, validated_data):
		try:
			with transaction.atomic(): # type: ignore
				user = User.objects.create(
					username=validated_data["username"],
					email=validated_data["email"]
				)
				user.setPassword(validated_data["password"])
				user.save()
				return user
		except Exception as e:
			raise serializers.ValidationError(f"Erreur lors de la création: {str(e)}")
