from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, LoginSerializer


@api_view(["POST"])
def login(request):
	"""Endpoint de connexion - Retourne JWT tokens"""
	serializer = LoginSerializer(data=request.data)

	if serializer.is_valid():
		user = serializer.validated_data.get("user")
		if user:
			tokens = serializer.get_tokens(user)
			return Response(tokens, status=status.HTTP_200_OK)

	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def register(request):
	"""Endpoint d'inscription"""
	serializer = RegisterSerializer(data=request.data)

	if serializer.is_valid():
		user = serializer.save()
		if user and hasattr(user, "id"):
			return Response(
				{
					"message": "Utilisateur créé avec succès",
					"user_id": user.id,
					"username": user.username
				},
				status=status.HTTP_201_CREATED
			)

	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
