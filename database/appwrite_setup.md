# Appwrite Database Setup

This guide explains how to set up Appwrite for the UPI Fraud Detection System.

> **Note:** The project includes an automatic bootstrap script (`backend/setup_appwrite.py`) that creates all collections and attributes for you. You only need to provide your Appwrite credentials.

---

## Step 1 — Create an Appwrite Account

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io) and sign up.
2. Create a new **Project** (e.g., `upi-fraud-detection`).
3. Note down your **Project ID**.

## Step 2 — Create an API Key

1. In your project, go to **Settings → API Keys → Create API Key**.
2. Give it a name like `backend-key`.
3. Grant permissions for **Databases** (read, write, create, delete).
4. Copy the **API Key**.

## Step 3 — Note Your Endpoint

- For Appwrite Cloud: `https://cloud.appwrite.io/v1`
- For self-hosted: your custom endpoint.

## Step 4 — Configure Environment Variables

Create a `.env` file in the `backend/` folder:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DB_ID=fraud_detection_db
APPWRITE_COLLECTION_ID=transactions
```

## Step 5 — Run Bootstrap Script

```bash
cd backend
python setup_appwrite.py
```

This will automatically create:
- A database called `fraud_detection_db`
- A collection called `transactions`
- All required attributes:

| Attribute          | Type   | Size | Required |
|--------------------|--------|------|----------|
| `sender_upi`       | string | 100  | Yes      |
| `receiver_upi`     | string | 100  | Yes      |
| `amount`           | float  | —    | Yes      |
| `location`         | string | 50   | Yes      |
| `device`           | string | 20   | Yes      |
| `prediction`       | string | 20   | Yes      |
| `fraud_probability`| float  | —    | Yes      |
| `timestamp`        | string | 50   | Yes      |

## Step 6 — Done!

Start the backend with `python app.py`. The API will automatically connect to Appwrite.
