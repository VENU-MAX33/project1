/* ============================================================
   UPI Fraud Detection — Dashboard Charts & Data
   Uses Chart.js for visualizations
   ============================================================ */

const API_BASE = ""; // Empty string makes it relative to current origin

// Chart.js global defaults for dark theme
Chart.defaults.color = "#8b8b9e";
Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 80 });
  loadDashboard();
});

// ---------------------------------------------------------------------------
// Load data & render
// ---------------------------------------------------------------------------
async function loadDashboard() {
  let transactions = [];

  try {
    const res = await fetch(`${API_BASE}/transactions`, { timeout: 8000 });
    
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    
    const data = await res.json();
    transactions = data.transactions || [];
    
    // Reset offline state if we successfully connected
    updateConnectionStatus(true);
  } catch (err) {
    console.warn("Backend not available, loading sample data for demo.", err);
    transactions = generateSampleData();
    
    // Update connection status
    updateConnectionStatus(false);
  }

  updateStats(transactions);
  renderFraudSafeChart(transactions);
  renderVolumeChart(transactions);
  renderAmountChart(transactions);
  renderLocationChart(transactions);
  renderTable(transactions);
}

// -------------------------------------------------------------------------//
// Connection Status UI
// -------------------------------------------------------------------------//
function updateConnectionStatus(isOnline) {
  const statusIndicator = document.getElementById("connectionStatus");
  const offlineBanner = document.getElementById("offlineBannerCharts");
  
  if (statusIndicator) {
    statusIndicator.textContent = isOnline ? "● Online" : "● Offline";
    statusIndicator.className = isOnline ? "status-online" : "status-offline";
  }
  
  if (offlineBanner) {
    offlineBanner.style.display = isOnline ? "none" : "block";
  }
}

// -------------------------------------------------------------------------//
// Sample data (for when backend is offline)
// -------------------------------------------------------------------------//
function generateSampleData() {
  const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"];
  const devices = ["Mobile", "Desktop", "Tablet"];
  const data = [];

  for (let i = 0; i < 30; i++) {
    const isFraud = Math.random() < 0.2;
    data.push({
      sender_upi: `user${1000 + i}@upi`,
      receiver_upi: `shop${2000 + i}@upi`,
      amount: isFraud ? Math.floor(Math.random() * 80000 + 20000) : Math.floor(Math.random() * 10000 + 100),
      location: cities[Math.floor(Math.random() * cities.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      prediction: isFraud ? "Fraudulent" : "Safe",
      fraud_probability: isFraud ? (Math.random() * 40 + 60).toFixed(1) : (Math.random() * 20).toFixed(1),
      timestamp: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    });
  }
  return data;
}

// -------------------------------------------------------------------------//
// Stats
// -------------------------------------------------------------------------//
function updateStats(txns) {
  const total = txns.length;
  const fraud = txns.filter((t) => t.prediction === "Fraudulent").length;
  const rate = total > 0 ? ((fraud / total) * 100).toFixed(1) : 0;

  animateCounter("statTotal", total);
  animateCounter("statFraud", fraud);
  document.getElementById("statRate").textContent = `${rate}%`;
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current.toLocaleString();
  }, 30);
}

// -------------------------------------------------------------------------//
// Chart 1 — Fraud vs Safe (Doughnut)
// -------------------------------------------------------------------------//
function renderFraudSafeChart(txns) {
  const safe = txns.filter((t) => t.prediction === "Safe").length;
  const fraud = txns.filter((t) => t.prediction === "Fraudulent").length;

  new Chart(document.getElementById("chartFraudSafe"), {
    type: "doughnut",
    data: {
      labels: ["Safe", "Fraudulent"],
      datasets: [
        {
          data: [safe, fraud],
          backgroundColor: ["#00b894", "#e17055"],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 20, usePointStyle: true, pointStyleWidth: 12 },
        },
      },
      cutout: "65%",
    },
  });
}

// -------------------------------------------------------------------------//
// Chart 2 — Transaction Volume by Hour (Bar)
// -------------------------------------------------------------------------//
function renderVolumeChart(txns) {
  const hourCounts = new Array(24).fill(0);
  txns.forEach((t) => {
    const h = new Date(t.timestamp).getHours();
    if (!isNaN(h)) hourCounts[h]++;
  });

  new Chart(document.getElementById("chartVolume"), {
    type: "bar",
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: "Transactions",
          data: hourCounts,
          backgroundColor: "rgba(108, 92, 231, 0.5)",
          borderColor: "#6c5ce7",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

// -------------------------------------------------------------------------//
// Chart 3 — Amount Distribution (Line)
// -------------------------------------------------------------------------//
function renderAmountChart(txns) {
  const sorted = [...txns].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const labels = sorted.map((t, i) => `#${i + 1}`);
  const amounts = sorted.map((t) => Number(t.amount));
  const colors = sorted.map((t) => (t.prediction === "Fraudulent" ? "#e17055" : "#00b894"));

  new Chart(document.getElementById("chartAmount"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Amount (₹)",
          data: amounts,
          borderColor: "#a29bfe",
          backgroundColor: "rgba(162, 155, 254, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors,
          pointBorderColor: colors,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `₹${ctx.parsed.y.toLocaleString("en-IN")}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });
}

// -------------------------------------------------------------------------//
// Chart 4 — Fraud by Location (Horizontal Bar)
// -------------------------------------------------------------------------//
function renderLocationChart(txns) {
  const fraudByCity = {};
  txns
    .filter((t) => t.prediction === "Fraudulent")
    .forEach((t) => {
      const loc = t.location || "Unknown";
      fraudByCity[loc] = (fraudByCity[loc] || 0) + 1;
    });

  const sorted = Object.entries(fraudByCity).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([city]) => city);
  const data = sorted.map(([, count]) => count);

  new Chart(document.getElementById("chartLocation"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Fraud Cases",
          data,
          backgroundColor: "rgba(225, 112, 85, 0.5)",
          borderColor: "#e17055",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 } },
        y: { grid: { display: false } },
      },
    },
  });
}

// -------------------------------------------------------------------------//
// Transaction History Table
// -------------------------------------------------------------------------//
function renderTable(txns) {
  const tbody = document.getElementById("txnTableBody");
  const emptyState = document.getElementById("emptyState");

  if (txns.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  // Sort newest first
  const sorted = [...txns].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  tbody.innerHTML = sorted
    .map(
      (t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${t.sender_upi || "—"}</td>
      <td>${t.receiver_upi || "—"}</td>
      <td>₹${Number(t.amount).toLocaleString("en-IN")}</td>
      <td>${t.location || "—"}</td>
      <td><span class="badge ${t.prediction === "Fraudulent" ? "fraud" : "safe"}">${t.prediction}</span></td>
      <td>${t.fraud_probability || 0}%</td>
      <td>${t.timestamp ? new Date(t.timestamp).toLocaleDateString("en-IN") : "—"}</td>
    </tr>
  `)
    .join("");
}