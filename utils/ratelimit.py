import time
import threading
import requests
from icecream import ic

class RateLimiter:
    def __init__(self, max_per_second=20, max_per_2_minutes=100):
        self.max_per_second = max_per_second
        self.max_per_2_minutes = max_per_2_minutes
        self.lock = threading.Lock()

        self.requests_per_second = []
        self.requests_per_2_minutes = []

    def wait_for_slot(self):
        """Attend un slot disponible selon les limites de rate"""
        with self.lock:
            current_time = time.time()

            # Nettoyage des requêtes obsolètes
            self.requests_per_second = [t for t in self.requests_per_second if t > current_time - 1]
            self.requests_per_2_minutes = [t for t in self.requests_per_2_minutes if t > current_time - 120]

            # Vérification du quota par seconde
            if len(self.requests_per_second) >= self.max_per_second:
                sleep_time = 1 - (current_time - self.requests_per_second[0])
                if sleep_time > 0:
                    ic(f"Rate limit per second: waiting {sleep_time:.2f}s")
                    time.sleep(sleep_time)

            # Vérification du quota par 2 minutes
            if len(self.requests_per_2_minutes) >= self.max_per_2_minutes:
                sleep_time = 120 - (current_time - self.requests_per_2_minutes[0])
                if sleep_time > 0:
                    ic(f"Rate limit per 2 minutes: waiting {sleep_time:.2f}s")
                    time.sleep(sleep_time)

            # Enregistrement de la requête
            self.requests_per_second.append(time.time())
            self.requests_per_2_minutes.append(time.time())

    def handle_rate_limit_error(self, response, max_retries=10):
        """
        Gère les erreurs de rate limit de l'API Riot
        Retourne le temps d'attente recommandé
        """
        if response.status_code != 429:
            return 0
        
        # Récupération des headers de rate limit
        retry_after = response.headers.get('Retry-After')
        x_rate_limit_type = response.headers.get('X-Rate-Limit-Type', '')
        x_rate_limit_limit = response.headers.get('X-Rate-Limit-Limit', '')
        x_rate_limit_count = response.headers.get('X-Rate-Limit-Count', '')
        
        ic(f"Rate limit détecté: {x_rate_limit_type}")
        ic(f"Headers: Limit={x_rate_limit_limit}, Count={x_rate_limit_count}")
        
        # Calcul du temps d'attente
        wait_time = 0
        
        if retry_after:
            # Si l'API nous dit combien attendre
            wait_time = int(retry_after)
            ic(f"API recommande d'attendre {wait_time}s")
        else:
            # Calcul basé sur le type de rate limit
            if 'application' in x_rate_limit_type.lower():
                # Rate limit par application (plus long)
                wait_time = 60  # 1 minute
            elif 'method' in x_rate_limit_type.lower():
                # Rate limit par méthode (moyen)
                wait_time = 30  # 30 secondes
            else:
                # Rate limit par seconde (court)
                wait_time = 2   # 2 secondes
        
        # Attendre le temps calculé
        if wait_time > 0:
            ic(f"Attente de {wait_time}s avant retry...")
            time.sleep(wait_time)
        
        return wait_time

    def make_request_with_retry(self, request_func, *args, **kwargs):
        """
        Exécute une requête avec retry automatique en cas de rate limit
        Ne skip jamais - retry jusqu'à réussir
        """
        max_retries = 20  # Maximum de retries
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Attendre un slot avant la requête
                self.wait_for_slot()
                
                # Faire la requête
                response = request_func(*args, **kwargs)
                
                # Si succès, retourner la réponse
                if response.status_code == 200:
                    return response
                
                # Si rate limit, gérer l'attente
                if response.status_code == 429:
                    wait_time = self.handle_rate_limit_error(response)
                    retry_count += 1
                    ic(f"Retry {retry_count}/{max_retries} après rate limit")
                    continue
                
                # Autres erreurs (404, 500, etc.)
                ic(f"Erreur {response.status_code}: {response.text}")
                return response
                
            except requests.exceptions.RequestException as e:
                ic(f"Erreur de requête: {e}")
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = min(5 * retry_count, 60)  # Attente progressive
                    ic(f"Retry {retry_count}/{max_retries} dans {wait_time}s")
                    time.sleep(wait_time)
                else:
                    raise e
        
        # Si on arrive ici, on a épuisé les retries
        raise Exception(f"Trop de tentatives ({max_retries}) pour cette requête")

rate_limiter = RateLimiter()
