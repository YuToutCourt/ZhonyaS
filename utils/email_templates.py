"""
Templates HTML pour les emails
"""

def get_welcome_email_template(username: str, app_name: str) -> str:
    """Template HTML pour l'email de bienvenue"""
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur {app_name}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 0;
                background-color: #f8f9fa;
            }}
            .container {{
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }}
            .header {{
                background: #2c3e50;
                padding: 30px;
                text-align: center;
                color: white;
            }}
            .logo {{
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
                letter-spacing: 1px;
            }}
            .logo::before {{
                content: "⚔️";
                margin-right: 8px;
                font-size: 24px;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .welcome-title {{
                font-size: 24px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 20px;
                text-align: center;
            }}
            .welcome-text {{
                font-size: 16px;
                color: #666;
                margin-bottom: 30px;
                text-align: center;
                line-height: 1.7;
            }}
            .features {{
                background: #f8f9fa;
                border-radius: 6px;
                padding: 25px;
                margin: 30px 0;
            }}
            .features-title {{
                font-size: 18px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 15px;
            }}
            .feature-list {{
                list-style: none;
                padding: 0;
                margin: 0;
            }}
            .feature-item {{
                padding: 8px 0;
                color: #555;
                position: relative;
                padding-left: 25px;
            }}
            .feature-item::before {{
                content: "•";
                color: #3498db;
                font-weight: bold;
                position: absolute;
                left: 0;
            }}
            .cta-button {{
                display: inline-block;
                background: #3498db;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
                transition: background-color 0.3s ease;
            }}
            .cta-button:hover {{
                background: #2980b9;
            }}
            .footer {{
                background: #f8f9fa;
                padding: 25px 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }}
            .footer-text {{
                font-size: 14px;
                color: #666;
                margin: 5px 0;
            }}
            .divider {{
                height: 1px;
                background: #e9ecef;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">{app_name}</div>
            </div>
            
            <div class="content">
                <h1 class="welcome-title">Bienvenue, {username} !</h1>
                <p class="welcome-text">
                    Votre compte a été créé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités de l'application.
                </p>
                
                <div class="features">
                    <h3 class="features-title">Fonctionnalités disponibles</h3>
                    <ul class="feature-list">
                        <li class="feature-item">Analyse des performances des joueurs</li>
                        <li class="feature-item">Statistiques détaillées et historiques</li>
                        <li class="feature-item">Suivi de l'évolution des champions</li>
                        <li class="feature-item">Découverte des patterns de jeu</li>
                        <li class="feature-item">Création et gestion d'équipes</li>
                        <li class="feature-item">Comparaison entre joueurs d'équipe</li>
                        <li class="feature-item">Statistiques d'équipe avancées</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="http://localhost:3000" class="cta-button">
                        Accéder à l'application
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">Merci de nous faire confiance</p>
                <p class="footer-text">L'équipe {app_name}</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_password_reset_email_template(username: str, app_name: str, reset_url: str) -> str:
    """Template HTML pour l'email de réinitialisation de mot de passe"""
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - {app_name}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 0;
                background-color: #f8f9fa;
            }}
            .container {{
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }}
            .header {{
                background: #2c3e50;
                padding: 30px;
                text-align: center;
                color: white;
            }}
            .logo {{
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
                letter-spacing: 1px;
            }}
            .logo::before {{
                content: "🔒";
                margin-right: 8px;
                font-size: 24px;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .alert-title {{
                font-size: 24px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 20px;
                text-align: center;
            }}
            .reset-text {{
                font-size: 16px;
                color: #666;
                margin-bottom: 30px;
                text-align: center;
                line-height: 1.7;
            }}
            .warning-box {{
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }}
            .warning-text {{
                color: #856404;
                font-weight: 600;
                margin: 0;
            }}
            .reset-button {{
                display: inline-block;
                background: #3498db;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
                transition: background-color 0.3s ease;
            }}
            .reset-button:hover {{
                background: #2980b9;
            }}
            .token-info {{
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }}
            .token-label {{
                font-weight: 600;
                color: #495057;
                margin-bottom: 10px;
                display: block;
            }}
            .token-url {{
                font-family: monospace;
                font-size: 12px;
                color: #6c757d;
                word-break: break-all;
                background: white;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #dee2e6;
            }}
            .footer {{
                background: #f8f9fa;
                padding: 25px 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }}
            .footer-text {{
                font-size: 14px;
                color: #666;
                margin: 5px 0;
            }}
            .security-note {{
                font-size: 13px;
                color: #6c757d;
                font-style: italic;
                margin-top: 15px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">{app_name}</div>
            </div>
            
            <div class="content">
                <h1 class="alert-title">Réinitialisation de mot de passe</h1>
                <p class="reset-text">
                    Bonjour {username},<br>
                    Vous avez demandé la réinitialisation de votre mot de passe.
                </p>
                
                <div class="warning-box">
                    <p class="warning-text">Ce lien est valide pendant 24 heures uniquement</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="reset-button">
                        Réinitialiser mon mot de passe
                    </a>
                </div>
                
                <div class="token-info">
                    <span class="token-label">Lien de réinitialisation :</span>
                    <div class="token-url">{reset_url}</div>
                </div>
                
                <p class="security-note">
                    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </p>
            </div>
            
            <div class="footer">
                <p class="footer-text">L'équipe {app_name}</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_plain_text_welcome_email(username: str, app_name: str) -> str:
    """Version texte simple pour l'email de bienvenue"""
    return f"""
    Bonjour {username},

    Bienvenue sur {app_name} !

    Votre compte a été créé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités de l'application :

    - Création d'équipes 
    - Comparaison entre joueurs d'équipe
    - Matchup entre équipes avec simulateur de draft vs une IA (version beta)

    Accédez à l'application : http://localhost:3000

    Si vous avez des questions, n'hésitez pas à nous contacter.

    Cordialement,
    L'équipe {app_name}
    """

def get_plain_text_password_reset_email(username: str, app_name: str, reset_url: str) -> str:
    """Version texte simple pour l'email de réinitialisation"""
    return f"""
    Bonjour {username},

    Vous avez demandé la réinitialisation de votre mot de passe pour {app_name}.

    Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :
    {reset_url}

    IMPORTANT : Ce lien est valide pendant 24 heures uniquement.

    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

    Cordialement,
    L'équipe {app_name}
    """
