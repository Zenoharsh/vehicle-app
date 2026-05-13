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
  const pages = ['home', 'settings', 'vehicles', 'drivers', 'modifications', 'training', 'maintenance', 'repairs'];
  const modals = ['vehicle-modal', 'command-text-modal', 'driver-modal', 'mod-modal', 'training-modal', 'repair-modal'];
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
  initRepairForm();
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

// ===============================
// 6. NETWORK SETTINGS MODULE
// ===============================
function initSettingsPage() {
  if (!currentAppConfig) return;
  const modeEl = document.getElementById("config-mode");
  const ipEl = document.getElementById("config-ip");

  if (modeEl) modeEl.value = currentAppConfig.mode;
  if (ipEl)
    ipEl.value =
      currentAppConfig.serverIp === "localhost"
        ? ""
        : currentAppConfig.serverIp;
  toggleIPField();
}

function toggleIPField() {
  const mode = document.getElementById("config-mode")?.value;
  const ipInput = document.getElementById("config-ip");
  if (!ipInput) return;

  if (mode === "server") {
    ipInput.value = "localhost";
    ipInput.disabled = true;
    ipInput.classList.add("opacity-50", "bg-gray-200");
  } else {
    ipInput.disabled = false;
    ipInput.classList.remove("opacity-50", "bg-gray-200");
    if (ipInput.value === "localhost") ipInput.value = "";
  }
}

function saveSettings() {
  const mode = document.getElementById("config-mode").value;
  const serverIp =
    document.getElementById("config-ip").value.trim() || "localhost";
  if (mode === "client" && (!serverIp || serverIp === "localhost")) {
    alert(
      "⚠️ ERROR: Please enter a valid Target Server IP address for Client mode."
    );
    return;
  }
  const newConfig = { mode, serverIp };
  if (window.electronAPI.saveConfig) {
    window.electronAPI.saveConfig(newConfig);
  } else {
    console.error("electronAPI.saveConfig not found in preload.js");
  }
}

