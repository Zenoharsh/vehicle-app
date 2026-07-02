// ===============================
// 5. HOME DASHBOARD MODULE
// ===============================
async function loadDashboard() {
  try {
    const stats = await api("/api/dashboard");
    if (stats) {
      const offRoadEl = document.getElementById("stat-off");
      const repairEl = document.getElementById("stat-repair");
      const alertEl = document.getElementById("stat-alert-count");

      if (offRoadEl) offRoadEl.innerText = stats.off_road;
      if (repairEl) repairEl.innerText = stats.active_repairs;
      if (alertEl) alertEl.innerText = stats.active_repairs;
    }
  } catch (e) {
    console.error("Failed to load stats", e);
  }
  loadSOP();
  loadInstructions();
  loadRepairs();
}

async function loadSOP() {
  const preview = document.getElementById("sop-preview");
  if (!preview) return;
  preview.innerText = "Loading...";
  const data = await api("/api/command-text/SOP");
  preview.innerText =
    data?.content?.trim().length > 0
      ? data.content
      : "No SOP content added yet.";
}

async function loadInstructions() {
  const preview = document.getElementById("instructions-preview");
  if (!preview) return;
  preview.innerText = "Loading...";
  const data = await api("/api/command-text/GENERAL_INSTRUCTIONS");
  preview.innerText =
    data?.content?.trim().length > 0
      ? data.content
      : "No instructions added yet.";
}

async function editCommandText(key, title) {
  currentCommandKey = key;
  document.getElementById("command-text-title").innerText = title;
  const data = await api(`/api/command-text/${key}`);
  document.getElementById("command-text-editor").value = data?.content || "";
  openModal("command-text-modal");
}

async function saveCommandText() {
  const content = document.getElementById("command-text-editor").value;
  await api(`/api/command-text/${currentCommandKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  closeModal("command-text-modal");
  if (currentCommandKey === "SOP") loadSOP();
  if (currentCommandKey === "GENERAL_INSTRUCTIONS") loadInstructions();
}
