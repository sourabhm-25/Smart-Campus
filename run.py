import requests

url = "http://127.0.0.1:8000/generate-task"
payload = {"topic": " Journey of a River"}

response = requests.post(url, json=payload)
print(response.json())