// ===============================
// 7. VEHICLES MODULE
// ===============================
async function loadVehicles() {
  const vehicles = await api("/api/vehicles");
  const tbody = document.getElementById("vehicle-table-body");
  if (!tbody || !vehicles) return;
  tbody.innerHTML = "";

  vehicles.forEach((v, index) => {
    const statusColor =
      v.status === "ON_ROAD"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50 cursor-pointer" onclick="openVehicleDetail(${
        v.vehicle_id
      })">
        <td class="px-6 py-4 font-mono text-gray-500">${index + 1}</td>
        <td class="px-6 py-4 font-mono font-bold text-army-900">${v.ba_no}</td>
        <td class="px-6 py-4 font-bold">${v.vehicle_type}</td>
        <td class="px-6 py-4">${v.coy}</td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 rounded text-xs font-bold ${statusColor}">${v.status.replace(
      "_",
      " "
    )}</span>
        </td>
        <td class="px-6 py-4 text-right text-gray-600">${
          v.general_remarks || "—"
        }</td>
      </tr>
    `;
  });
}

function initVehicleForm() {
const vForm = document.getElementById("vehicle-form");
if (vForm) {
  vForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      ba_no: document.getElementById("v-ba").value,
      vehicle_type: document.getElementById("v-type").value,
      coy: document.getElementById("v-coy").value,
      general_remarks: document.getElementById("v-remarks").value,
    };
    try {
      const response = await fetch(API_URL + "/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        alert("✅ SUCCESS: Vehicle added!");
        closeModal("vehicle-modal");
        loadVehicles();
        e.target.reset();
      } else {
        alert("❌ SERVER ERROR: " + JSON.stringify(result));
      }
    } catch (err) {
      alert("❌ NETWORK ERROR: " + err.message);
    }
  };
} 
}

// --- VEHICLE DETAIL ---
async function openVehicleDetail(vehicleId) {
  const data = await api(`/api/vehicles/${vehicleId}`);
  if (!data) return;
  const { vehicle, repairs, modifications } = data;

  document.getElementById("vd-ba").innerText = vehicle.ba_no;
  document.getElementById("vd-type").innerText = vehicle.vehicle_type;
  document.getElementById("vd-coy").innerText = vehicle.coy;
  document.getElementById("vd-remarks").innerText =
    vehicle.general_remarks || "—";

  const badge = document.getElementById("vd-status-badge");
  badge.innerText = vehicle.status.replace("_", " ");
  badge.className = `px-2 py-1 rounded text-xs font-bold ${
    vehicle.status === "ON_ROAD"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800"
  }`;

  const repairsContainer = document.getElementById("vd-repairs-list");
  if (repairs && repairs.length > 0) {
    repairsContainer.innerHTML = repairs
      .map(
        (r) => `
      <div class="bg-white p-3 rounded border border-gray-200 shadow-sm">
        <div class="flex justify-between items-start">
          <span class="font-bold text-red-700">${r.defect}</span>
          <span class="text-xs font-mono text-gray-500">${r.reported_on}</span>
        </div>
        <div class="text-xs mt-1 text-gray-600">Status: <span class="font-bold">${
          r.status
        }</span></div>
        ${
          r.remarks
            ? `<div class="text-xs mt-1 italic text-gray-500">"${r.remarks}"</div>`
            : ""
        }
      </div>
    `
      )
      .join("");
  } else {
    repairsContainer.innerHTML = `<p class="text-gray-400 italic text-center py-4">No repair history found.</p>`;
  }

  const modsContainer = document.getElementById("vd-mods-list");
  if (modifications && modifications.length > 0) {
    modsContainer.innerHTML = modifications
      .map(
        (m) => `
      <div class="bg-white p-3 rounded border border-gray-200 shadow-sm">
        <div class="flex justify-between items-start">
          <span class="font-bold text-blue-700">${m.modification}</span>
          <span class="text-xs font-mono text-gray-500">${m.date}</span>
        </div>
        <div class="text-xs mt-1 text-gray-600">Auth: ${m.authority}</div>
      </div>
    `
      )
      .join("");
  } else {
    modsContainer.innerHTML = `<p class="text-gray-400 italic text-center py-4">No modifications found.</p>`;
  }

  renderVehicleChecks(data);
  document.getElementById("vehicle-detail").classList.remove("hidden");
  document
    .querySelector("#vehicles-page table")
    .parentElement.classList.add("hidden");
}

function closeVehicleDetail() {
  document.getElementById("vehicle-detail").classList.add("hidden");
  document
    .querySelector("#vehicles-page table")
    .parentElement.classList.remove("hidden");
}

function renderVehicleChecks(data) {
  const c = data.checks || {};
  const container = document.getElementById("cme-section");
  if (!container) return;

  container.innerHTML = `
    <h4 class="text-lg font-bold text-gray-800 mb-4 uppercase border-b pb-2">CME / Technical Checks</h4>
    <div class="grid grid-cols-2 gap-4 mb-4 text-sm mt-4">
      ${renderCheck("field_firing", "Field Firing", c.field_firing)}
      ${renderCheck("pre_floatation", "Pre-Floatation", c.pre_floatation)}
      ${renderCheck("floatation", "Floatation", c.floatation)}
      ${renderCheck("preventive", "Preventive Maintenance", c.preventive)}
      ${renderCheck("predictive", "Predictive Maintenance", c.predictive)}
    </div>
    <div class="mb-4">
      <label class="text-sm font-bold text-gray-700">Maintenance Remarks</label>
      <textarea id="cme-remarks" class="w-full mt-1 p-2 border rounded bg-gray-50" rows="3">${
        c.remarks || ""
      }</textarea>
    </div>
    <div class="flex justify-end gap-3">
      <button onclick="saveVehicleChecks(${
        data.vehicle.vehicle_id
      })" class="px-4 py-2 bg-army-700 text-white font-bold rounded hover:bg-army-900">Save CME Status</button>
    </div>
  `;
}

function renderCheck(id, label, value) {
  return `
    <label class="flex items-center gap-3 bg-gray-50 p-3 rounded border hover:bg-white transition-colors cursor-pointer">
      <input type="checkbox" id="${id}" ${
    value ? "checked" : ""
  } class="h-4 w-4 text-army-700 rounded"/>
      <span class="font-medium text-gray-800">${label}</span>
    </label>
  `;
}

async function saveVehicleChecks(vehicleId) {
  const payload = {
    field_firing: document.getElementById("field_firing").checked ? 1 : 0,
    pre_floatation: document.getElementById("pre_floatation").checked ? 1 : 0,
    floatation: document.getElementById("floatation").checked ? 1 : 0,
    preventive: document.getElementById("preventive").checked ? 1 : 0,
    predictive: document.getElementById("predictive").checked ? 1 : 0,
    remarks: document.getElementById("cme-remarks").value,
  };
  const res = await api(`/api/vehicles/${vehicleId}/checks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res && res.success) alert("✅ CME status updated successfully.");
  else alert("❌ Failed to save CME status.");
}

