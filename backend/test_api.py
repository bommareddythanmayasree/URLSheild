import requests

url = "http://127.0.0.1:5000/predict"

data = {
    "NumDots": 2,
    "NumDash": 1,
    "NumDigits": 0
}

response = requests.post(url, json=data)

print("Status code:", response.status_code)
print("Response text:", response.text)