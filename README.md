🛡️ URLShield – AI Malicious URL Detection Platform

URLShield is an AI-powered cybersecurity web application that detects malicious, phishing, or suspicious URLs using machine learning.
Users can paste any link and instantly receive a risk score, threat classification, and explanation of why the URL is considered safe or dangerous.

This project helps users avoid phishing attacks, scam websites, and malicious links by providing fast and intelligent URL analysis.

🚀 Features

✅ Detects malicious and phishing URLs
✅ Provides a risk score for each URL
✅ Explains why a URL is suspicious
✅ Fast AI-based prediction system
✅ Simple web interface for testing links
✅ Helps prevent cybersecurity threats and scams

🧠 How It Works

User enters a URL in the web interface

The system extracts important URL features

The trained Machine Learning model analyzes the features

The model predicts whether the URL is:

Safe

Suspicious

Malicious

The system returns:

Risk score

Classification

Threat explanation

🏗️ Tech Stack
Frontend

HTML

CSS

JavaScript

Backend

Python

Flask

Machine Learning

Scikit-learn

Pandas

NumPy

Other Tools

Feature extraction for URLs

Cybersecurity dataset for training

📂 Project Structure
URLShield/
│
├── app.py                # Flask backend server
├── model.pkl             # Trained ML model
├── feature_extraction.py # URL feature extractor
│
├── templates/
│   └── index.html        # Web interface
│
├── static/
│   └── styles.css        # Styling
│
├── dataset/              # Training dataset
│
└── README.md
⚙️ Installation

Clone the repository:

git clone https://github.com/bommareddythanmayasree/URLSheild.git
cd URLSheild

Install dependencies:

pip install -r requirements.txt

Run the application:

python app.py

Open in browser:

http://127.0.0.1:5000
📊 Machine Learning Model

The system uses a supervised machine learning classifier trained on malicious and legitimate URLs.

The model analyzes features such as:

URL length

Presence of suspicious characters

Number of subdomains

Use of HTTPS

Special symbols

Domain patterns

These features help the model identify phishing and scam websites.

🖥️ Example

Input URL:

http://paypal-secure-login.verify-account.com

Output:

Risk Score: 92%
Prediction: Malicious URL
Reason: Suspicious domain pattern and excessive subdomains
🌍 Real World Impact

Cyber attacks are increasing rapidly and phishing links are one of the most common attack methods.

URLShield helps:

Students

Internet users

Organizations

Cybersecurity learners

to detect unsafe links before visiting them.

📌 Future Improvements

Deep learning based URL detection

Chrome browser extension

Real-time URL scanning

Domain reputation APIs

Community reporting system

🤝 Contributing

Contributions are welcome!

Fork the repository

Create a feature branch

Commit changes

Submit a pull request

📜 License

This project is licensed under the MIT License.