// ===============================
// 8. MAINTENANCE ROLL MODULE
// ===============================
async function loadMaintenanceRoll() {
  const vehicles = await api("/api/vehicles");
  const tbody = document.getElementById("maint-table-body");
  if (!tbody || !vehicles) return;
  tbody.innerHTML = "";

  vehicles.forEach((v, index) => {
    tbody.innerHTML += `
      <tr class="hover:bg-army-100 transition-colors vehicle-row" data-id="${
        v.vehicle_id
      }">
        <td class="px-6 py-4 text-gray-500 font-mono">${index + 1}</td>
        <td class="px-6 py-4 font-black text-army-900 text-lg">${v.ba_no}</td>
        <td class="px-6 py-4 text-gray-600">${v.coy}</td>
        <td class="px-6 py-4 text-center border-l-2 border-gray-300 bg-gray-50">
          <input type="checkbox" class="daily-check w-6 h-6 border-2 border-army-900 accent-army-700 cursor-pointer" />
        </td>
        <td class="px-6 py-4 text-center bg-gray-50">
          <input type="checkbox" class="monthly-check w-6 h-6 border-2 border-army-900 accent-army-700 cursor-pointer" />
        </td>
        <td class="px-6 py-2">
          <input type="text" class="maint-remarks w-full p-2 border-2 border-gray-300 focus:border-army-900 outline-none font-mono text-xs bg-white" placeholder="Clear..." />
        </td>
      </tr>
    `;
  });
}

