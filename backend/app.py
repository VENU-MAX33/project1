"""
UPI Fraud Detection — Flask Backend
====================================
API server that loads the trained ML model and serves predictions.
Also integrates with Appwrite for transaction storage.

Routes:
  POST /predict_fraud     – Analyze a transaction
  POST /store_transaction – Save to Appwrite
  GET  /transactions      – Fetch all stored transactions
"""

import os
import pickle
import datetime
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# Appwrite imports
try:
    from appwrite.client import Client
    from appwrite.services.databases import Databases as AppwriteDatabases
    from appwrite.id import ID
except ImportError:
    Client = None
    AppwriteDatabases = None
    ID = None

# ---------------------------------------------------------------------------
# Load .env file if it exists
# ---------------------------------------------------------------------------
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
# Configure CORS more restrictively for production
# In production, replace with actual frontend domain
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:5000", "https://*.vercel.app"])

# Add security headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;"
    return response

# ---------------------------------------------------------------------------
# Load ML model
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)

    model       = bundle["model"]
    le_location = bundle["le_location"]
    le_device   = bundle["le_device"]
    cities      = bundle["cities"]
    devices     = bundle["devices"]
    feature_names = bundle["features"]  # ["amount", "location_enc", "device_type_enc", "hour"]
    model_loaded = True
    print("[OK]  ML model loaded successfully")
except Exception as e:
    print(f"[ERROR]  Failed to load ML model: {e}")
    model_loaded = False
    # Set default values to prevent crashes
    model = None
    le_location = None
    le_device = None
    cities = []
    devices = []
    feature_names = ["amount", "location_enc", "device_type_enc", "hour"]

# ---------------------------------------------------------------------------
# Appwrite setup  (reads from environment variables)
# ---------------------------------------------------------------------------
APPWRITE_ENDPOINT   = os.getenv("APPWRITE_ENDPOINT", "")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID", "")
APPWRITE_API_KEY    = os.getenv("APPWRITE_API_KEY", "")
APPWRITE_DB_ID      = os.getenv("APPWRITE_DB_ID", "")
APPWRITE_COLLECTION = os.getenv("APPWRITE_COLLECTION_ID", "")

appwrite_ready = all([
    APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY, APPWRITE_DB_ID, APPWRITE_COLLECTION
]) and (Client is not None and AppwriteDatabases is not None and ID is not None)

databases = None

if appwrite_ready:
    try:
        if Client is not None and AppwriteDatabases is not None:
            client = Client()
            client.set_endpoint(APPWRITE_ENDPOINT)
            client.set_project(APPWRITE_PROJECT_ID)
            client.set_key(APPWRITE_API_KEY)

            databases = AppwriteDatabases(client)
            print("[OK]  Appwrite connected")
        else:
            print("[WARN]  Appwrite imports not available")
            databases = None
    except Exception as e:
        print(f"⚠️  Appwrite init failed: {e}")
        databases = None
else:
    print("ℹ️  Appwrite not configured — running in local-only mode")

# In-memory fallback when Appwrite is not available
local_transactions = []

# ---------------------------------------------------------------------------
# Helper: encode a transaction for the ML model
# ---------------------------------------------------------------------------

def encode_transaction(data):
    """Turn raw form data into a DataFrame the model expects (with feature names)."""
    if not model_loaded or model is None:
        raise Exception("ML model not loaded")
        
    location = data.get("location", "Mumbai")
    device   = data.get("device_type", "Mobile")
    amount   = float(data.get("amount", 0))
    hour     = int(data.get("hour", 12))

    # Handle unseen labels gracefully
    loc_enc = le_location.transform([location])[0] if le_location is not None and location in cities else 0
    dev_enc = le_device.transform([device])[0]   if le_device is not None and device in devices else 0

    return pd.DataFrame([[amount, loc_enc, dev_enc, hour]], columns=feature_names)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/predict_fraud", methods=["POST"])
def predict_fraud():
    """Analyze a single transaction and return prediction + probability."""
    data = request.get_json(force=True)

    # Check if model is loaded
    if not model_loaded or model is None:
        return jsonify({"error": "ML model not available"}), 503

    try:
        features    = encode_transaction(data)
        prediction  = model.predict(features)[0]
        probability = model.predict_proba(features)[0]

        result = {
            "prediction":       "Fraudulent" if prediction == 1 else "Safe",
            "fraud_probability": round(float(probability[1]) * 100, 2),
            "safe_probability":  round(float(probability[0]) * 100, 2),
            "details": {
                "sender_upi":   data.get("sender_upi", ""),
                "receiver_upi": data.get("receiver_upi", ""),
                "amount":       data.get("amount", 0),
                "location":     data.get("location", ""),
                "device_type":  data.get("device_type", ""),
                "hour":         data.get("hour", 12),
            }
        }
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/store_transaction", methods=["POST"])
def store_transaction():
    """Save a transaction record to Appwrite (or local fallback)."""
    data = request.get_json(force=True)

    doc = {
        "sender_upi":   data.get("sender_upi", ""),
        "receiver_upi": data.get("receiver_upi", ""),
        "amount":       float(data.get("amount", 0)),
        "location":     data.get("location", ""),
        "device":       data.get("device_type", ""),
        "prediction":   data.get("prediction", ""),
        "fraud_probability": float(data.get("fraud_probability", 0)),
        "timestamp":    data.get("timestamp", datetime.datetime.now().isoformat()),
    }

    if databases is not None and ID is not None:
        try:
            result = databases.create_document(
                database_id=APPWRITE_DB_ID,
                collection_id=APPWRITE_COLLECTION,
                document_id=ID.unique(),
                data=doc,
            )
            return jsonify({"status": "stored", "id": result["$id"]}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # Local fallback
        doc["id"] = f"LOCAL-{len(local_transactions)+1:05d}"
        local_transactions.append(doc)
        return jsonify({"status": "stored_locally", "id": doc["id"]}), 201


@app.route("/transactions", methods=["GET"])
def get_transactions():
    """Return all stored transactions."""

    if databases is not None:
        try:
            result = databases.list_documents(
                database_id=APPWRITE_DB_ID,
                collection_id=APPWRITE_COLLECTION,
            )
            docs = result.get("documents", [])
            return jsonify({"transactions": docs, "total": len(docs)}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({
            "transactions": local_transactions,
            "total": len(local_transactions),
        }), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "appwrite": appwrite_ready}), 200


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n[START]  UPI Fraud Detection API running on http://127.0.0.1:5000\n")
    # Disable debug mode for production
    app.run(debug=False, port=5000)
