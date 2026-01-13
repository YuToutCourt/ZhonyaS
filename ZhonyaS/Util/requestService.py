import os
import time

import requests
from icecream import ic

API_KEY = os.getenv("API_KEY")


def requestRiot(url, retryCount=0):
    maxRetryCount = 10
    if retryCount > maxRetryCount:
        return False

    headers = {"X-Riot-Token": API_KEY}
    response = requests.get(url, headers=headers)

    if response.status_code == 429:
        ic(
            f"Error Request : Rate Limit atteint pour FindByPuuid(), tentative n°{retryCount}/{maxRetryCount}"
        )
        time.sleep(retryCount * 3)
        return requestRiot(url, retryCount + 1)

    if response.status_code != 200:
        ic(f"Error Request : {response.status_code} -- {response.json()}")
        return False

    return response.json()
