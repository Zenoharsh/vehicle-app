
// ===============================
// 21. CEME LOGS MODULE
// ===============================
async function loadCeme() {
  const logs = await api("/api/ceme");
  const tbody = document.getElementById("ceme-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-gray-500">No CEME logs found.</td></tr>`;
    return;
  }

  logs.forEach((log, i) => {
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-gray-500 font-mono">${i + 1}</td>
        <td class="px-6 py-4 font-bold text-army-900">${escapeHtml(log.ba_no)}</td>
        <td class="px-6 py-4 font-mono font-bold">${escapeHtml(log.coy)}</td>
        <td class="px-6 py-4 font-mono">${escapeHtml(log.vehicle_type)}</td>
        <td class="px-6 py-4">${escapeHtml(log.date)}</td>
        <td class="px-6 py-4 text-gray-800">${escapeHtml(log.remarks) || "—"}</td>
        <td class="px-6 py-4 text-right">
          <button onclick="deleteCeme(${log.id})" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
      </tr>
    `;
  });
}

window.filterCeme = function() {
  const input = document.getElementById("search-ceme").value.toLowerCase();
  const rows = document.querySelectorAll("#ceme-table-body tr");
  
  rows.forEach(row => {
    // BA Number is in Column 1 (0-indexed: 1)
    const baText = row.children[1]?.innerText.toLowerCase() || "";
    if (baText.includes(input)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

async function populateCemeDropdown() {
  const select = document.getElementById("ceme-ba-no");
  if (!select) return;
  
  const vehicles = await api("/api/vehicles");
  select.innerHTML = '<option value="" disabled selected>Select BA No...</option>';
  
  if (vehicles && vehicles.length > 0) {
    vehicles.forEach(v => {
      select.innerHTML += `<option value="${v.vehicle_id}">${escapeHtml(v.ba_no)} (${escapeHtml(v.coy)} - ${escapeHtml(v.vehicle_type)})</option>`;
    });
  }
}

window.openCemeModal = async function() {
  await populateCemeDropdown();
  openModal('ceme-modal');
}

function initCemeForm() {
  const form = document.getElementById("ceme-form");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        vehicle_id: document.getElementById("ceme-ba-no").value,
        date: document.getElementById("ceme-date").value,
        remarks: document.getElementById("ceme-remarks").value,
      };
      
      if (!data.vehicle_id) {
        return showToast("Please select a valid BA No.");
      }

      const res = await api("/api/ceme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res && res.success) {
        showToast("✅ CEME Log added!");
        closeModal("ceme-modal");
        loadCeme();
        e.target.reset();
      } else {
        showToast("❌ Error adding CEME Log");
      }
    };
  }
}

window.deleteCeme = async function(id) {
  if (!(await showConfirm())) return;
  const res = await api(`/api/ceme/${id}`, { method: "DELETE" });
  if (res && res.success) {
    showToast("✅ CEME Log deleted!");
    loadCeme();
  } else {
    showToast("❌ Error deleting CEME Log");
  }
}