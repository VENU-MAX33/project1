"""
UPI Fraud Detection — Model Training Script
=============================================
Generates a synthetic dataset and trains a Random Forest classifier
to detect fraudulent UPI transactions.

Run:   python model.py
Output: fraud_model.pkl  (model + label encoders)
        ../dataset/transactions.csv  (generated dataset)
"""

import os
import random
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report

# ---------------------------------------------------------------------------
# 1. Generate synthetic dataset
# ---------------------------------------------------------------------------

def generate_dataset(n=2000, fraud_ratio=0.15):
    """Create a realistic-looking synthetic UPI transaction dataset."""

    random.seed(42)
    np.random.seed(42)

    cities = [
        "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata",
        "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
        "Surat", "Nagpur", "Indore", "Bhopal", "Patna"
    ]
    devices = ["Mobile", "Desktop", "Tablet"]

    rows = []
    n_fraud = int(n * fraud_ratio)
    n_safe  = n - n_fraud

    # --- Safe transactions ---
    for i in range(n_safe):
        rows.append({
            "transaction_id": f"TXN{i+1:05d}",
            "sender_upi":    f"user{random.randint(1000,9999)}@upi",
            "receiver_upi":  f"shop{random.randint(1000,9999)}@upi",
            "amount":        round(random.uniform(10, 15000), 2),
            "location":      random.choice(cities),
            "device_type":   random.choices(devices, weights=[70, 20, 10])[0],
            "hour":          random.choices(range(24), weights=[
                1,1,1,1,1,2, 4,6,8,9,10,10,
                9,8,8,7,7,6, 5,4,3,2,1,1
            ])[0],
            "is_fraud": 0,
        })

    # --- Fraudulent transactions ---
    for i in range(n_fraud):
        rows.append({
            "transaction_id": f"TXN{n_safe+i+1:05d}",
            "sender_upi":    f"user{random.randint(1000,9999)}@upi",
            "receiver_upi":  f"shop{random.randint(1000,9999)}@upi",
            "amount":        round(random.uniform(20000, 100000), 2),
            "location":      random.choice(cities[:5]),          # concentrated
            "device_type":   random.choices(devices, weights=[40, 40, 20])[0],
            "hour":          random.choice([0, 1, 2, 3, 4, 5, 23]),  # odd hours
            "is_fraud": 1,
        })

    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    return df


# ---------------------------------------------------------------------------
# 2. Preprocess & train
# ---------------------------------------------------------------------------

def train_model():
    print("📊  Generating synthetic dataset …")
    df = generate_dataset()

    # Save CSV
    csv_path = os.path.join(os.path.dirname(__file__), "..", "dataset", "transactions.csv")
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    df.to_csv(csv_path, index=False)
    print(f"✅  Dataset saved  →  {csv_path}  ({len(df)} rows)")

    # Encode categorical columns
    le_location = LabelEncoder()
    le_device   = LabelEncoder()

    df["location_enc"]    = le_location.fit_transform(df["location"])
    df["device_type_enc"] = le_device.fit_transform(df["device_type"])

    features = ["amount", "location_enc", "device_type_enc", "hour"]
    X = df[features]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("🤖  Training Random Forest classifier …")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight="balanced",
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec  = recall_score(y_test, y_pred)

    print(f"\n{'='*40}")
    print(f"  Accuracy  : {acc:.4f}")
    print(f"  Precision : {prec:.4f}")
    print(f"  Recall    : {rec:.4f}")
    print(f"{'='*40}\n")
    print(classification_report(y_test, y_pred, target_names=["Safe", "Fraud"]))

    # Save model + encoders
    model_path = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump({
            "model":       clf,
            "le_location": le_location,
            "le_device":   le_device,
            "features":    features,
            "cities":      list(le_location.classes_),
            "devices":     list(le_device.classes_),
        }, f)
    print(f"✅  Model saved  →  {model_path}")


if __name__ == "__main__":
    train_model()
