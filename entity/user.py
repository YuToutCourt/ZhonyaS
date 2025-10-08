import bcrypt
from datetime import datetime
from email_validator import validate_email, EmailNotValidError
import re

class User:
    def __init__(self, username=None, password=None, email=None, user_id=None):
        self.id = user_id
        self.username = username
        self.password = password
        self.email = email
        self.created_at = None
        self.last_login = None

    def validate_username(self):
        """Valide le nom d'utilisateur"""
        if not self.username:
            return False, "Le nom d'utilisateur est requis"
        
        if len(self.username) < 3:
            return False, "Le nom d'utilisateur doit contenir au moins 3 caractères"
        
        if len(self.username) > 20:
            return False, "Le nom d'utilisateur ne peut pas dépasser 20 caractères"
        
        if not re.match(r'^[a-zA-Z0-9_-]+$', self.username):
            return False, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"
        
        return True, "Nom d'utilisateur valide"

    def validate_password(self):
        """Valide le mot de passe"""
        if not self.password:
            return False, "Le mot de passe est requis"
        
        if len(self.password) < 8:
            return False, "Le mot de passe doit contenir au moins 8 caractères"
        
        if len(self.password) > 128:
            return False, "Le mot de passe ne peut pas dépasser 128 caractères"
        
        # Vérifier la complexité du mot de passe
        if not re.search(r'[A-Z]', self.password):
            return False, "Le mot de passe doit contenir au moins une majuscule"
        
        if not re.search(r'[a-z]', self.password):
            return False, "Le mot de passe doit contenir au moins une minuscule"
        
        if not re.search(r'\d', self.password):
            return False, "Le mot de passe doit contenir au moins un chiffre"
        
        return True, "Mot de passe valide"

    def validate_email(self):
        """Valide l'adresse email"""
        if not self.email:
            return True, "Email optionnel"  # Email est optionnel
        
        try:
            validate_email(self.email)
            return True, "Email valide"
        except EmailNotValidError as e:
            return False, f"Email invalide: {str(e)}"

    def hash_password(self):
        """Hache le mot de passe avec bcrypt"""
        if not self.password:
            return False, "Aucun mot de passe à hacher"
        
        try:
            # Générer un salt et hacher le mot de passe
            salt = bcrypt.gensalt()
            self.password = bcrypt.hashpw(self.password.encode('utf-8'), salt).decode('utf-8')
            return True, "Mot de passe haché avec succès"
        except Exception as e:
            return False, f"Erreur lors du hachage: {str(e)}"

    def verify_password(self, password):
        """Vérifie le mot de passe"""
        if not self.password or not password:
            return False
        
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))
        except Exception as e:
            return False

    def validate_all(self):
        """Valide tous les champs de l'utilisateur"""
        errors = []
        
        # Valider le nom d'utilisateur
        is_valid, message = self.validate_username()
        if not is_valid:
            errors.append(message)
        
        # Valider le mot de passe
        is_valid, message = self.validate_password()
        if not is_valid:
            errors.append(message)
        
        # Valider l'email
        is_valid, message = self.validate_email()
        if not is_valid:
            errors.append(message)
        
        return len(errors) == 0, errors

    def to_dict(self):
        """Convertit l'utilisateur en dictionnaire (sans le mot de passe)"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at,
            'last_login': self.last_login
        }

    def set_created_at(self, created_at):
        """Définit la date de création"""
        self.created_at = created_at

    def set_last_login(self, last_login):
        """Définit la dernière connexion"""
        self.last_login = last_login

