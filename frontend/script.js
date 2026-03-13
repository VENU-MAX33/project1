/* ============================================================
   UPI Fraud Detection — Main JavaScript
   GSAP animations, AOS init, form handling, API integration
   ============================================================ */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
// Use relative URL for API - will work both locally and when deployed
// If deployed on same domain, relative URL works. If on different domain,
// this should be configured via build env or backend proxy
const API_BASE = ""; // Empty string makes it relative to current origin

// Store last prediction for saving
let lastPrediction = null;

// Track API connection status
let apiAvailable = true;

// ---------------------------------------------------------------------------
// AOS Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  AOS.init({
    duration: 800,
    easing: "ease-out-cubic",
    once: true,
    offset: 80,
  });

  initGSAP();
  initLottie();
  initForm();
  initNavbar();
  
  // Initial API health check
  checkApiHealth();
});

// ---------------------------------------------------------------------------
// GSAP Hero Animations
// ---------------------------------------------------------------------------
function initGSAP() {
  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance
  const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

  heroTl
    .from(".hero-content h1", {
      y: 60,
      opacity: 0,
      duration: 1,
    })
    .from(
      ".hero-content p",
      {
        y: 40,
        opacity: 0,
        duration: 0.8,
      },
      "-=0.5"
    )
    .from(
      ".hero-btns .btn",
      {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
      },
      "-=0.4"
    )
    .from(
      ".hero-visual",
      {
        scale: 0.8,
        opacity: 0,
        duration: 1,
      },
      "-=0.8"
    );

  // Section titles on scroll
  gsap.utils.toArray(".section-title").forEach((el) => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
    });
  });
}

// ---------------------------------------------------------------------------
// Lottie — Hero Shield Animation (inline data, no external file needed)
// ---------------------------------------------------------------------------
function initLottie() {
  const container = document.getElementById("heroLottie");
  if (!container) return;

  // Create an SVG-based animated shield icon since we don't have an external Lottie file
  container.innerHTML = `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;" role="img" aria-label="Security shield animation">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6c5ce7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#00cec9;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Outer ring -->
      <circle cx="200" cy="200" r="150" fill="none" stroke="url(#shieldGrad)" stroke-width="2" opacity="0.3">
        <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="20s" repeatCount="indefinite"/>
      </circle>

      <!-- Dashed ring -->
      <circle cx="200" cy="200" r="130" fill="none" stroke="#6c5ce7" stroke-width="1.5" stroke-dasharray="8 12" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="360 200 200" to="0 200 200" dur="15s" repeatCount="indefinite"/>
      </circle>

      <!-- Shield body -->
      <path d="M200 80 L280 130 L280 220 C280 290 200 330 200 330 C200 330 120 290 120 220 L120 130 Z"
            fill="url(#shieldGrad)" opacity="0.15" filter="url(#glow)">
        <animate attributeName="opacity" values="0.15;0.25;0.15" dur="3s" repeatCount="indefinite"/>
      </path>

      <path d="M200 80 L280 130 L280 220 C280 290 200 330 200 330 C200 330 120 290 120 220 L120 130 Z"
            fill="none" stroke="url(#shieldGrad)" stroke-width="2.5" filter="url(#glow)"/>

      <!-- Check mark -->
      <path d="M165 210 L190 235 L240 175" fill="none" stroke="#00cec9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
        <animate attributeName="stroke-dasharray" values="0 100;100 100" dur="1.5s" begin="0.5s" fill="freeze"/>
        <animate attributeName="stroke-dashoffset" values="100;0" dur="1.5s" begin="0.5s" fill="freeze"/>
      </path>

      <!-- UPI text -->
      <text x="200" y="280" text-anchor="middle" fill="#a29bfe" font-family="Inter, sans-serif" font-size="18" font-weight="700" opacity="0.7">
        UPI PROTECTED
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite"/>
      </text>

      <!-- Orbiting dots -->
      <circle r="4" fill="#00cec9" opacity="0.6">
        <animateMotion dur="8s" repeatCount="indefinite" path="M200,50 A150,150 0 1,1 199,50 Z"/>
      </circle>
      <circle r="3" fill="#6c5ce7" opacity="0.5">
        <animateMotion dur="12s" repeatCount="indefinite" path="M200,70 A130,130 0 1,0 201,70 Z"/>
      </circle>
    </svg>
  `;
}

