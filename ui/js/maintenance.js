// ===============================
// 8. MAINTENANCE ROLL MODULE
// ===============================
async function loadMaintenanceRoll() {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const dateEl = document.getElementById('todays-roll-date');
  if (dateEl) dateEl.innerText = `Today's Roll: ${dateStr}`;

  const vehicles = await api("/api/vehicles");
  const dynCols = await api("/api/dynamic_columns/maintenance") || [];
  
  const thead = document.getElementById("maint-table-head");
  if (thead) {
    let theadHtml = `
      <th class="px-6 py-4 w-16">S.No</th>
      <th class="px-6 py-4">BA Number</th>
      <th class="px-6 py-4">Class</th>
      <th class="px-6 py-4">Coy</th>
    `;
    dynCols.forEach(col => {
      const safeLabel = escapeHtml(col.column_label);
      theadHtml += `<th class="px-6 py-4 text-center custom-col-th select-none" data-col="${safeLabel}">
        ${safeLabel}
      </th>`;
    });
    theadHtml += `<th class="px-6 py-4" id="maint-remarks-th">Remarks / Faults</th>`;
    thead.innerHTML = theadHtml;
  }

  const tbody = document.getElementById("maint-table-body");
  if (!tbody || !vehicles) return;
  tbody.innerHTML = "";

  vehicles.forEach((v, index) => {
    let rowHtml = `
      <tr class="hover:bg-army-100 transition-colors vehicle-row" data-id="${v.vehicle_id}">
        <td class="px-6 py-4 text-gray-500 font-mono">${index + 1}</td>
        <td class="px-6 py-4 font-black text-army-900 text-lg">${v.ba_no}</td>
        <td class="px-6 py-4 text-gray-600 font-bold">${v.class || "—"}</td>
        <td class="px-6 py-4 text-gray-600">${v.coy}</td>
    `;
    
    dynCols.forEach(col => {
      const safeLabel = escapeHtml(col.column_label);
      rowHtml += `<td class="px-6 py-4 text-center bg-gray-50 custom-col-td" data-col="${safeLabel}">
        <input type="checkbox" data-col="${safeLabel}" class="custom-check w-6 h-6 border-2 border-army-900 accent-army-700 cursor-pointer" />
      </td>`;
    });
    
    rowHtml += `
        <td class="px-6 py-2">
          <input type="text" class="maint-remarks w-full p-2 border-2 border-gray-300 focus:border-army-900 outline-none font-mono text-xs bg-white" placeholder="Clear..." />
        </td>
      </tr>
    `;
    tbody.innerHTML += rowHtml;
  });
}

async function saveBulkMaintenance() {
  const rows = document.querySelectorAll("#maint-table-body .vehicle-row");
  const payload = [];

  rows.forEach((row) => {
    const id = row.getAttribute("data-id");
    const remarks = row.querySelector(".maint-remarks").value.trim();

    const customChecks = row.querySelectorAll(".custom-check");
    const custom_data = {};
    let hasCustom = false;
    customChecks.forEach((chk) => {
      if (chk.checked) {
        custom_data[chk.getAttribute("data-col")] = true;
        hasCustom = true;
      }
    });

    if (remarks || hasCustom) {
      payload.push({ vehicle_id: id, daily: false, monthly: false, remarks, custom_data });
    }
  });

  if (payload.length === 0) {
    showToast("⚠️ No checks marked. Roll not committed.");
    return;
  }

  try {
    const res = await api("/api/vehicles/bulk-maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res && res.success) {
      showToast("✅ Roll Committed Successfully!");

      // Clear all checkboxes and remarks after successful save
      rows.forEach((row) => {
        row.querySelector(".maint-remarks").value = "";
        row.querySelectorAll(".custom-check").forEach(c => c.checked = false);
      });
    } else {
      showToast("❌ Error committing roll: " + (res?.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Bulk Maint Error:", err);
    showToast("❌ Error committing roll");
  }
}

let currentPromptCallback = null;

window.closePrompt = function() {
  document.getElementById("custom-prompt-modal").classList.add("hidden");
  document.getElementById("custom-prompt-modal").classList.remove("flex");
  currentPromptCallback = null;
};

window.submitPrompt = function() {
  const input = document.getElementById("prompt-input").value.trim();
  if (!input) {
    showToast("Please enter a valid column name.");
    return;
  }
  const cb = currentPromptCallback;
  closePrompt();
  if (cb) cb(input);
};

window.openManageColumnsModal = function() {
  document.getElementById("manage-columns-input").value = "";
  renderManageColumnsList();
  openModal('manage-columns-modal');
  setTimeout(() => document.getElementById("manage-columns-input").focus(), 100);
};

window.renderManageColumnsList = async function() {
  const ul = document.getElementById("manage-columns-list");
  if (!ul) return;
  ul.innerHTML = `<li class="text-gray-400 italic">Loading...</li>`;
  
  const dynCols = await api("/api/dynamic_columns/maintenance") || [];
  
  if (dynCols.length === 0) {
    ul.innerHTML = `<li class="text-gray-400 italic">No columns exist.</li>`;
    return;
  }
  
  ul.innerHTML = dynCols.map(col => `
    <li class="flex justify-between items-center bg-white p-2 border border-gray-200 shadow-sm">
      <span class="font-bold text-army-900">${escapeHtml(col.column_label)}</span>
      <button onclick="deleteColumn(${col.id}, '${escapeHtml(col.column_label)}')" class="text-red-500 hover:text-red-700 font-bold px-2">
        ✖
      </button>
    </li>
  `).join('');
};

window.addColumnsFromModal = async function() {
  const input = document.getElementById("manage-columns-input").value;
  if (!input) return;

  const colNames = input.split(',').map(s => s.trim()).filter(s => s);
  if (colNames.length === 0) return;

  let hasError = false;
  for (const colName of colNames) {
    const res = await api("/api/dynamic_columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_name: "maintenance", column_label: colName })
    });
    if (!res || !res.success) {
      hasError = true;
    }
  }
  
  if (hasError) {
    showToast("❌ Error adding one or more columns");
  } else {
    document.getElementById("manage-columns-input").value = "";
  }
  
  renderManageColumnsList();
  loadMaintenanceRoll();
};

window.deleteColumn = async function(id, colName) {
  if (!(await showConfirm())) return;
  
  const res = await api(`/api/dynamic_columns/${id}`, { method: 'DELETE' });
  if (res && res.success) {
    loadMaintenanceRoll();
    if (document.getElementById('manage-columns-modal') && !document.getElementById('manage-columns-modal').classList.contains('hidden')) {
      renderManageColumnsList();
    }
  } else {
    showToast("❌ Error deleting column");
  }
};
