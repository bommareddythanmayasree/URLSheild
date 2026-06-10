/**
 * URLShield — Frontend Logic
 * Handles scan requests, result rendering, feature display, history management.
 */

// ── Config ─────────────────────────────────────────────────────
const API_BASE = "https://urlsheild-api.onrender.com";
const PREDICT_URL = `${API_BASE}/api/v1/predict`;
const HISTORY_KEY = "urlshield_history";
const HISTORY_LIMIT = 10;

// ── Feature display metadata ────────────────────────────────────
const FEATURE_META = {
  URLLength:               { label: "URL Length",        unit: "chars",   maxRef: 200, warnHigh: true },
  DomainLength:            { label: "Domain Length",     unit: "chars",   maxRef: 60,  warnHigh: false },
  TLDLength:               { label: "TLD Length",        unit: "chars",   maxRef: 10,  warnHigh: false },
  NoOfSubDomain:           { label: "Subdomains",        unit: "",        maxRef: 5,   warnHigh: true },
  IsHTTPS:                 { label: "HTTPS",             unit: "",        binary: true, positiveVal: 1 },
  URLEntropy:              { label: "URL Entropy",       unit: "bits",    maxRef: 6,   warnHigh: true },
  DomainEntropy:           { label: "Domain Entropy",    unit: "bits",    maxRef: 5,   warnHigh: true },
  NoOfDegitsInURL:         { label: "Digits in URL",     unit: "",        maxRef: 20,  warnHigh: true },
  DigitRatioInURL:         { label: "Digit Ratio",       unit: "",        maxRef: 0.5, warnHigh: true, isRatio: true },
  NoOfHyphensInURL:        { label: "Hyphens",           unit: "",        maxRef: 8,   warnHigh: true },
  NoOfOtherSpecialCharsInURL:{ label: "Special Chars",  unit: "",        maxRef: 10,  warnHigh: true },
  IsIPAddress:             { label: "IP Address",        unit: "",        binary: true, positiveVal: 0 },
  HasPunycode:             { label: "Punycode",          unit: "",        binary: true, positiveVal: 0 },
  IsSuspiciousTLD:         { label: "Suspicious TLD",    unit: "",        binary: true, positiveVal: 0 },
  SuspiciousKeywordCount:  { label: "Phish Keywords",    unit: "",        maxRef: 5,   warnHigh: true },
  BrandInSubdomain:        { label: "Brand Spoof",       unit: "",        binary: true, positiveVal: 0 },
  HasAtSign:               { label: "@ Sign",            unit: "",        binary: true, positiveVal: 0 },
  HasHexEncoding:          { label: "Hex Encoding",      unit: "",        binary: true, positiveVal: 0 },
  URLDepth:                { label: "URL Depth",         unit: "levels",  maxRef: 8,   warnHigh: false },
  NoOfEqualsInURL:         { label: "= Signs",           unit: "",        maxRef: 6,   warnHigh: false },
  NoOfQMarkInURL:          { label: "Query Marks",       unit: "",        maxRef: 3,   warnHigh: false },
  NoOfAmpersandInURL:      { label: "& Signs",           unit: "",        maxRef: 5,   warnHigh: false },
};

// ── DOM refs ────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const urlInput       = $("urlInput");
const scanBtn        = $("scanBtn");
const resultsArea    = $("resultsArea");
const verdictCard    = $("verdictCard");
const verdictBadge   = $("verdictBadge");
const scannedUrl     = $("scannedUrl");
const riskLevelVal   = $("riskLevelVal");
const confidenceVal  = $("confidenceVal");
const httpsVal       = $("httpsVal");
const verdictSummary = $("verdictSummary");
const gaugePercent   = $("gaugePercent");
const gaugeArc       = $("gaugeArc");
const riskBarFill    = $("riskBarFill");
const explanationsList = $("explanationsList");
const featuresGrid   = $("featuresGrid");
const historyList    = $("historyList");
const resultsAreaEl  = $("resultsArea");

// ── SVG gradient definition ─────────────────────────────────────
(function injectSvgDefs() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  defs.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  defs.innerHTML = `
    <defs>
      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#22c55e"/>
        <stop offset="50%"  stop-color="#facc15"/>
        <stop offset="100%" stop-color="#ef4444"/>
      </linearGradient>
    </defs>`;
  document.body.prepend(defs);
})();

// ── Enter key support ───────────────────────────────────────────
urlInput.addEventListener("keydown", e => {
  if (e.key === "Enter") checkURL();
});

// ── Initial history render ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
  // Show results area if history exists
  const h = loadHistory();
  if (h.length > 0) {
    resultsAreaEl.classList.remove("hidden");
  }
});

