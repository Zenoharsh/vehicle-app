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

window.showToast = function(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  const bgColor = type === "success" ? "bg-army-700" : type === "error" ? "bg-red-600" : "bg-gray-800";
  toast.className = `px-4 py-3 text-white font-mono font-bold text-sm shadow-hard border-2 border-army-900 ${bgColor} transform transition-all duration-300 translate-y-full opacity-0`;
  toast.innerText = message;
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove("translate-y-full", "opacity-0");
  }, 10);
  
  // Remove after 3s
  setTimeout(() => {
    toast.classList.add("translate-y-full", "opacity-0");
    setTimeout(() => {
      if (container.contains(toast)) container.removeChild(toast);
    }, 300);
  }, 3000);
}

window.showConfirm = function(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]";
    
    const modal = document.createElement("div");
    modal.className = "bg-gray-50 w-full max-w-sm border-4 border-army-900 shadow-hard p-6 font-mono transform scale-95 opacity-0 transition-all duration-200";
    
    modal.innerHTML = `
      <h3 class="text-lg font-bold text-army-900 mb-4 uppercase border-b-2 border-gray-400 pb-2">Confirm Action</h3>
      <p class="text-gray-800 mb-6">${escapeHtml(message)}</p>
      <div class="flex justify-end gap-3 pt-4 border-t-2 border-gray-300">
        <button id="confirm-cancel" class="px-4 py-2 border-2 border-gray-400 uppercase font-bold hover:bg-gray-200 transition-colors">Cancel</button>
        <button id="confirm-ok" class="px-4 py-2 bg-red-600 text-white border-2 border-red-800 uppercase font-bold hover:bg-red-800 transition-colors">Confirm</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Animate in
    requestAnimationFrame(() => {
      modal.classList.remove("scale-95", "opacity-0");
    });
    
    const cleanup = (result) => {
      modal.classList.add("scale-95", "opacity-0");
      setTimeout(() => {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        resolve(result);
      }, 200);
    };
    
    overlay.querySelector("#confirm-cancel").onclick = () => cleanup(false);
    overlay.querySelector("#confirm-ok").onclick = () => cleanup(true);
  });
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
