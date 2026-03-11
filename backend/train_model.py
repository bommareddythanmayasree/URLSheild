import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

data = pd.read_csv("../dataset/phishing_urls.csv")

y = data["label"]

# keep numeric columns
X = data.select_dtypes(include=['int64','float64'])
X = X.drop("label", axis=1)

# SAVE FEATURE NAMES
feature_names = X.columns

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=200)

model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)

print("Accuracy:", accuracy)

# save model + feature names
joblib.dump((model, feature_names), "url_model.pkl")

print("Model saved")