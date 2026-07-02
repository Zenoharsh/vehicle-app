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
        <td class="px-6 py-4 text-right">
          <button onclick="editMod(event, ${m.mod_id}, ${m.vehicle_id}, \`${escapeHtml(m.modification)}\`, \`${escapeHtml(m.authority)}\`, \`${m.date}\`, \`${escapeHtml(m.remarks || "")}\`)" class="text-army-700 hover:text-black font-bold text-sm mr-3">Edit</button>
          <button onclick="deleteMod(event, ${m.mod_id}, \`${escapeHtml(m.modification)}\`)" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
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

let editingModId = null;

window.openAddModModal = function() {
  editingModId = null;
  const form = document.getElementById("mod-form");
  if(form) form.reset();
  const title = document.querySelector('#mod-modal h2, #mod-modal h3');
  if (title) title.innerText = 'ADD MODIFICATION';
  openModal('mod-modal');
}

window.editMod = function(e, id, vehicle_id, modification, authority, date, remarks) {
  if (e) e.stopPropagation();
  editingModId = id;
  document.getElementById("m-vehicle-id").value = vehicle_id;
  document.getElementById("m-title").value = modification;
  document.getElementById("m-auth").value = authority;
  document.getElementById("m-date").value = date;
  document.getElementById("m-remarks").value = remarks || "";
  const mTitle = document.querySelector('#mod-modal h2, #mod-modal h3');
  if (mTitle) mTitle.innerText = 'EDIT MODIFICATION';
  openModal('mod-modal');
}

async function deleteMod(e, id, name) {
  if (e) e.stopPropagation();
  if (!confirm(`Delete modification ${name}?`)) return;
  const res = await api('/api/modifications/' + id, { method: 'DELETE' });
  if (res && res.success) {
    loadModifications();
  } else {
    alert("❌ Error deleting");
  }
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
      const url = editingModId ? `/api/modifications/${editingModId}` : "/api/modifications";
      const method = editingModId ? "PUT" : "POST";
      const res = await api(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res && res.success) {
        alert(editingModId ? "✅ Modification updated!" : "✅ Modification recorded!");
        closeModal("mod-modal");
        loadModifications();
        e.target.reset();
      } else {
        alert("❌ Error saving mod");
      }
    };
  } 
}
