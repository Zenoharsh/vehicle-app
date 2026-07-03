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
        <td class="px-6 py-4 text-right">
          <button onclick="editDriver(event, ${d.driver_id}, \`${escapeHtml(d.army_no)}\`, \`${escapeHtml(d.name)}\`, \`${escapeHtml(d.coy)}\`, \`${escapeHtml(d.vehicle_type || "")}\`, \`${d.license_issued || ""}\`, \`${escapeHtml(d.remarks || "")}\`)" class="text-army-700 hover:text-black font-bold text-sm mr-3">Edit</button>
          <button onclick="deleteDriver(event, ${d.driver_id}, \`${escapeHtml(d.name)}\`)" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
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

let editingDriverId = null;

window.openAddDriverModal = function() {
  editingDriverId = null;
  const form = document.getElementById("driver-form");
  if(form) form.reset();
  const title = document.querySelector('#driver-modal h2, #driver-modal h3');
  if (title) title.innerText = 'ADD DRIVER';
  openModal('driver-modal');
}

window.editDriver = function(e, id, army_no, name, coy, type, license, remarks) {
  if (e) e.stopPropagation();
  editingDriverId = id;
  document.getElementById("d-army").value = army_no;
  document.getElementById("d-name").value = name;
  document.getElementById("d-coy").value = coy;
  document.getElementById("d-type").value = type;
  document.getElementById("d-license").value = license || "";
  document.getElementById("d-remarks").value = remarks || "";
  const mTitle = document.querySelector('#driver-modal h2, #driver-modal h3');
  if (mTitle) mTitle.innerText = 'EDIT DRIVER';
  openModal('driver-modal');
}

async function deleteDriver(e, id, name) {
  if (e) e.stopPropagation();
  if (!(await showConfirm())) return;
  const res = await api('/api/drivers/' + id, { method: 'DELETE' });
  if (res && res.success) {
    loadDrivers();
  } else {
    showToast("❌ Error deleting");
  }
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
    const url = editingDriverId ? `/api/drivers/${editingDriverId}` : "/api/drivers";
    const method = editingDriverId ? "PUT" : "POST";
    const res = await api(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.success) {
      showToast(editingDriverId ? "✅ Driver updated!" : "✅ Driver added!");
      closeModal("driver-modal");
      loadDrivers();
      e.target.reset();
    } else {
      showToast("❌ Error saving driver");
    }
  };
} 
}
