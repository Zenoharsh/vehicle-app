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

window.openAddRepairModal = function() {
  const form = document.getElementById("repair-form");
  if(form) form.reset();
  openModal('repair-modal');
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
      showToast("⚠️ Defect reported successfully.");
      closeModal("repair-modal");
      loadRepairs();
      e.target.reset();
    } else {
      showToast("❌ Error reporting defect");
    }
  };
} 
}

async function resolveRepair(id) {
  if (!(await showConfirm())) return;
  const res = await api(`/api/repairs/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remarks: "Rectified by user action" }),
  });
  if (res && res.success) {
    loadRepairs();
  } else {
    showToast("Error resolving repair");
  }
}
