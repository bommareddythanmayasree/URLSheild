async function checkURL(){

    let url = document.getElementById("urlInput").value;
    
    const predictionBadge = document.getElementById("predictionBadge");
    const riskValue = document.getElementById("riskValue");
    const riskFill = document.getElementById("riskFill");
    const resultDetails = document.getElementById("resultDetails");
    const urlDisplay = document.getElementById("urlDisplay");
    const riskLevelLabel = document.getElementById("riskLevelLabel");
    const reasonsList = document.getElementById("reasonsList");
    const gaugeRing = document.getElementById("gaugeRing");

    if (!url.trim()) {
        resultDetails.innerHTML = "Please paste a URL above and click <span class=\"inline-code\">Scan URL</span>.";
        predictionBadge.textContent = "Awaiting scan";
        predictionBadge.className = "badge badge-neutral";
        riskValue.textContent = "0%";
        riskFill.style.width = "0%";
        if (urlDisplay) {
            urlDisplay.textContent = "Paste a URL above to begin analysis.";
        }
        if (riskLevelLabel) {
            riskLevelLabel.textContent = "N/A";
        }
        if (reasonsList) {
            reasonsList.innerHTML = "<li>Reasons will appear here after scanning.</li>";
        }
        if (gaugeRing) {
            gaugeRing.style.background = "conic-gradient(from 220deg, rgba(34,197,94,1) 0deg, rgba(234,179,8,1) 160deg, rgba(239,68,68,1) 320deg, rgba(15,23,42,0.9) 0deg)";
        }
        return;
    }

    predictionBadge.textContent = "Scanning...";
    predictionBadge.className = "badge badge-neutral";
    resultDetails.textContent = "Contacting the detection engine and extracting URL features...";
    if (urlDisplay) {
        urlDisplay.textContent = url;
    }
    if (reasonsList) {
        reasonsList.innerHTML = "<li>Analyzing URL patterns…</li>";
    }

    try{
    
    let response = await fetch("http://127.0.0.1:5000/predict",{
    
    method:"POST",
    
    headers:{
    "Content-Type":"application/json"
    },
    
    body:JSON.stringify({
    url: url
    })
    
    });
    
    let data = await response.json();
    
    const scorePercentNumber = Math.max(0, Math.min((data.risk_score || 0) * 100, 100));
    const scorePercent = scorePercentNumber.toFixed(1);

    riskValue.textContent = scorePercent + "%";
    riskFill.style.width = scorePercentNumber + "%";

    if (gaugeRing) {
        const startDeg = 220;
        const spanDeg = 320; // visible arc
        const filled = (scorePercentNumber / 100) * spanDeg;
        const filledStop = startDeg + filled;
        gaugeRing.style.background =
          `conic-gradient(from ${startDeg}deg, #22c55e 0deg, #eab308 160deg, #ef4444 320deg, rgba(15,23,42,0.9) 0deg),
           conic-gradient(from ${startDeg}deg, rgba(0,0,0,0) 0deg, rgba(0,0,0,0) ${filled}deg, rgba(15,23,42,0.92) ${filled}deg, rgba(15,23,42,0.92) ${spanDeg}deg, rgba(15,23,42,0.92) 360deg)`;
    }

    const predictionLabel = (data.prediction || "").toLowerCase();

    if (predictionLabel === "malicious") {
        predictionBadge.textContent = "Malicious";
        predictionBadge.className = "badge badge-malicious";
        if (riskLevelLabel) {
            riskLevelLabel.textContent = data.risk_level || "Critical";
        }
        resultDetails.innerHTML =
          "<span class=\"result-details-strong\">High caution recommended.</span> This URL shows patterns commonly associated with phishing or credential harvesting. Do not enter passwords or download files from this link.";
    } else if (predictionLabel === "suspicious") {
        predictionBadge.textContent = "Suspicious";
        predictionBadge.className = "badge badge-suspicious";
        if (riskLevelLabel) {
            riskLevelLabel.textContent = data.risk_level || "Medium";
        }
        resultDetails.innerHTML =
          "<span class=\"result-details-strong\">Treat with caution.</span> This URL exhibits several risk factors. Verify the sender and domain carefully before interacting.";
    } else {
        predictionBadge.textContent = "Safe";
        predictionBadge.className = "badge badge-safe";
        if (riskLevelLabel) {
            riskLevelLabel.textContent = data.risk_level || "Low";
        }
        resultDetails.innerHTML =
          "<span class=\"result-details-strong\">No strong malicious signals detected.</span> This doesn’t guarantee safety—always verify the sender, domain, and context before trusting a link.";
    }

    if (reasonsList) {
        const reasons = Array.isArray(data.reasons) ? data.reasons : [];
        reasonsList.innerHTML = reasons.length
          ? reasons.map(r => `<li>${escapeHtml(String(r))}</li>`).join("")
          : "<li>No explanation returned by the API.</li>";
    }
    
    }
    catch(error){
    
    predictionBadge.textContent = "Scan failed";
    predictionBadge.className = "badge badge-malicious";
    riskValue.textContent = "0%";
    riskFill.style.width = "0%";
    if (riskLevelLabel) {
        riskLevelLabel.textContent = "N/A";
    }
    if (reasonsList) {
        reasonsList.innerHTML = "<li>Backend connection failed. Start the API and try again.</li>";
    }
    resultDetails.textContent = "Error connecting to backend. Make sure the API is running on http://127.0.0.1:5000.";
    
    console.error(error);
    
    }
    
    }

function escapeHtml(unsafe) {
    return unsafe
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#039;");
}