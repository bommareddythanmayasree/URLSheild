# 🛡️ URLShield — AI-Powered URL Threat Intelligence

URLShield is a production-quality cybersecurity web application that detects malicious, phishing, and suspicious URLs using a trained RandomForest ML model. It analyses 29 URL-derived signals in real time and provides a risk score, classification, and human-readable AI explanations.

---

## ✨ Features

- **AI Detection** — RandomForest classifier trained on 235,795 labeled URLs (99.57% accuracy, F1 0.9949)
- **29 URL Features** — entropy, subdomain depth, IP detection, punycode, suspicious TLDs, brand spoofing, and more
- **3-Level Classification** — Safe · Suspicious · Malicious with risk score and confidence
- **Explainable AI** — rule-based reasoning engine explains every prediction in plain English
- **Feature Analysis Panel** — shows all 29 extracted signals with visual bars
- **Scan History** — last 10 scans persisted in browser localStorage
- **Modern Cybersecurity UI** — dark SaaS dashboard with animated risk gauge
- **Production Ready** — Docker, gunicorn, rate limiting, structured logging, env config

---

## 🏗️ Project Structure

```
URLShield/
├── backend/
│   ├── app.py                 # Flask API — routes, prediction logic
│   ├── config.py              # Centralised config via env variables
│   ├── feature_extraction.py  # 29-feature URL engineering module
│   ├── train_model.py         # Training pipeline with full evaluation
│   ├── url_model.pkl          # Trained RandomForest model (generated)
│   ├── model_metrics.json     # Training metrics (generated)
│   └── test_api.py            # API smoke tests
├── dataset/
│   └── phishing_urls.csv      # 235,795-row training dataset
├── frontend/
│   ├── index.html             # Single-page cybersecurity dashboard
│   ├── script.js              # Scan logic, feature display, history
│   └── style.css              # Dark SaaS theme
├── .env.example               # Environment variable template
├── Dockerfile                 # Production container
├── docker-compose.yml         # Full-stack local deployment
├── nginx.conf                 # Frontend + API proxy config
└── requirements.txt           # Pinned Python dependencies
```

---

## 🚀 Quick Start (Local)

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the model (first run only)
```bash
cd backend
python train_model.py
```

### 3. Start the API
```bash
cd backend
python app.py
```

### 4. Open the frontend
Open `frontend/index.html` in your browser, or serve it with any static server.

---

## 🐳 Docker Deployment

```bash
# Build and start both services
docker compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

---

## ☁️ Cloud Deployment

### Render (Backend)
1. Connect your GitHub repository to [render.com](https://render.com)
2. Create a new **Web Service** pointing to the repo root
3. Set **Build Command**: `pip install -r requirements.txt && cd backend && python train_model.py`
4. Set **Start Command**: `cd backend && gunicorn app:app`
5. Add environment variables from `.env.example`

### Vercel / GitHub Pages (Frontend)
1. Update `API_BASE` in `frontend/script.js` to your Render service URL
2. Deploy the `frontend/` folder as a static site

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `FLASK_DEBUG` | `false` | Enable debug mode (dev only) |
| `MODEL_PATH` | `url_model.pkl` | Path to trained model |
| `DATASET_PATH` | `../dataset/phishing_urls.csv` | Dataset path |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |
| `RATE_LIMIT_PREDICT` | `60 per minute` | Per-IP rate limit |
| `LOG_LEVEL` | `INFO` | Logging verbosity |
| `PORT` | `5000` | Server port |

---

## 🧠 ML Model

| Metric | Value |
|---|---|
| Algorithm | RandomForestClassifier (300 trees) |
| Training samples | 188,636 |
| Test samples | 47,159 |
| Accuracy | 99.57% |
| F1 Score (malicious) | 0.9949 |
| CV F1 Mean | 0.9963 ± 0.0002 |
| Features | 29 URL-derived signals |

**Top features by importance:** IsHTTPS, URLDepth, NoOfDegitsInURL, DigitRatioInURL, URLLength, URLEntropy

---

## 🔒 Security

- Rate limiting (60 req/min per IP via Flask-Limiter)
- CORS origin restriction
- Input validation (length, encoding)
- No debug mode in production
- Non-root Docker user
- Structured logging (no stack traces in responses)

---

## 📡 API Reference

### `POST /api/v1/predict`
```json
// Request
{ "url": "https://example.com/login" }

// Response
{
  "prediction": "Safe | Suspicious | Malicious",
  "risk_score": 0.87,
  "risk_level": "Low | Medium | Critical",
  "confidence": 87.0,
  "explanations": ["..."],
  "features": { "URLLength": 32, "IsHTTPS": 1, ... }
}
```

### `GET /health`
```json
{ "status": "ok", "model_loaded": true, "version": "v1" }
```

### `GET /api/v1/metrics`
Returns full training metrics (accuracy, F1, confusion matrix, feature importance).

---

## 📜 License
MIT License