// ---------------------------------------------------------------------------
// Navbar scroll effect
// ---------------------------------------------------------------------------
function initNavbar() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.style.background = "rgba(10, 10, 26, 0.95)";
    } else {
      navbar.style.background = "rgba(10, 10, 26, 0.75)";
    }
  });
}

// ---------------------------------------------------------------------------
// API Health Check
// ---------------------------------------------------------------------------
async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { timeout: 5000 });
    if (res.ok) {
      const data = await res.json();
      apiAvailable = true;
      // Update UI to show API is available
      const offlineBanner = document.getElementById("offlineBanner");
      if (offlineBanner) {
        offlineBanner.style.display = "none";
      }
    } else {
      throw new Error(`Health check failed: ${res.status}`);
    }
  } catch (err) {
    apiAvailable = false;
    console.warn("API health check failed:", err);
    // Show offline banner
    showOfflineBanner();
  }
}

// ---------------------------------------------------------------------------
// Offline Banner
// ---------------------------------------------------------------------------
function showOfflineBanner() {
  // Remove existing banner if any
  const existingBanner = document.getElementById("offlineBanner");
  if (existingBanner) {
    existingBanner.remove();
  }

  const banner = document.createElement("div");
  banner.id = "offlineBanner";
  banner.className = "offline-banner";
  banner.setAttribute("role", "alert");
  banner.innerHTML = `
    <div class="offline-banner-content">
      <span class="offline-banner-icon">⚠️</span>
      <span class="offline-banner-message">
        Backend server appears to be offline. Some features may not work.
        <a href="#" class="offline-banner-retry" id="offlineRetryLink">Retry connection</a>
      </span>
    </div>
  `;

  document.body.insertBefore(banner, document.body.firstChild);

  // Add retry functionality
  document.getElementById("offlineRetryLink").addEventListener("click", (e) => {
    e.preventDefault();
    checkApiHealth();
  });
}

// ---------------------------------------------------------------------------
// Transaction Form
// ---------------------------------------------------------------------------
function initForm() {
  const form = document.getElementById("transactionForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await analyzTransaction();
  });
}

// ---------------------------------------------------------------------------
// Analyze Transaction
// ---------------------------------------------------------------------------
async function analyzTransaction() {
  // Check API availability first
  if (!apiAvailable) {
    await checkApiHealth();
    if (!apiAvailable) {
      showOfflineBanner();
      return;
    }
  }

  const overlay = document.getElementById("loadingOverlay");
  const resultContainer = document.getElementById("resultContainer");
  const analyzeBtn = document.getElementById("analyzeBtn");

  const data = {
    sender_upi: document.getElementById("senderUpi").value,
    receiver_upi: document.getElementById("receiverUpi").value,
    amount: parseFloat(document.getElementById("amount").value),
    location: document.getElementById("location").value,
    device_type: document.getElementById("deviceType").value,
    hour: parseInt(document.getElementById("txnHour").value),
  };

  // Validate input
  if (!validateTransactionData(data)) {
    return;
  }

  // Show loading
  overlay.classList.add("show");
  resultContainer.classList.remove("show");
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="btn-loading">🔄 Analyzing...</span>';

  try {
    const res = await fetch(`${API_BASE}/predict_fraud`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      timeout: 10000
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const result = await res.json();

    // Simulate brief delay for effect
    await new Promise((r) => setTimeout(r, 800));

    overlay.classList.remove("show");
    displayResult(result);
    lastPrediction = result;
    
    // Reset button
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '🔍 Analyze Transaction';
    
  } catch (err) {
    overlay.classList.remove("show");
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '🔍 Analyze Transaction';
    
    console.error("Transaction analysis failed:", err);
    
    // Check if it's a network error
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      apiAvailable = false;
      showOfflineBanner();
      showErrorMessage("Unable to connect to the server. Please check your connection and try again.");
    } else {
      showErrorMessage("An error occurred while analyzing the transaction. Please try again.");
    }
  }
}