// ═══════════════════════════════════════════════════════════════
// MAIN SCAN FUNCTION
// ═══════════════════════════════════════════════════════════════
async function checkURL() {
  const url = urlInput.value.trim();

  if (!url) {
    urlInput.focus();
    urlInput.style.borderColor = "var(--malicious)";
    setTimeout(() => (urlInput.style.borderColor = ""), 1200);
    return;
  }

  // Show results area
  resultsAreaEl.classList.remove("hidden");

  // Loading state
  setScanningState(url);

  try {
    const response = await fetch(PREDICT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${response.status}`);
    }

    const data = await response.json();
    renderResult(url, data);
    addToHistory(url, data);
  } catch (err) {
    renderError(err.message);
    console.error("URLShield scan error:", err);
  }
}

// ═══════════════════════════════════════════════════════════════
// STATE: SCANNING
// ═══════════════════════════════════════════════════════════════
function setScanningState(url) {
  scanBtn.classList.add("loading");
  scanBtn.disabled = true;

  verdictCard.className = "card verdict-card scanning-pulse";
  verdictBadge.textContent = "Scanning…";
  verdictBadge.className = "verdict-badge";

  scannedUrl.textContent = url;
  riskLevelVal.textContent = "—";
  confidenceVal.textContent = "—";
  httpsVal.textContent = "—";
  httpsVal.className = "meta-val";
  verdictSummary.innerHTML = "Extracting URL features and running ML inference…";

  setGauge(0);
  riskBarFill.style.width = "0%";
  gaugePercent.style.color = "";

  explanationsList.innerHTML = `<li class="expl-item">Analysing URL patterns…</li>`;
  featuresGrid.innerHTML = `<div class="feat-placeholder">Extracting features…</div>`;
}

// ═══════════════════════════════════════════════════════════════
// STATE: RESULT
// ═══════════════════════════════════════════════════════════════
function renderResult(url, data) {
  scanBtn.classList.remove("loading");
  scanBtn.disabled = false;

  const pred  = (data.prediction || "safe").toLowerCase();
  const score = Math.max(0, Math.min(data.risk_score || 0, 1));
  const pct   = (score * 100).toFixed(1);

  // ── Verdict card ──
  verdictCard.className = `card verdict-card state-${pred}`;
  verdictBadge.textContent = capitalise(pred);
  verdictBadge.className = `verdict-badge ${pred}`;

  scannedUrl.textContent = url;

  riskLevelVal.textContent = data.risk_level || "—";
  riskLevelVal.className = `meta-val ${pred}`;

  confidenceVal.textContent = `${pct}%`;
  confidenceVal.className = `meta-val ${pred}`;

  const isHttps = data.features && data.features.IsHTTPS === 1;
  httpsVal.textContent = isHttps ? "Yes ✓" : "No ✗";
  httpsVal.className = `meta-val ${isHttps ? "https-yes" : "https-no"}`;

  const summaries = {
    safe: "<strong>No strong malicious signals detected.</strong> The URL structure looks normal. Always verify the sender and context before clicking any link.",
    suspicious: "<strong>Treat with caution.</strong> Multiple risk indicators detected. Verify the domain's legitimacy and avoid entering credentials.",
    malicious: "<strong>High risk — do not visit this URL.</strong> Strong phishing or malware delivery patterns detected. Do not enter personal data or download files.",
  };
  verdictSummary.innerHTML = summaries[pred] || summaries.safe;

  // ── Gauge ──
  setGauge(score * 100);
  gaugePercent.textContent = `${pct}%`;
  gaugePercent.style.color = scoreColor(score);
  riskBarFill.style.width = `${pct}%`;

  // ── Explanations ──
  const reasons = Array.isArray(data.reasons) ? data.reasons :
                  Array.isArray(data.explanations) ? data.explanations : [];
  explanationsList.innerHTML = reasons.length
    ? reasons.map(r => `<li class="expl-item">${escapeHtml(String(r))}</li>`).join("")
    : `<li class="expl-placeholder">No explanation returned.</li>`;

  // ── Features ──
  renderFeatures(data.features || {});
}

// ═══════════════════════════════════════════════════════════════
// STATE: ERROR
// ═══════════════════════════════════════════════════════════════
function renderError(message) {
  scanBtn.classList.remove("loading");
  scanBtn.disabled = false;

  verdictCard.className = "card verdict-card state-malicious";
  verdictBadge.textContent = "Error";
  verdictBadge.className = "verdict-badge malicious";
  verdictSummary.innerHTML = `<strong>Connection failed.</strong> ${escapeHtml(message || "Make sure the backend API is running on http://127.0.0.1:5000.")}`;
  explanationsList.innerHTML = `<li class="expl-item">Backend unreachable — start the API server and try again.</li>`;
  featuresGrid.innerHTML = `<div class="feat-placeholder">—</div>`;
}

// ═══════════════════════════════════════════════════════════════
// GAUGE
// ═══════════════════════════════════════════════════════════════
function setGauge(pct) {
  // Arc path length for a 180-degree semicircle with r=80 = π×80 ≈ 251.2
  const arcLen = 251.2;
  const offset = arcLen - (pct / 100) * arcLen;
  gaugeArc.style.strokeDashoffset = offset;
}

// ═══════════════════════════════════════════════════════════════
// FEATURE ANALYSIS GRID
// ═══════════════════════════════════════════════════════════════
function renderFeatures(features) {
  const entries = Object.entries(FEATURE_META)
    .filter(([key]) => key in features)
    .map(([key, meta]) => ({ key, meta, value: features[key] }));

  if (!entries.length) {
    featuresGrid.innerHTML = `<div class="feat-placeholder">No feature data returned.</div>`;
    return;
  }

  featuresGrid.innerHTML = entries.map(({ key, meta, value }) => {
    const numVal = parseFloat(value) || 0;
    let displayVal = numVal;
    let flagged = false;
    let positive = false;
    let barWidth = 0;

    if (meta.binary) {
      displayVal = numVal === 1 ? "Yes" : "No";
      flagged  = (meta.positiveVal === 0 && numVal === 1) || (meta.positiveVal === 1 && numVal !== 1);
      positive = (meta.positiveVal === 1 && numVal === 1) || (meta.positiveVal === 0 && numVal !== 1);
      barWidth = numVal === 1 ? 100 : 0;
    } else if (meta.isRatio) {
      displayVal = (numVal * 100).toFixed(1) + "%";
      flagged = meta.warnHigh && numVal > (meta.maxRef * 0.6);
      barWidth = Math.min(100, (numVal / meta.maxRef) * 100);
    } else {
      displayVal = Number.isInteger(numVal) ? numVal : numVal.toFixed(3);
      if (meta.unit) displayVal += ` ${meta.unit}`;
      flagged  = meta.warnHigh && numVal > (meta.maxRef * 0.6);
      positive = !meta.warnHigh && numVal > 0;
      barWidth = Math.min(100, (numVal / (meta.maxRef || 1)) * 100);
    }

    const valClass = flagged ? "flagged" : positive ? "positive" : "";

    return `
      <div class="feat-item">
        <div class="feat-name" title="${escapeHtml(key)}">${escapeHtml(meta.label)}</div>
        <div class="feat-value ${valClass}">${escapeHtml(String(displayVal))}</div>
        <div class="feat-bar"><div class="feat-bar-fill" style="width:${barWidth.toFixed(1)}%"></div></div>
      </div>`;
  }).join("");
}

// ═══════════════════════════════════════════════════════════════
// SCAN HISTORY (localStorage)
// ═══════════════════════════════════════════════════════════════
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function addToHistory(url, data) {
  const items = loadHistory();
  // Avoid duplicate consecutive entries
  if (items.length && items[0].url === url) {
    items[0] = buildHistoryItem(url, data);
  } else {
    items.unshift(buildHistoryItem(url, data));
  }
  saveHistory(items.slice(0, HISTORY_LIMIT));
  renderHistory();
}

function buildHistoryItem(url, data) {
  return {
    url,
    prediction: (data.prediction || "safe").toLowerCase(),
    risk_score: data.risk_score || 0,
    ts: Date.now(),
  };
}

function renderHistory() {
  const items = loadHistory();
  if (!items.length) {
    historyList.innerHTML = `<div class="history-placeholder">Your last 10 scans will appear here.</div>`;
    return;
  }
  historyList.innerHTML = items.map((item, i) => {
    const pct = ((item.risk_score || 0) * 100).toFixed(1);
    const age = timeAgo(item.ts);
    return `
      <div class="history-item" role="listitem" tabindex="0"
           aria-label="Scan result: ${escapeHtml(item.url)} — ${capitalise(item.prediction)}"
           onclick="reScanFromHistory(${i})"
           onkeydown="if(event.key==='Enter')reScanFromHistory(${i})">
        <span class="hist-dot ${item.prediction}" aria-hidden="true"></span>
        <span class="hist-url" title="${escapeHtml(item.url)}">${escapeHtml(truncateUrl(item.url, 55))}</span>
        <span class="hist-badge ${item.prediction}">${capitalise(item.prediction)}</span>
        <span class="hist-score" title="${age}">${pct}%</span>
      </div>`;
  }).join("");
}

function reScanFromHistory(index) {
  const items = loadHistory();
  if (items[index]) {
    urlInput.value = items[index].url;
    checkURL();
  }
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateUrl(url, max) {
  return url.length > max ? url.slice(0, max) + "…" : url;
}

function scoreColor(score) {
  if (score >= 0.75) return "#ef4444";
  if (score >= 0.40) return "#facc15";
  return "#22c55e";
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
