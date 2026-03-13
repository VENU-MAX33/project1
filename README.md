# UPI Fraud Detection System

> AI-powered UPI transaction fraud detection with a modern animated dashboard.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.x-green)
![ML](https://img.shields.io/badge/ML-Random%20Forest-orange)
![Appwrite](https://img.shields.io/badge/Database-Appwrite-red)

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  HTML / CSS / JS  +  GSAP  +  AOS  +  Lottie  +  Chart.js   │
│  ┌─────────────┐    ┌─────────────────┐                      │
│  │ Landing Page │    │ Analytics Dash  │                      │
│  │  - Hero      │    │  - Stats Cards  │                      │
│  │  - Features  │    │  - 4 Charts     │                      │
│  │  - Sim Form  │    │  - Txn Table    │                      │
│  │  - Results   │    │                 │                      │
│  └──────┬───────┘    └──────┬──────────┘                      │
│         │                   │                                │
│         └────────┬──────────┘                                │
│                  │  REST API                                 │
├──────────────────┼───────────────────────────────────────────┤
│                  ▼                                           │
│           FLASK BACKEND                                      │
│  ┌───────────────────────────┐                               │
│  │  POST /predict_fraud      │──▶ ML Model (Random Forest)  │
│  │  POST /store_transaction  │──▶ Appwrite Database          │
│  │  GET  /transactions       │◀── Appwrite Database          │
│  └───────────────────────────┘                               │
│                                                              │
│           ML MODEL                                           │
│  ┌───────────────────────────┐                               │
│  │  Random Forest Classifier │                               │
│  │  - 2000 row dataset       │                               │
│  │  - 4 features             │                               │
│  │  - fraud_model.pkl        │                               │
│  └───────────────────────────┘                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 Folder Structure

```
upi-fraud-detection/
├── frontend/
│   ├── index.html          # Landing page
│   ├── dashboard.html      # Analytics dashboard
│   ├── style.css           # Main styles (glassmorphism, gradients)
│   ├── animations.css      # Keyframe animations
│   ├── script.js           # GSAP, AOS, form handling
│   └── charts.js           # Chart.js dashboard charts
├── backend/
│   ├── app.py              # Flask API server
│   ├── model.py            # ML training script
│   ├── fraud_model.pkl     # Trained model (auto-generated)
│   ├── setup_appwrite.py   # Appwrite bootstrap script
│   └── .env                # Environment variables
├── dataset/
│   └── transactions.csv    # Synthetic dataset (auto-generated)
├── database/
│   └── appwrite_setup.md   # Manual Appwrite setup guide
├── requirements.txt
└── README.md
```

---

## 🚀 Installation & Local Setup

### Prerequisites

- Python 3.10+
- pip

### 1. Clone / Download

```bash
cd "c:\Users\Venu\OneDrive\Desktop\project one"
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Train the ML Model

```bash
cd backend
python model.py
```

This generates `fraud_model.pkl` and `../dataset/transactions.csv`.

### 4. Configure Appwrite (Optional)

Edit `backend/.env` with your Appwrite credentials, then run:

```bash
python setup_appwrite.py
```

> Without Appwrite, the app works in local-only mode (in-memory storage).

### 5. Start the Backend

```bash
python app.py
```

Server runs at **http://127.0.0.1:5000**

### 6. Open the Frontend

Open `frontend/index.html` in your browser (or use Live Server in VS Code).

---

## 🔌 API Routes

| Route                | Method | Description                        |
|----------------------|--------|------------------------------------|
| `/predict_fraud`     | POST   | Analyze transaction, return result |
| `/store_transaction` | POST   | Save transaction to database       |
| `/transactions`      | GET    | Get all stored transactions        |
| `/health`            | GET    | Health check                       |

### Example — Predict Fraud

```bash
curl -X POST http://127.0.0.1:5000/predict_fraud \
  -H "Content-Type: application/json" \
  -d '{"sender_upi":"alice@upi","receiver_upi":"bob@upi","amount":50000,"location":"Mumbai","device_type":"Mobile","hour":3}'
```

Response:
```json
{
  "prediction": "Fraudulent",
  "fraud_probability": 95.2,
  "safe_probability": 4.8,
  "details": { ... }
}
```

---

## 🤖 ML Model Details

| Property      | Value                           |
|---------------|---------------------------------|
| Algorithm     | Random Forest Classifier        |
| Dataset       | 2000 synthetic transactions     |
| Fraud ratio   | ~15%                            |
| Features      | amount, location, device, hour  |
| Train/Test    | 80/20 split                     |
| Class weight  | Balanced                        |

### Fraud Indicators

- **High amount** (₹20,000+)
- **Late night hours** (0–5 AM)
- **Concentrated locations**

---

## 🎨 Animations Used

| Library | Where                     | Effect                           |
|---------|---------------------------|----------------------------------|
| GSAP    | Hero section              | Staggered text & button entrance |
| GSAP    | Section titles            | ScrollTrigger fade-in            |
| AOS     | Feature cards             | Scroll-triggered fade-up         |
| AOS     | Dashboard elements        | Staggered entrance               |
| CSS     | Hero visual (shield)      | Float animation                  |
| CSS     | Buttons                   | Pulse glow + ripple on click     |
| CSS     | Cards                     | Hover lift + shadow transition   |
| CSS     | Table rows                | Hover slide-right                |
| CSS     | Loading spinner           | Continuous rotation               |
| CSS     | Probability bar           | Width transition (1s ease)       |
| SVG     | Shield graphic            | Rotating rings, blinking text    |
| Chart.js| Dashboard                 | Animated chart rendering         |

---

## 🌐 Vercel Deployment (Frontend)

1. Push `frontend/` to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → Import project.
3. Set **Root Directory** to `frontend`.
4. Deploy — done!

> **Backend** must be hosted separately (e.g., Render, Railway, or any Python hosting).
> Update `API_BASE` in `script.js` and `charts.js` to your backend URL.

---

## 📊 Dataset Explanation

The dataset (`dataset/transactions.csv`) is synthetically generated with:

- **2000 rows** (85% safe, 15% fraud)
- Safe transactions: normal amounts (₹10–15,000), business hours, diverse locations
- Fraud transactions: high amounts (₹20,000–100,000), late-night hours, concentrated cities
- Columns: `transaction_id`, `sender_upi`, `receiver_upi`, `amount`, `location`, `device_type`, `hour`, `is_fraud`

---

## 📄 License

This is a university final-year project. Built for educational purposes.