// ---------------------------------------------------------------------------
// Validate Transaction Data
// ---------------------------------------------------------------------------
function validateTransactionData(data) {
  // Clear previous errors
  clearFormErrors();
  
  let isValid = true;
  
  // Validate UPI IDs (basic format)
  const upiPattern = /^[^@\s]+@[^@\s]+$/;
  if (!upiPattern.test(data.sender_upi)) {
    showFormError("senderUpi", "Please enter a valid sender UPI ID (e.g., name@bank)");
    isValid = false;
  }
  
  if (!upiPattern.test(data.receiver_upi)) {
    showFormError("receiverUpi", "Please enter a valid receiver UPI ID (e.g., name@bank)");
    isValid = false;
  }
  
  // Validate amount
  if (isNaN(data.amount) || data.amount <= 0) {
    showFormError("amount", "Please enter a valid amount greater than zero");
    isValid = false;
  }
  
  // Validate location
  if (!data.location) {
    showFormError("location", "Please select a location");
    isValid = false;
  }
  
  // Validate device type
  if (!data.device_type) {
    showFormError("deviceType", "Please select a device type");
    isValid = false;
  }
  
  // Validate hour
  if (isNaN(data.hour) || data.hour < 0 || data.hour > 23) {
    showFormError("txnHour", "Please enter a valid hour (0-23)");
    isValid = false;
  }
  
  return isValid;
}

// ---------------------------------------------------------------------------
// Show Form Error
// ---------------------------------------------------------------------------
function showFormError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const formGroup = field.parentElement;
  
  // Remove existing error if any
  const existingError = formGroup.querySelector(".form-error");
  if (existingError) {
    existingError.remove();
  }
  
  // Add error class to field
  field.classList.add("field-error");
  
  // Create error message
  const errorElement = document.createElement("small");
  errorElement.className = "form-error";
  errorElement.textContent = message;
  errorElement.setAttribute("aria-live", "assertive");
  
  // Insert after field
  formGroup.appendChild(errorElement);
  
  // Focus on field
  field.focus();
}

// ---------------------------------------------------------------------------
// Clear Form Errors
// ---------------------------------------------------------------------------
function clearFormErrors() {
  const formGroups = document.querySelectorAll(".form-group");
  formGroups.forEach(group => {
    const error = group.querySelector(".form-error");
    if (error) {
      error.remove();
    }
    
    const field = group.querySelector("input, select");
    if (field) {
      field.classList.remove("field-error");
    }
  });
}

