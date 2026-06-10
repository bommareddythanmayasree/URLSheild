# Project Assessment Report
## URLShield — AI Malicious URL Detection Platform

> **Audit Date:** June 10, 2026  
> **Auditor Role:** Senior Software Architect / Technical Auditor  
> **Scope:** Full codebase inspection — no modifications made

---

## 1. Project Overview

| Field | Detail |
|---|---|
| **Project Name** | URLShield |
| **Repository** | `malicious-url-detector` (local workspace) |
| **Purpose** | AI-powered web application that classifies URLs as Safe, Suspicious, or Malicious using a trained machine learning model |
| **Business Goal** | Provide a fast, accessible cybersecurity tool that helps non-technical users identify phishing links and scam websites before visiting them |
| **Problem Solved** | Phishing URLs are one of the most prevalent cyber-attack vectors. URLShield gives users a real-time risk score and human-readable explanation for any URL they paste |
| **Target Users** | Students, general internet users, organizations, cybersecurity learners (per README) |

---

## 2. Technology Stack Analysis

### Frontend
| Technology | Version | Notes |
|---|---|---|
| HTML5 | N/A | Single-page, no framework |
| CSS3 | N/A | Hand-written, no preprocessor |
| Vanilla JavaScript | ES2022+ (async/await) | No framework or bundler |

### Backend
| Technology | Version (installed) | Notes |
|---|---|---|
| Python | 3.12 | Confirmed from pip output |
| Flask | 3.1.0 | Installed |
| Flask-CORS | **NOT INSTALLED** | Listed in requirements.txt but missing |
| pandas | 2.2.3 | Installed |
| joblib | 1.4.2 | Installed |
| scikit-learn | **NOT INSTALLED** | Listed in requirements.txt but missing |
| tldextract | **NOT INSTALLED** | Listed in requirements.txt; also unused in code |

### Machine Learning
| Component | Detail |
|---|---|
| Algorithm | RandomForestClassifier (scikit-learn) |
| Training file | `backend/train_model.py` |
| Saved model | `backend/url_model.pkl` (4.3 MB, valid) |
| Legacy model | `backend/model.pkl` (0 bytes — empty/corrupt) |
| Dataset | `dataset/phishing_urls.csv` (235,795 rows, 56 columns) |

### Database
None. No database is used. The dataset CSV is read at startup only for computing feature medians.

### Cloud / External Services
None. The app is fully local. No external APIs, no cloud services, no CDN.

---

## 3. Folder Structure Analysis

```
malicious-url-detector/
├── backend/                  # All server-side logic
│   ├── app.py                # Flask app — main API server, entry point
│   ├── feature_extraction.py # URL feature engineering module
│   ├── train_model.py        # One-time model training script
│   ├── url_model.pkl         # Active trained model (4.3 MB, valid)
│   ├── model.pkl             # Legacy/placeholder model (0 bytes, broken)
│   ├── test_api.py           # Manual HTTP test script (dev tool)
│   ├── test_data.py          # Dataset shape inspection script (dev tool)
│   └── __pycache__/          # Python bytecode cache
├── dataset/
│   └── phishing_urls.csv     # 235,795-row training dataset
├── frontend/
│   ├── index.html            # Single-page UI
│   ├── script.js             # All frontend logic (fetch, DOM updates)
│   └── style.css             # Dark-themed UI styles
├── requirements.txt          # Python dependencies (incomplete)
└── README.md                 # Project documentation (partially stale)
```

### Entry Points
- **Backend:** `backend/app.py` — run with `python app.py`
- **Frontend:** `frontend/index.html` — opened directly in a browser (no server)
- **Model Training:** `backend/train_model.py` — run once to produce `url_model.pkl`

### Component Connections
```
User (Browser)
  └── frontend/index.html
        └── frontend/script.js  ──POST /predict──▶  backend/app.py
                                                          ├── feature_extraction.py (URL parsing)
                                                          ├── url_model.pkl (ML inference)
                                                          └── dataset/phishing_urls.csv (median defaults at startup)
```

---

## 4. Feature Inventory

