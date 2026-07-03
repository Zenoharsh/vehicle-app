// ===============================
// 7. VEHICLES MODULE
// ===============================
async function loadVehicles() {
  const vehicles = await api("/api/vehicles");
  const tbody = document.getElementById("vehicle-table-body");
  if (!tbody || !vehicles) return;
  tbody.innerHTML = "";

  const types = new Set();
  const classes = new Set();

  vehicles.forEach((v, index) => {
    if (v.vehicle_type) types.add(v.vehicle_type);
    if (v.class) classes.add(v.class);
    
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
        <td class="px-6 py-4">${v.class || "—"}</td>
        <td class="px-6 py-4">${v.coy}</td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 rounded text-xs font-bold ${statusColor}">${(v.status || "ON_ROAD").replace(
      "_",
      " "
    )}</span>
        </td>
        <td class="px-6 py-4 text-right text-gray-600">${
          v.general_remarks || "—"
        }</td>
        <td class="px-6 py-4 text-right">
          <button onclick="editVehicle(event, ${v.vehicle_id}, \`${escapeHtml(v.ba_no)}\`, \`${escapeHtml(v.vehicle_type)}\`, \`${escapeHtml(v.class || "")}\`, \`${escapeHtml(v.coy)}\`, \`${escapeHtml(v.general_remarks || "")}\`)" class="text-army-700 hover:text-black font-bold text-sm mr-3">Edit</button>
          <button onclick="deleteVehicle(event, ${v.vehicle_id}, \`${escapeHtml(v.ba_no)}\`)" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
      </tr>
    `;
  });

  const typeSelect = document.getElementById("filter-type");
  const classSelect = document.getElementById("filter-class");
  if (typeSelect && classSelect) {
    const currType = typeSelect.value;
    const currClass = classSelect.value;
    
    typeSelect.innerHTML = '<option value="">All Types</option>' + Array.from(types).sort().map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
    classSelect.innerHTML = '<option value="">All Classes</option>' + Array.from(classes).sort().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    
    typeSelect.value = currType;
    classSelect.value = currClass;
  }
}

let editingVehicleId = null;

window.openAddVehicleModal = function() {
  editingVehicleId = null;
  const form = document.getElementById("vehicle-form");
  if(form) form.reset();
  const title = document.querySelector('#vehicle-modal h2, #vehicle-modal h3');
  if (title) title.innerText = 'ADD VEHICLE';
  openModal('vehicle-modal');
}

window.editVehicle = function(e, id, ba_no, type, v_class, coy, remarks) {
  if (e) e.stopPropagation();
  editingVehicleId = id;
  document.getElementById("v-ba").value = ba_no;
  document.getElementById("v-type").value = type;
  document.getElementById("v-class").value = v_class || "";
  document.getElementById("v-coy").value = coy;
  document.getElementById("v-remarks").value = remarks || "";
  const mTitle = document.querySelector('#vehicle-modal h2, #vehicle-modal h3');
  if (mTitle) mTitle.innerText = 'EDIT VEHICLE';
  openModal('vehicle-modal');
}

window.filterVehicles = function() {
  const input = document.getElementById("search-vehicle").value.toLowerCase();
  const typeFilter = document.getElementById("filter-type").value.toLowerCase();
  const classFilter = document.getElementById("filter-class").value.toLowerCase();
  const rows = document.querySelectorAll("#vehicle-table-body tr");
  
  rows.forEach(row => {
    // Column 1 is BA, 2 is Type, 3 is Class
    const baText = row.children[1]?.innerText.toLowerCase() || "";
    const typeText = row.children[2]?.innerText.toLowerCase() || "";
    const classText = row.children[3]?.innerText.toLowerCase() || "";
    
    const textMatch = baText.includes(input) || typeText.includes(input) || classText.includes(input);
    const typeMatch = !typeFilter || typeText === typeFilter;
    const classMatch = !classFilter || classText === classFilter;
    
    if (textMatch && typeMatch && classMatch) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

async function deleteVehicle(e, id, ba_no) {
  if (e) e.stopPropagation();
  if (!(await showConfirm())) return;
  const res = await api('/api/vehicles/' + id, { method: 'DELETE' });
  if (res && res.success) {
    loadVehicles();
  } else {
    showToast("❌ Error deleting");
  }
}

function initVehicleForm() {
const vForm = document.getElementById("vehicle-form");
if (vForm) {
  vForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      ba_no: document.getElementById("v-ba").value,
      vehicle_type: document.getElementById("v-type").value,
      class: document.getElementById("v-class").value,
      coy: document.getElementById("v-coy").value,
      general_remarks: document.getElementById("v-remarks").value,
    };
    const url = editingVehicleId ? `/api/vehicles/${editingVehicleId}` : "/api/vehicles";
    const method = editingVehicleId ? "PUT" : "POST";
    try {
      const response = await fetch(API_URL + url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        showToast(editingVehicleId ? "✅ SUCCESS: Vehicle updated!" : "✅ SUCCESS: Vehicle added!");
        closeModal("vehicle-modal");
        loadVehicles();
        e.target.reset();
      } else {
        showToast("❌ SERVER ERROR: " + JSON.stringify(result));
      }
    } catch (err) {
      showToast("❌ NETWORK ERROR: " + err.message);
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
  if (res && res.success) showToast("✅ CME status updated successfully.");
  else showToast("❌ Failed to save CME status.");
}