// ---------------------------------------------------------------------------
// Show Error Message
// ---------------------------------------------------------------------------
function showErrorMessage(message) {
  // Create toast-like error message
  const toast = document.createElement("div");
  toast.className = "error-toast";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.innerHTML = `
    <span class="error-toast-icon">❌</span>
    <span class="error-toast-message">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Remove after timeout
  setTimeout(() => {
    toast.classList.add("error-toast-hide");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

// ---------------------------------------------------------------------------
// Display Result
// ---------------------------------------------------------------------------
function displayResult(result) {
  const container = document.getElementById("resultContainer");
  const icon = document.getElementById("resultIcon");
  const title = document.getElementById("resultTitle");
  const subtitle = document.getElementById("resultSubtitle");
  const fill = document.getElementById("probabilityFill");
  const probText = document.getElementById("probabilityText");
  const details = document.getElementById("resultDetails");
  const saveBtn = document.getElementById("saveBtn");

  const isFraud = result.prediction === "Fraudulent";

  icon.textContent = isFraud ? "🚨" : "✅";
  icon.setAttribute("aria-label", isFraud ? "Fraudulent transaction alert" : "Safe transaction confirmation");
  
  title.textContent = isFraud ? "FRAUDULENT TRANSACTION" : "SAFE TRANSACTION";
  title.className = `result-title ${isFraud ? "fraud" : "safe"}`;
  
  subtitle.textContent = isFraud
    ? "This transaction has been flagged as potentially fraudulent."
    : "This transaction appears to be legitimate.";

  // Probability bar
  const prob = result.fraud_probability;
  fill.style.width = "0%";
  fill.className = `probability-fill ${isFraud ? "fraud" : "safe"}`;
  fill.setAttribute("aria-valuemin", "0");
  fill.setAttribute("aria-valuemax", "100");
  fill.setAttribute("aria-valuenow", prob.toString());
  
  setTimeout(() => {
    fill.style.width = `${prob}%`;
  }, 100);
  
  probText.textContent = `Fraud Probability: ${prob}% | Safe Probability: ${result.safe_probability}%`;

  // Details grid
  const d = result.details;
  details.innerHTML = `
    <div class="result-detail-item">
      <div class="label">Sender</div>
      <div class="value">${d.sender_upi}</div>
    </div>
    <div class="result-detail-item">
      <div class="label">Receiver</div>
      <div class="value">${d.receiver_upi}</div>
    </div>
    <div class="result-detail-item">
      <div class="label">Amount</div>
      <div class="value">₹${Number(d.amount).toLocaleString("en-IN")}</div>
    </div>
    <div class="result-detail-item">
      <div class="label">Location</div>
      <div class="value">${d.location}</div>
    </div>
    <div class="result-detail-item">
      <div class="label">Device</div>
      <div class="value">${d.device_type}</div>
    </div>
    <div class="result-detail-item">
      <div class="label">Hour</div>
      <div class="value">${d.hour}:00</div>
    </div>
  `;

  saveBtn.style.display = "inline-flex";
  container.classList.add("show");

  // Scroll to result
  container.scrollIntoView({ behavior: "smooth", block: "center" });
  
  // Focus on result title for screen readers
  title.setAttribute("tabindex", "-1");
  title.focus();
}

// ---------------------------------------------------------------------------
// Save Transaction
// ---------------------------------------------------------------------------
async function saveTransaction() {
  if (!lastPrediction) {
    showErrorMessage("No transaction to save. Please analyze a transaction first.");
    return;
  }

  // Check API availability
  if (!apiAvailable) {
    await checkApiHealth();
    if (!apiAvailable) {
      showOfflineBanner();
      showErrorMessage("Unable to save transaction. Backend server is offline.");
      return;
    }
  }

  const data = {
    ...lastPrediction.details,
    prediction: lastPrediction.prediction,
    fraud_probability: lastPrediction.fraud_probability,
    timestamp: new Date().toISOString(),
  };

  const saveBtn = document.getElementById("saveBtn");
  
  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-loading">💾 Saving...</span>';

    const res = await fetch(`${API_BASE}/store_transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      timeout: 10000
    });

    if (!res.ok) {
      throw new Error(`Save failed: ${res.status}`);
    }

    const result = await res.json();

    if (result.status) {
      saveBtn.textContent = "✅ Saved!";
      setTimeout(() => {
        saveBtn.textContent = "💾 Save to Database";
        saveBtn.disabled = false;
      }, 3000);
    } else {
      throw new Error("Save operation failed");
    }
  } catch (err) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '💾 Save to Database';
    
    console.error("Save transaction failed:", err);
    
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      apiAvailable = false;
      showOfflineBanner();
      showErrorMessage("Unable to connect to the server. Please check your connection and try again.");
    } else {
      showErrorMessage("Failed to save transaction. Please try again.");
    }
  }
}