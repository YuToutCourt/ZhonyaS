import time
import threading

class RateLimiter:
    def __init__(self, max_per_second=20, max_per_2_minutes=100):
        self.max_per_second = max_per_second
        self.max_per_2_minutes = max_per_2_minutes
        self.lock = threading.Lock()

        self.requests_per_second = []
        self.requests_per_2_minutes = []

    def wait_for_slot(self):
        with self.lock:
            current_time = time.time()

            # Nettoyage des requêtes obsolètes
            self.requests_per_second = [t for t in self.requests_per_second if t > current_time - 1]
            self.requests_per_2_minutes = [t for t in self.requests_per_2_minutes if t > current_time - 120]

            # Vérification du quota par seconde
            if len(self.requests_per_second) >= self.max_per_second:
                sleep_time = 1 - (current_time - self.requests_per_second[0])
                time.sleep(sleep_time)

            # Vérification du quota par 2 minutes
            if len(self.requests_per_2_minutes) >= self.max_per_2_minutes:
                sleep_time = 120 - (current_time - self.requests_per_2_minutes[0])
                time.sleep(sleep_time)

            # Enregistrement de la requête
            self.requests_per_second.append(time.time())
            self.requests_per_2_minutes.append(time.time())

rate_limiter = RateLimiter()