| Feature | Description | Status | Files Responsible |
|---|---|---|---|
| URL input & submission | User pastes URL, clicks "Scan URL" | Working | `frontend/index.html`, `script.js` |
| Feature extraction | Parses URL into numeric features | Working | `backend/feature_extraction.py` |
| ML inference | RandomForest predicts malicious probability | Working (if sklearn installed) | `backend/app.py`, `url_model.pkl` |
| 3-class classification | Safe / Suspicious / Malicious labels | Working | `backend/app.py` |
| Risk score display | Percentage gauge showing malicious probability | Working | `frontend/script.js`, `style.css` |
| Risk level label | Critical / Medium / Low badge | Working | `backend/app.py`, `frontend/script.js` |
| Explanation engine | Rule-based human-readable reasons | Working | `backend/app.py` (`_generate_explanations`) |
| Neutral defaults | Fills missing page-content features with training medians | Working | `backend/app.py` (`_load_neutral_defaults`) |
| CORS support | Allows browser to call localhost API | Broken | `backend/app.py` — `flask-cors` not installed |
| Responsive layout | Mobile-friendly grid collapse | Working | `frontend/style.css` |
| Model training pipeline | Retrain model from CSV | Working (if sklearn installed) | `backend/train_model.py` |
| Error feedback (UI) | Shows "Backend connection failed" on fetch error | Working | `frontend/script.js` |
| Authentication | API key / user login | Missing | — |
| URL history / logging | Persisting past scans | Missing | — |
| Rate limiting | Prevent API abuse | Missing | — |

---

## 5. UI Analysis

### Screens / Pages

| Screen | Description | Status |
|---|---|---|
| Main scan page | Single-page app with URL input, result card, and risk gauge | Present |

There is only **one screen**. No routing, no multi-page navigation.

### Page Layout
The single page (`frontend/index.html`) consists of:
- **Hero section** — title, subtitle, URL input field, "Scan URL" button
- **Threat card** — shows the scanned URL, prediction badge (Safe/Suspicious/Malicious), risk level label, result description, and bullet list of reasons
- **Probability card** — circular gauge and linear bar meter showing the numeric risk score percentage

### Navigation Flow
There is no navigation. The page is fully self-contained and stateless.

### Missing Screens
- History / scan log page
- About / FAQ page
- Settings or configuration page
- Batch URL scan interface
- Login / user account page

---

## 6. Backend Analysis

### API Endpoints

#### `GET /`
- **Purpose:** Health check
- **Response:** Plain text string `"Malicious URL Detection API is running 🚀"`
- **Auth:** None

#### `POST /predict`
- **Purpose:** Core prediction endpoint
- **Request body (JSON):**
  ```json
  { "url": "https://example.com/login" }
  ```
- **Response (JSON):**
  ```json
  {
    "prediction": "Malicious | Suspicious | Safe",
    "risk_score": 0.87,
    "risk_level": "Critical | Medium | Low",
    "explanations": ["...", "..."],
    "reasons": ["...", "..."],
    "confidence": 87.0
  }
  ```
  Note: `reasons` and `explanations` contain identical data — backward-compat duplication.
- **Thresholds:** `prob >= 0.75` → Malicious/Critical; `prob >= 0.40` → Suspicious/Medium; else Safe/Low
- **Auth:** None
- **Error handling:** Returns `{"error": "Missing 'url' in request body."}` with HTTP 400 if URL field is absent. No other explicit error handling (exceptions would cause unhandled 500s)

### Authentication Mechanism
**None.** The API is completely open with no authentication, API keys, rate limiting, or CORS restriction (despite importing Flask-CORS).

### Error Handling Assessment
- Missing URL body → 400 response (handled)
- `_load_neutral_defaults` has a try/except that silently falls back to zeros
- No try/except around `model.predict_proba()` — a malformed feature vector would cause an unhandled 500
- No input validation on URL format (e.g., empty string after stripping passes through feature extraction)
- Debug `print()` statements left active in production path (duplicated line: `print("[DEBUG] Extracted features:", url_features)` appears twice)

---

## 7. Database Analysis

No database technology is used in this project.

The file `dataset/phishing_urls.csv` serves two purposes:
1. **Training data** — consumed by `train_model.py` to build `url_model.pkl`
2. **Inference defaults** — loaded at server startup by `_load_neutral_defaults()` to compute median feature values for the 45+ page-content columns that cannot be extracted from URL text alone

