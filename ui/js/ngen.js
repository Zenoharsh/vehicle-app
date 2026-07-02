
async function loadNGen() {
  const ngen = await api("/api/ngen");
  const tbody = document.getElementById("ngen-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!ngen || ngen.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No NGE vehicles found.</td></tr>`;
    return;
  }

  ngen.forEach((n, i) => {
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-gray-500 font-mono">${i + 1}</td>
        <td class="px-6 py-4 font-bold text-army-900">${escapeHtml(n.release_date || "")}</td>
        <td class="px-6 py-4">${escapeHtml(n.equipment || "")}</td>
        <td class="px-6 py-4">${escapeHtml(n.oem_details || "")}</td>
        <td class="px-6 py-4">${escapeHtml(n.remarks || "—")}</td>
        <td class="px-6 py-4 text-right">
          <button onclick="editNGen(event, ${n.id}, \`${escapeHtml(n.equipment || "")}\`, \`${escapeHtml(n.release_date || "")}\`, \`${escapeHtml(n.oem_details || "")}\`, \`${escapeHtml(n.remarks || "")}\`)" class="text-army-700 hover:text-black font-bold text-sm mr-3">Edit</button>
          <button onclick="deleteNGen(event, ${n.id}, \`${escapeHtml(n.equipment || "")}\`)" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
      </tr>
    `;
  });
}

let editingNGenId = null;

window.openAddNGenModal = function() {
  editingNGenId = null;
  const form = document.getElementById("ngen-form");
  if(form) form.reset();
  const title = document.querySelector('#ngen-modal h2, #ngen-modal h3');
  if (title) title.innerText = 'ADD NGE VEHICLE';
  openModal('ngen-modal');
}

window.editNGen = function(e, id, eq, date, oem, remarks) {
  if (e) e.stopPropagation();
  editingNGenId = id;
  document.getElementById("n-equipment").value = eq;
  document.getElementById("n-date").value = date;
  document.getElementById("n-oem").value = oem;
  document.getElementById("n-remarks").value = remarks || "";
  const title = document.querySelector('#ngen-modal h2, #ngen-modal h3');
  if (title) title.innerText = 'EDIT NGE VEHICLE';
  openModal('ngen-modal');
}

async function deleteNGen(e, id, eq) {
  if (e) e.stopPropagation();
  if (!confirm(`Delete NGE vehicle ${eq}?`)) return;
  const res = await api('/api/ngen/' + id, { method: 'DELETE' });
  if (res && res.success) {
    loadNGen();
  } else {
    alert("❌ Error deleting");
  }
}

function initNGenForm() {
  const form = document.getElementById("ngen-form");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        equipment: document.getElementById("n-equipment").value,
        release_date: document.getElementById("n-date").value,
        oem_details: document.getElementById("n-oem").value,
        remarks: document.getElementById("n-remarks").value,
      };
      const url = editingNGenId ? `/api/ngen/${editingNGenId}` : "/api/ngen";
      const method = editingNGenId ? "PUT" : "POST";
      const res = await api(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res && res.success) {
        alert(editingNGenId ? "✅ NGE vehicle updated!" : "✅ NGE vehicle added!");
        closeModal("ngen-modal");
        loadNGen();
        e.target.reset();
      } else {
        alert("❌ Error saving NGE");
      }
    };
  }
}