/* =============================================================================
   FINAL DASHBOARD.JS
   - Includes: Vehicles, Drivers, Mods, Training, Repairs, Maintenance Roll
   - Architecture: Clean Module Hierarchy, Hoisting-Safe
   ============================================================================= */

// ===============================
// 1. GLOBAL STATE
// ===============================
let API_URL = "";
let currentAppConfig = null;
let currentCommandKey = null;

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// ===============================
// 2. ELECTRON BRIDGE / INIT
// ===============================
window.electronAPI.on("APP_CONFIG", async (config) => {
  await loadAllHTMLComponents();
  initForms();
  API_URL = config.apiUrl;
  currentAppConfig = config;

  const connStatus = document.getElementById("conn-status");
  if (connStatus) {
    connStatus.innerText = `SERVER: ${
      config.serverIp
    } | MODE: ${config.mode.toUpperCase()}`;
  }

  initSettingsPage();
    loadDashboard(); // Initial data load
});

async function loadAllHTMLComponents() {
  const pages = ['home', 'settings', 'vehicles', 'drivers', 'modifications', 'training', 'maintenance', 'repairs', 'documents', 'launchers', 'ngen', 'history', 'ceme'];
  const modals = ['vehicle-modal', 'command-text-modal', 'driver-modal', 'mod-modal', 'training-modal', 'repair-modal', 'document-modal', 'launcher-modal', 'ngen-modal', 'ceme-modal', 'manage-columns-modal'];
  const pC = document.getElementById('pages-container');
  const mC = document.getElementById('modals-container');
  if (!pC || !mC) return;
  for (const page of pages) {
    const html = await window.electronAPI.loadHTML('pages/' + page + '.html');
    const div = document.createElement('div');
    div.innerHTML = html;
    if (div.firstElementChild) pC.appendChild(div.firstElementChild);
  }
  for (const modal of modals) {
    const html = await window.electronAPI.loadHTML('modals/' + modal + '.html');
    const div = document.createElement('div');
    div.innerHTML = html;
    if (div.firstElementChild) mC.appendChild(div.firstElementChild);
  }
}

function initForms() {
  initVehicleForm();
  initDriverForm();
  initModForm();
  initTrainingForm();
  initCarousel();
  initRepairForm();
  initDocumentForm();
  initLauncherForm();
  initNGenForm();
  initCemeForm();
}


// ===============================
// 3. CORE API UTILITY
// ===============================
async function api(endpoint, opts) {
  try {
    const res = await fetch(API_URL + endpoint, opts);
    return await res.json();
  } catch (e) {
    console.error("API Error:", e);
    return null;
  }
}

// ===============================
// 4. ROUTING & MODALS (UI CONTROLS)
// ===============================
function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));

  const target = document.getElementById(id + "-page");
  if (target) target.classList.add("active");

  // Trigger module-specific loaders
  if (id === "home") loadDashboard();
  if (id === "vehicles") loadVehicles();
  if (id === "maintenance") loadMaintenanceRoll();
  if (id === "drivers") {
    loadVehicleMeta();
    loadDrivers();
  }
  if (id === "modifications") {
    loadModifications();
    loadVehicleDropdown();
  }
  if (id === "training") loadTraining();
  if (id === "documents") loadDocuments();
  if (id === "launchers") loadLaunchers();
  if (id === "ngen") loadNGen();
  if (id === "ceme") loadCeme();
  if (id === "history") loadHistory();
  if (id === "repairs") {
    loadRepairs();
    loadRepairDropdown();
  }
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    el.classList.add("flex");
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("hidden");
    el.classList.remove("flex");
  }
}