### Dataset Schema Summary
- **Rows:** 235,795
- **Columns:** 56 total
- **Label distribution:** 134,850 safe (label=1), 100,945 malicious (label=0)
- **Feature categories:**
  - URL-based (11 columns): `URLLength`, `DomainLength`, `IsHTTPS`, etc.
  - Page-content (44 columns): `LineOfCode`, `HasTitle`, `HasFavicon`, `NoOfImage`, `NoOfJS`, `HasPasswordField`, `HasHiddenFields`, etc.
- **Unused at inference:** All 44 page-content columns — substituted with median defaults

---

## 8. AI/ML Analysis

### Model
- **Algorithm:** `RandomForestClassifier(n_estimators=200)` from scikit-learn
- **Serialization:** `joblib.dump((model, feature_names), "url_model.pkl")`
- **Active model file:** `url_model.pkl` — 4.3 MB, valid
- **Broken model file:** `model.pkl` — 0 bytes, empty. The README references `model.pkl` but the app loads `url_model.pkl`. `model.pkl` is dead weight.

### Training Pipeline (`train_model.py`)
1. Load `../dataset/phishing_urls.csv`
2. Select numeric columns only, drop `label`
3. `train_test_split` (80/20, random_state=42)
4. Fit `RandomForestClassifier(n_estimators=200)`
5. Print accuracy on test set
6. Save `(model, feature_names)` tuple to `url_model.pkl`

**Weaknesses:**
- No cross-validation
- No hyperparameter tuning
- No class imbalance handling (134k safe vs 100k malicious)
- No evaluation metrics beyond accuracy (no precision, recall, F1, AUC-ROC)
- No data preprocessing or normalization (tree-based model tolerates this, but it's not documented)

### Inference Pipeline (`app.py`)
1. Load `url_model.pkl` at startup
2. Load neutral defaults (medians) from CSV at startup
3. On each `/predict` call: extract URL features → build aligned DataFrame → `model.predict_proba()` → threshold classification → rule-based explanations

### Feature Mismatch (Critical)
The model was trained on **54 features** (all numeric columns in the dataset). At inference, only **11 URL-based features** are populated from actual data. The remaining ~43 features are filled with **training set medians**. This is a significant accuracy compromise — the model effectively operates in a degraded mode for all real-world predictions.

### Datasets Referenced
- `dataset/phishing_urls.csv` — present and valid

---

## 9. Dependency Analysis

### `requirements.txt` Contents vs Installed State

| Package | In requirements.txt | Installed | Version | Notes |
|---|---|---|---|---|
| flask | ✅ | ✅ | 3.1.0 | Working |
| pandas | ✅ | ✅ | 2.2.3 | Working |
| joblib | ✅ | ✅ | 1.4.2 | Working |
| scikit-learn | ✅ | ❌ | — | **MISSING — app cannot load model** |
| flask-cors | ✅ | ❌ | — | **MISSING — CORS will fail at import** |
| tldextract | ✅ | ❌ | — | Missing, but **not actually used in code** |

### Issues
- **No version pinning** — all packages listed without versions (`flask` instead of `flask==3.1.0`). This makes the environment non-reproducible.
- `tldextract` is in requirements but never imported or called anywhere in the codebase — dead dependency.
- `numpy` is implicitly required by pandas and scikit-learn but not listed.
- `flask-cors` import at the top of `app.py` will raise `ModuleNotFoundError` immediately on startup since it is not installed.

---

## 10. Configuration Analysis

### Environment Variables
**None defined.** The application has no `.env` file, no `os.environ` calls, and no configuration management. All values are hardcoded.

### Hardcoded Values
| Value | Location | Risk |
|---|---|---|
| Dataset path `"../dataset/phishing_urls.csv"` | `app.py`, `train_model.py` | Breaks if working directory changes |
| Model path `"url_model.pkl"` | `app.py` | Relative path assumption |
| API URL `"http://127.0.0.1:5000/predict"` | `frontend/script.js` | Hardcoded localhost — unusable in production |
| Debug mode `app.run(debug=True)` | `app.py` | Debug mode enabled in production code |

### Secrets / API Keys
None expected or used. No third-party service integration.

### Deployment Configuration
**None exists.** No `Dockerfile`, no `docker-compose.yml`, no `Procfile`, no `gunicorn` config, no `.env.example`, no CI/CD pipeline, no `wsgi.py`.

---

## 11. Architecture Diagram Description

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                          │
│                                                                 │
│  frontend/index.html                                            │
│  frontend/style.css   ◀── Renders UI (dark dashboard)          │
│  frontend/script.js   ──── POST /predict ──────────────────────┼──┐
└─────────────────────────────────────────────────────────────────┘  │
                                                                      │ HTTP
                                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Flask / Python)                     │
