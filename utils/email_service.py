import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from .email_templates import (
    get_welcome_email_template,
    get_password_reset_email_template,
    get_plain_text_welcome_email,
    get_plain_text_password_reset_email
)

load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email = os.getenv("EMAIL_USER")
        self.password = os.getenv("EMAIL_PASSWORD")
        self.app_name = os.getenv("APP_NAME", "ZhonyaS")
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    def send_password_reset_email(self, to_email, username, reset_token):
        """Envoie un email de réinitialisation de mot de passe"""
        try:
            # Créer le message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email
            msg['To'] = to_email
            msg['Subject'] = f"{self.app_name} - Réinitialisation de votre mot de passe"

            # Corps du message
            reset_url = f"{self.frontend_url}/reset-password?token={reset_token}"
            
            # Version HTML
            html_body = get_password_reset_email_template(username, self.app_name, reset_url)
            
            # Version texte simple
            text_body = get_plain_text_password_reset_email(username, self.app_name, reset_url)

            # Attacher les deux versions
            msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))

            # Connexion au serveur SMTP
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email, self.password)

            # Envoi de l'email
            text = msg.as_string()
            server.sendmail(self.email, to_email, text)
            server.quit()

            return True, "Email de réinitialisation envoyé avec succès"

        except Exception as e:
            return False, f"Erreur lors de l'envoi de l'email: {str(e)}"

    def send_welcome_email(self, to_email, username):
        """Envoie un email de bienvenue"""
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email
            msg['To'] = to_email
            msg['Subject'] = f"Bienvenue sur {self.app_name} !"

            # Version HTML
            html_body = get_welcome_email_template(username, self.app_name)
            
            # Version texte simple
            text_body = get_plain_text_welcome_email(username, self.app_name)

            # Attacher les deux versions
            msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email, self.password)

            text = msg.as_string()
            server.sendmail(self.email, to_email, text)
            server.quit()

            return True, "Email de bienvenue envoyé avec succès"

        except Exception as e:
            return False, f"Erreur lors de l'envoi de l'email de bienvenue: {str(e)}"

