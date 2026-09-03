import { runDiscovery } from "./discovery.js";

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const sample = [
  "New SMB users|interview|Onboarding is confusing and I cannot find the first project setup",
  "New SMB users|support|Our team is stuck during setup and needs an onboarding checklist",
  "Enterprise admins|zendesk|Please add SAML SSO because login management takes too long",
  "Enterprise admins|sales|We need SSO support before the security review",
  "Analysts|app-review|Exporting weekly reports is slow and frustrating",
  "Analysts|survey|Please add scheduled CSV report delivery"
];

function applyTheme(value) { if (value) document.documentElement.dataset.theme = value; else delete document.documentElement.dataset.theme; }
applyTheme(localStorage.getItem("discovery-theme") || "");
$("#theme").addEventListener("click", () => { const current = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light"); const next = current === "dark" ? "light" : "dark"; localStorage.setItem("discovery-theme", next); applyTheme(next); });
$("#sample").addEventListener("click", () => { $("#feedback").value = sample.join("\n"); });
$("#threshold").addEventListener("input", event => { $("#threshold-value").value = event.target.value; });

function render(result) {
  $("#summary").textContent = `${result.model} · local`;
  const evidence = result.opportunities.reduce((sum, item) => sum + item.evidenceCount, 0);
  $("#metrics").innerHTML = `<div class="metric"><b>${result.recordCount}</b><span>evidence records</span></div><div class="metric"><b>${result.opportunityCount}</b><span>opportunities</span></div><div class="metric"><b>${result.opportunities[0]?.score || 0}</b><span>top score</span></div>`;
  $("#opportunities").classList.remove("empty");
  $("#opportunities").innerHTML = result.opportunities.map(opportunity => `<article class="opportunity"><div class="opportunity-head"><div><p class="eyebrow">${opportunity.evidenceCount} EVIDENCE ITEMS</p><h3>${escapeHtml(opportunity.title)}</h3></div><span class="score">${opportunity.score}</span></div><p>${escapeHtml(opportunity.problem)}</p><div class="chips">${opportunity.affectedSegments.map(segment => `<span class="chip">${escapeHtml(segment)}</span>`).join("")}${Object.entries(opportunity.sourceCounts).map(([source,count]) => `<span class="chip">${escapeHtml(source)} · ${count}</span>`).join("")}</div><p class="experiment"><b>Experiment:</b> ${escapeHtml(opportunity.recommendedExperiment)}</p><div class="evidence"><details><summary>Inspect source evidence</summary>${opportunity.evidence.map(item => `<div class="quote">“${escapeHtml(item.text)}”<br><b>${escapeHtml(item.source)}</b> · ${escapeHtml(item.segment)}</div>`).join("")}</details></div></article>`).join("");
}

$("#discover").addEventListener("click", () => {
  try {
    const records = $("#feedback").value.split(/\n+/).map(line => line.trim()).filter(Boolean).map((line,index) => { const [segment="unknown",source="manual",...parts] = line.split("|"); return { id: `browser-${index+1}`, segment, source, text: parts.length ? parts.join("|") : segment, timestamp: new Date().toISOString() }; });
    render(runDiscovery(records, { similarityThreshold: Number($("#threshold").value) }));
  } catch (error) { $("#opportunities").textContent = error.message; }
});