│                    backend/app.py                               │
│                                                                 │
│  1. Receives URL string                                         │
│  2. Calls feature_extraction.py ──▶ 11 URL numeric features     │
│  3. Fills ~43 page-content features with training medians       │
│  4. Calls model.predict_proba() ──▶ malicious probability       │
│  5. Applies thresholds → classification label                   │
│  6. Runs rule-based explanation engine                          │
│  7. Returns JSON response                                       │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐  ┌───────────────────────────────┐
│  backend/url_model.pkl   │  │  dataset/phishing_urls.csv    │
│  RandomForest (200 trees)│  │  235,795 rows, 56 columns     │
│  Trained on 54 features  │  │  Used only at startup for     │
│  4.3 MB                  │  │  median default computation   │
└──────────────────────────┘  └───────────────────────────────┘

No external services. No database. No cloud.
```

---

## 12. Code Quality Assessment

### Strengths
- Clean separation between feature extraction (`feature_extraction.py`) and inference logic (`app.py`)
- Neutral defaults mechanism is a thoughtful workaround for the feature gap problem
- Explanation engine is rule-based and transparent — reasons are human-readable
- Frontend error handling gracefully shows user-friendly messages when the backend is unreachable
- `escapeHtml()` function in `script.js` prevents basic XSS injection from API response content
- CSS is well-organized and uses modern techniques (conic-gradient, backdrop-filter, CSS Grid)
- Responsive layout handles mobile breakpoints

### Weaknesses
- **Duplicate debug print** in `app.py`: `print("[DEBUG] Extracted features:", url_features)` appears twice consecutively
- **`model.pkl` is 0 bytes** and serves no purpose — misleading artifact
- **README is stale**: refers to `templates/index.html` and `static/styles.css` which don't exist; actual structure is different
- **`test_api.py` is broken**: sends `NumDots`, `NumDash`, `NumDigits` as the JSON body instead of `{"url": "..."}`, which will receive a 400 error
- No logging framework — only raw `print()` statements
- No input sanitization on the URL beyond checking for empty string

### Technical Debt
- Feature mismatch (54 trained vs 11 inferred) is the largest technical debt item — it fundamentally limits model accuracy
- Hardcoded localhost URL in `script.js` makes any deployment non-trivial
- `app.run(debug=True)` must be removed before any production use
- No version pinning in `requirements.txt`
- `tldextract` listed as dependency but never used

### Security Concerns
| Concern | Severity | Location |
|---|---|---|
| No authentication on API | High | `backend/app.py` |
| No rate limiting | High | `backend/app.py` |
| `debug=True` in Flask | Medium | `backend/app.py` |
| Hardcoded `127.0.0.1` in frontend | Medium | `frontend/script.js` |
| Relative file paths for model/dataset | Low | `backend/app.py` |
| No HTTPS for frontend-to-backend communication | Medium | Architecture |

### Performance Concerns
- **CSV loaded at every server startup** (235k rows) to compute medians — acceptable for development, slow for cold starts in production
- No caching of prediction results
- `RandomForest` inference is fast, but model is loaded once at startup (correct pattern)
- No request queuing or async handling — sequential blocking under concurrent load

---

## 13. Missing Components

### Missing Files
| File | Expected | Impact |
|---|---|---|
| `backend/wsgi.py` | Production WSGI entry point | Cannot deploy to Gunicorn/uWSGI |
| `.env` / `.env.example` | Environment configuration | No config management |
| `Dockerfile` | Containerization | Not deployable to cloud/containers |
| `requirements.txt` with versions | Pinned dependencies | Reproducibility broken |
| `backend/model.pkl` | Was intended as trained model | 0 bytes — empty file |

### Incomplete Features
- **Page-content feature extraction**: The model was trained on 44 HTML/JS page features (form fields, iframes, redirects, favicon, etc.) but inference only uses URL-text features. This is architecturally incomplete.
- **CORS configuration**: `flask-cors` is imported and `CORS(app)` is called, but the package is not installed — CORS is non-functional.

### Dead Code
- `backend/model.pkl` — 0-byte file, never loaded, never referenced in active code
- `tldextract` — in `requirements.txt` but never imported in any file

### Broken Imports
- `from flask_cors import CORS` in `app.py` — will raise `ModuleNotFoundError` since `flask-cors` is not installed

### TODO / Debug Artifacts
- Duplicate `print("[DEBUG] Extracted features:", url_features)` in `app.py` lines ~80-81
- All `print("[DEBUG] ...")` statements throughout `app.py` are development artifacts that should be replaced with proper logging

---

## 14. Deployment Readiness

| Area | Score | Justification |
|---|---|---|
| Frontend | 5/10 | UI is complete and responsive, but API URL is hardcoded to localhost — non-deployable without manual edits |
| Backend | 3/10 | Core logic works locally, but flask-cors and scikit-learn are uninstalled, debug mode is on, no WSGI config, no error handling for model failures |
| Database | N/A | No database used |
| AI/ML | 6/10 | Model is trained, saved, and loads correctly (when sklearn is installed). Training pipeline is functional but lacks evaluation rigor and the 54-vs-11 feature gap limits real-world accuracy |
| Production | 2/10 | No auth, no rate limiting, no HTTPS, no container config, missing dependencies, debug mode on, hardcoded paths |

---

## 15. Final Executive Summary

### A. What Currently Works
- The frontend UI is fully functional visually — input, gauge, badge, and reasons list all render correctly
- Feature extraction from URL text (`feature_extraction.py`) is correctly implemented
- The trained model (`url_model.pkl`) is valid and will load correctly once scikit-learn is installed
- The prediction logic (probability thresholds, label assignment, explanation engine) is logically sound
- The dataset is present, valid, and has 235,795 labeled samples
- Responsive CSS and basic XSS protection in the frontend work correctly

### B. What Is Partially Implemented
- **ML inference**: Works structurally, but 44 of 54 features (all page-content features) are filled with medians rather than real values — the model operates significantly below its trained capability
- **CORS**: Code is in place (`CORS(app)`) but the dependency is not installed, so browser requests will fail with CORS errors
- **Error handling**: Only the "missing URL" case is explicitly handled; model errors, file-not-found, and malformed inputs would cause unhandled 500s

### C. What Is Completely Missing
- `scikit-learn` and `flask-cors` are not installed — the backend **cannot start**
- No authentication or rate limiting on the API
- No production deployment configuration (Dockerfile, WSGI, env vars)
- No version pinning in `requirements.txt`
- Page-content feature extraction (HTML scraping, form detection, redirect following) — would close the accuracy gap but is not implemented
- Multi-page navigation, scan history, user accounts

### D. Recommended Next Steps (Priority Order)

1. **Install missing dependencies** — `pip install scikit-learn flask-cors` immediately; pin all versions in `requirements.txt`
2. **Fix broken import crash** — verify `flask-cors` is installed and importable before the server starts
3. **Remove `debug=True`** from `app.py` and replace `print()` statements with Python `logging`
4. **Fix `test_api.py`** — change request body to `{"url": "https://example.com"}` to match the actual API contract
5. **Delete `backend/model.pkl`** — the 0-byte file is misleading; remove or replace with a note
6. **Pin dependency versions** in `requirements.txt` (e.g., `flask==3.1.0`, `scikit-learn==1.x.x`)
7. **Parameterize the frontend API URL** — move `http://127.0.0.1:5000` to a configurable constant or build-time variable
8. **Add try/except around `predict_proba`** in `app.py` to return graceful 500 responses
9. **Add page-content feature extraction** (HTTP fetch + BeautifulSoup) to utilize the full model feature set and improve accuracy
10. **Add a `Dockerfile` and `wsgi.py`** to enable actual deployment beyond localhost
