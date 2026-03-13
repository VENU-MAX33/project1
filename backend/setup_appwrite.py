"""
Appwrite Bootstrap Script
=========================
Creates the database, collection, and attributes automatically.
Reads credentials from .env file or environment variables.

Run:  python setup_appwrite.py
"""

import os
import sys
import time

# Try to load .env file
try:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()
        print("✅  Loaded .env file")
except Exception as e:
    print(f"⚠️  Could not load .env: {e}")

# Read config
ENDPOINT      = os.getenv("APPWRITE_ENDPOINT", "")
PROJECT_ID    = os.getenv("APPWRITE_PROJECT_ID", "")
API_KEY       = os.getenv("APPWRITE_API_KEY", "")
DB_ID         = os.getenv("APPWRITE_DB_ID", "fraud_detection_db")
COLLECTION_ID = os.getenv("APPWRITE_COLLECTION_ID", "transactions")

if not all([ENDPOINT, PROJECT_ID, API_KEY]):
    print("❌  Missing Appwrite credentials!")
    print("    Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY")
    print("    Either in environment variables or in backend/.env")
    sys.exit(1)

# Import Appwrite
try:
    from appwrite.client import Client
    from appwrite.services.databases import Databases
    from appwrite.id import ID
except ImportError:
    print("❌  appwrite package not installed. Run: pip install appwrite")
    sys.exit(1)

# Init client
client = Client()
client.set_endpoint(ENDPOINT)
client.set_project(PROJECT_ID)
client.set_key(API_KEY)

databases = Databases(client)

# ---------------------------------------------------------------------------
# 1. Create Database
# ---------------------------------------------------------------------------
print(f"\n📦  Creating database: {DB_ID}")
try:
    databases.create(database_id=DB_ID, name="UPI Fraud Detection")
    print("    ✅  Database created")
except Exception as e:
    if "already exists" in str(e).lower() or "409" in str(e):
        print("    ℹ️  Database already exists")
    else:
        print(f"    ❌  Error: {e}")

# ---------------------------------------------------------------------------
# 2. Create Collection
# ---------------------------------------------------------------------------
print(f"\n📋  Creating collection: {COLLECTION_ID}")
try:
    databases.create_collection(
        database_id=DB_ID,
        collection_id=COLLECTION_ID,
        name="Transactions",
    )
    print("    ✅  Collection created")
except Exception as e:
    if "already exists" in str(e).lower() or "409" in str(e):
        print("    ℹ️  Collection already exists")
    else:
        print(f"    ❌  Error: {e}")

# ---------------------------------------------------------------------------
# 3. Create Attributes
# ---------------------------------------------------------------------------
attributes = [
    ("string", "sender_upi",        {"size": 100, "required": True}),
    ("string", "receiver_upi",       {"size": 100, "required": True}),
    ("float",  "amount",             {"required": True, "min": 0, "max": 10000000}),
    ("string", "location",           {"size": 50,  "required": True}),
    ("string", "device",             {"size": 20,  "required": True}),
    ("string", "prediction",         {"size": 20,  "required": True}),
    ("float",  "fraud_probability",  {"required": True, "min": 0, "max": 100}),
    ("string", "timestamp",          {"size": 50,  "required": True}),
]

print("\n🔧  Creating attributes:")
for attr_type, key, opts in attributes:
    try:
        if attr_type == "string":
            databases.create_string_attribute(
                database_id=DB_ID,
                collection_id=COLLECTION_ID,
                key=key,
                size=opts["size"],
                required=opts["required"],
            )
        elif attr_type == "float":
            databases.create_float_attribute(
                database_id=DB_ID,
                collection_id=COLLECTION_ID,
                key=key,
                required=opts["required"],
                min=opts.get("min"),
                max=opts.get("max"),
            )
        print(f"    ✅  {key} ({attr_type})")
    except Exception as e:
        if "already exists" in str(e).lower() or "409" in str(e):
            print(f"    ℹ️  {key} already exists")
        else:
            print(f"    ❌  {key}: {e}")

    time.sleep(0.5)  # Small delay between attribute creations

print("\n🎉  Appwrite setup complete!")
print(f"    Database:   {DB_ID}")
print(f"    Collection: {COLLECTION_ID}")
print("\n    Now start the backend: python app.py\n")
