from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

from feature_extraction import extract_features

app = Flask(__name__)
CORS(app)

model, feature_names = joblib.load("url_model.pkl")


def _load_neutral_defaults(feature_names_index) -> pd.Series:
    """
    Compute per-feature neutral defaults from the training dataset (median values),
    so missing features at inference don't collapse to all-zeros.
    """
    try:
        df = pd.read_csv("../dataset/phishing_urls.csv")
        numeric_df = df.select_dtypes(include=["int64", "float64"])
        # Keep only the exact feature schema used during training (and in the same order)
        aligned = numeric_df.reindex(columns=list(feature_names_index))
        medians = aligned.median(numeric_only=True)
        # If any column is entirely missing/NaN, fall back to 0
        medians = medians.fillna(0)
        return medians
    except Exception as e:
        print(f"[DEBUG] Failed to load neutral defaults: {e}")
        return pd.Series([0] * len(feature_names_index), index=list(feature_names_index))


NEUTRAL_DEFAULTS = _load_neutral_defaults(feature_names)


def _generate_explanations(url_features: dict, risk_score: float, prediction: str) -> list[str]:
    """
    Phishing explanation engine: concise, security-focused rules based on extracted URL features.
    """
    explanations: list[str] = []

    url_length = int(url_features.get("URLLength", 0) or 0)
    domain_dots = int(url_features.get("domain_dots", 0) or 0)
    domain_digits = int(url_features.get("domain_digits", 0) or 0)
    hyphens = int(url_features.get("num_hyphens_full", 0) or 0)

    kw_found = url_features.get("suspicious_keywords_found") or []
    kw_found = [str(k) for k in kw_found][:3]

    # Rule-based signals (requested examples)
    if url_length > 60:
        explanations.append("The URL is unusually long, which is common in phishing links.")

    if domain_dots > 3:
        explanations.append("Multiple subdomains detected, which can indicate phishing.")

    if kw_found:
        explanations.append(f"The URL contains phishing-related keyword(s): {', '.join(kw_found)}.")
    else:
        explanations.append("No suspicious keywords detected in the URL.")

    if domain_digits > 0:
        explanations.append("Presence of digits in the domain can indicate suspicious links.")
    else:
        explanations.append("No digits detected in the domain.")

    if hyphens > 2:
        explanations.append("Multiple hyphens detected, often used to mimic legitimate domains.")
    else:
        explanations.append("Domain does not use excessive hyphens.")

    # Positive/neutral structure explanations (when Safe)
    if prediction.lower() == "safe":
        if url_length <= 60:
            explanations.append("URL length is typical.")
        if domain_dots <= 3:
            explanations.append("Domain structure appears normal.")

    # Combine ML probability with rules (concise)
    if risk_score >= 0.7:
        explanations.append("ML risk score is high; treat this link as suspicious until verified.")
    elif risk_score >= 0.3:
        explanations.append("ML risk score is moderate; verify the sender and domain before trusting this link.")
    else:
        explanations.append("ML risk score is low; no strong phishing signals were detected.")

    # Keep concise
    return explanations[:7]


@app.route("/")
def home():
    return "Malicious URL Detection API is running 🚀"


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}

    url = data.get("url")
    if not url:
        return jsonify({"error": "Missing 'url' in request body."}), 400

    # Extract URL-based phishing features
    url_features = extract_features(url)

    # Build feature vector aligned EXACTLY with the model's expected feature order.
    # Start from neutral defaults computed from training data, then override with URL-only fields.
    features_df = pd.DataFrame([NEUTRAL_DEFAULTS.reindex(list(feature_names)).to_list()], columns=feature_names)

    for key, value in url_features.items():
        if key in features_df.columns:
            features_df.at[0, key] = value

    # Compute malicious probability from predict_proba (single source of truth)
    class_list = list(getattr(model, "classes_", []))
    # Dataset uses label 0 for malicious, 1 for safe; we want probability of malicious.
    malicious_index = class_list.index(0) if 0 in class_list else 0
    prob = float(model.predict_proba(features_df)[0][malicious_index])

    # Threshold-based classification using only the probability (no model.predict())
    if prob >= 0.75:
        prediction = "Malicious"
        risk_level = "Critical"
    elif prob >= 0.40:
        prediction = "Suspicious"
        risk_level = "Medium"
    else:
        prediction = "Safe"
        risk_level = "Low"

    explanations = _generate_explanations(url_features, prob, prediction)

    # Debug logs
    print("[DEBUG] URL:", url)
    print("[DEBUG] Extracted features:", url_features)
    print("[DEBUG] Extracted features:", url_features)
    print("[DEBUG] Malicious probability:", prob)
    print("[DEBUG] Chosen label:", prediction)
    print("[DEBUG] Explanations:", explanations)

    return jsonify(
        {
            "prediction": prediction,
            "risk_score": prob,
            "risk_level": risk_level,
            "explanations": explanations,
            # Backward compatibility for existing frontend
            "reasons": explanations,
            # Optional: keep confidence for UI meters
            "confidence": prob * 100,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)