async function saveBulkMaintenance() {
  const rows = document.querySelectorAll("#maint-table-body .vehicle-row");
  const payload = [];

  rows.forEach((row) => {
    const id = row.getAttribute("data-id");
    const daily = row.querySelector(".daily-check").checked;
    const monthly = row.querySelector(".monthly-check").checked;
    const remarks = row.querySelector(".maint-remarks").value.trim();

    if (daily || monthly || remarks) {
      payload.push({ vehicle_id: id, daily, monthly, remarks });
    }
  });

  if (payload.length === 0) {
    alert("⚠️ No checks marked. Roll not committed.");
    return;
  }

  try {
    const res = await api("/api/vehicles/bulk-maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res && res.success) {
      alert(`✅ Roll Committed! Processed ${res.processed} vehicles.`);

      // Clear all checkboxes and remarks after successful save
      rows.forEach((row) => {
        row.querySelector(".daily-check").checked = false;
        row.querySelector(".monthly-check").checked = false;
        row.querySelector(".maint-remarks").value = "";
      });
    } else {
      alert("❌ Error committing roll: " + (res?.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Bulk Save Error:", err);
    alert("❌ Network Error while committing roll.");
  }
}
// ===============================
// 9. DRIVERS MODULE
// ===============================
async function loadDrivers() {
  const coy = document.getElementById("filter-coy")?.value || "";
  const type = document.getElementById("filter-type")?.value || "";
  let url = "/api/drivers";
  const params = [];
  if (coy) params.push(`coy=${encodeURIComponent(coy)}`);
  if (type) params.push(`vehicle_type=${encodeURIComponent(type)}`);
  if (params.length) url += "?" + params.join("&");

  const drivers = await api(url);
  const tbody = document.getElementById("driver-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!drivers || drivers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No drivers found.</td></tr>`;
    return;
  }

  drivers.forEach((d, i) => {
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-gray-500 font-mono">${i + 1}</td>
        <td class="px-6 py-4 font-mono font-bold text-army-900">${
          d.army_no
        }</td>
        <td class="px-6 py-4 font-bold">${d.name}</td>
        <td class="px-6 py-4">${d.coy}</td>
        <td class="px-6 py-4">${d.vehicle_type || "—"}</td>
        <td class="px-6 py-4 text-gray-500 text-sm">${d.remarks || "—"}</td>
      </tr>
    `;
  });
}

async function loadVehicleMeta() {
  const meta = await api("/api/vehicles/meta/distinct");
  if (!meta) return;

  ["d-coy", "filter-coy"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const first = el.firstElementChild;
    el.innerHTML = "";
    el.appendChild(first);
    meta.coys.forEach(
      (c) => (el.innerHTML += `<option value="${c}">${c}</option>`)
    );
  });

  ["d-type", "filter-type"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const first = el.firstElementChild;
    el.innerHTML = "";
    el.appendChild(first);
    meta.vehicle_types.forEach(
      (t) => (el.innerHTML += `<option value="${t}">${t}</option>`)
    );
  });
}

function initDriverForm() {
const dForm = document.getElementById("driver-form");
if (dForm) {
  dForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      army_no: document.getElementById("d-army").value,
      name: document.getElementById("d-name").value,
      coy: document.getElementById("d-coy").value,
      vehicle_type: document.getElementById("d-type").value,
      license_issued: document.getElementById("d-license").value,
      remarks: document.getElementById("d-remarks").value,
    };
    const res = await api("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.success) {
      alert("✅ Driver added!");
      closeModal("driver-modal");
      loadDrivers();
      e.target.reset();
    } else {
      alert("❌ Error adding driver");
    }
  };
} 
}

// ===============================
// 10. MODIFICATIONS MODULE
// ===============================
async function loadModifications() {
  const mods = await api("/api/modifications");
  const tbody = document.getElementById("mod-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!mods || mods.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No modifications recorded.</td></tr>`;
    return;
  }

  mods.forEach((m, i) => {
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-gray-500 font-mono">${i + 1}</td>
        <td class="px-6 py-4 font-mono font-bold text-army-900">${m.ba_no}</td>
        <td class="px-6 py-4 font-bold">${m.modification}</td>
        <td class="px-6 py-4">${m.authority}</td>
        <td class="px-6 py-4 font-mono">${m.date}</td>
        <td class="px-6 py-4 text-gray-600 text-sm">${m.remarks || "—"}</td>
      </tr>
    `;
  });
}

async function loadVehicleDropdown() {
  const vehicles = await api("/api/vehicles");
  const select = document.getElementById("m-vehicle-id");
  if (!select || !vehicles) return;
  select.innerHTML = `<option value="">Select Vehicle (BA No)</option>`;
  vehicles.forEach((v) => {
    select.innerHTML += `<option value="${v.vehicle_id}">${v.ba_no} (${v.vehicle_type})</option>`;
  });
}

function initModForm() {
const mForm = document.getElementById("mod-form");
if (mForm) {
  mForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      vehicle_id: document.getElementById("m-vehicle-id").value,
      modification: document.getElementById("m-title").value,
      authority: document.getElementById("m-auth").value,
      date: document.getElementById("m-date").value,
      remarks: document.getElementById("m-remarks").value,
    };
    const res = await api("/api/modifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.success) {
      alert("✅ Modification recorded!");
      closeModal("mod-modal");
      loadModifications();
      e.target.reset();
    } else {
      alert("❌ Error recording mod");
    }
  };
} 
}

// ===============================
// 11. TRAINING MODULE
// ===============================
async function loadTraining() {
  const events = await api("/api/training");
  const tbody = document.getElementById("training-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!events || events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">No training events recorded.</td></tr>`;
    return;
  }

  events.forEach((t, i) => {
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-gray-500 font-mono">${i + 1}</td>
        <td class="px-6 py-4 font-bold text-army-900">${t.title}</td>
        <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">${
          t.category
        }</span></td>
        <td class="px-6 py-4 font-mono">${t.conducted_on}</td>
        <td class="px-6 py-4 text-gray-600 text-sm">${t.remarks || "—"}</td>
      </tr>
    `;
  });
}

function initTrainingForm() {
const tForm = document.getElementById("training-form");
if (tForm) {
  tForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById("t-title").value,
      category: document.getElementById("t-category").value,
      conducted_on: document.getElementById("t-date").value,
      remarks: document.getElementById("t-remarks").value,
    };
    const res = await api("/api/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.success) {
      alert("✅ Training event recorded!");
      closeModal("training-modal");
      loadTraining();
      e.target.reset();
    } else {
      alert("❌ Error recording training");
    }
  };
} 
}

// ===============================
// 12. REPAIRS MODULE
// ===============================
async function loadRepairs() {
  const repairs = await api("/api/repairs/active");
  const tbody = document.getElementById("repair-table-body");

  // Dashboard updates
  const count = repairs ? repairs.length : 0;
  const alertCount = document.getElementById("stat-alert-count");
  const heroStat = document.getElementById("stat-repair");
  if (alertCount) alertCount.innerText = count;
  if (heroStat) heroStat.innerText = count;

  if (!tbody) return;
  tbody.innerHTML = "";

  if (!repairs || repairs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No active defects reported. Unit is combat ready.</td></tr>`;
    return;
  }

  repairs.forEach((r, i) => {
    tbody.innerHTML += `
      <tr class="hover:bg-red-50">
        <td class="px-6 py-4 text-gray-500 font-mono">${i + 1}</td>
        <td class="px-6 py-4 font-mono font-bold text-gray-900">${
          r.ba_no
        } <span class="text-xs text-gray-500">(${r.vehicle_type})</span></td>
        <td class="px-6 py-4 font-bold text-red-700">${r.defect}</td>
        <td class="px-6 py-4 font-mono">${r.reported_on}</td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 rounded text-xs font-bold ${
            r.status === "IN_PROGRESS"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }">
            ${r.status.replace("_", " ")}
          </span>
        </td>
        <td class="px-6 py-4 text-right">
           <button onclick="resolveRepair(${
             r.repair_id
           })" class="text-green-600 font-bold hover:underline text-xs uppercase border border-green-600 px-2 py-1 rounded hover:bg-green-50">
             ✓ Rectify
           </button>
        </td>
      </tr>
    `;
  });
}

async function loadRepairDropdown() {
  const vehicles = await api("/api/vehicles");
  const select = document.getElementById("r-vehicle-id");
  if (!select || !vehicles) return;
  select.innerHTML = `<option value="">Select Vehicle (BA No)</option>`;
  vehicles.forEach((v) => {
    select.innerHTML += `<option value="${v.vehicle_id}">${v.ba_no} (${v.vehicle_type})</option>`;
  });
}

function initRepairForm() {
const rForm = document.getElementById("repair-form");
if (rForm) {
  rForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      vehicle_id: document.getElementById("r-vehicle-id").value,
      defect: document.getElementById("r-defect").value,
      status: document.getElementById("r-status").value,
      reported_on: document.getElementById("r-date").value,
      remarks: document.getElementById("r-remarks").value,
    };
    const res = await api("/api/repairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.success) {
      alert("⚠️ Defect reported successfully.");
      closeModal("repair-modal");
      loadRepairs();
      e.target.reset();
    } else {
      alert("❌ Error reporting defect");
    }
  };
} 
}

async function resolveRepair(id) {
  if (!confirm("Confirm that this defect has been rectified?")) return;
  const res = await api(`/api/repairs/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remarks: "Rectified by user action" }),
  });
  if (res && res.success) {
    loadRepairs();
  } else {
    alert("Error resolving repair");
  }
}
