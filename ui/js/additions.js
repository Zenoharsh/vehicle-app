async function loadDocuments() {
  const docs = await api("/api/documents");
  const tbody = document.getElementById("document-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!docs || docs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No documents found.</td></tr>`;
    return;
  }

  docs.forEach((d, i) => {
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-gray-500 font-mono">${i + 1}</td>
        <td class="px-6 py-4 font-bold text-army-900">${escapeHtml(d.doc_type)}</td>
        <td class="px-6 py-4">${escapeHtml(d.date)}</td>
        <td class="px-6 py-4">${escapeHtml(d.equipment_name || "—")}</td>
        <td class="px-6 py-4">${escapeHtml(d.remarks || "—")}</td>
        <td class="px-6 py-4 text-right">
          <a href="${API_URL}/api/documents/download/${d.id}" target="_blank" class="text-army-700 hover:text-army-900 font-bold underline text-sm">Download</a>
        </td>
      </tr>
    `;
  });
}

function initDocumentForm() {
  const dForm = document.getElementById("document-form");
  if (dForm) {
    dForm.onsubmit = async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("doc-file");
      if (!fileInput.files || !fileInput.files[0]) return alert("Please select a file.");

      const formData = new FormData();
      formData.append("doc_type", document.getElementById("doc-type").value);
      formData.append("date", document.getElementById("doc-date").value);
      formData.append("equipment_name", document.getElementById("doc-equipment").value);
      formData.append("remarks", document.getElementById("doc-remarks").value);
      formData.append("file", fileInput.files[0]);

      try {
        const res = await fetch(API_URL + "/api/documents", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data && data.success) {
          alert("✅ Document uploaded!");
          closeModal("document-modal");
          loadDocuments();
          e.target.reset();
        } else {
          alert("❌ Error: " + (data.error || "Unknown"));
        }
      } catch (err) {
        alert("❌ Error uploading document.");
      }
    };
  }
}

async function loadLaunchers() {
  const launchers = await api("/api/launchers");
  const tbody = document.getElementById("launcher-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!launchers || launchers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No launchers found.</td></tr>`;
    return;
  }

  launchers.forEach((l, i) => {
    tbody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-gray-500 font-mono">${i + 1}</td>
        <td class="px-6 py-4 font-bold text-army-900">${escapeHtml(l.type)}</td>
        <td class="px-6 py-4">${escapeHtml(l.quantity)}</td>
        <td class="px-6 py-4">${escapeHtml(l.status)}</td>
        <td class="px-6 py-4">${escapeHtml(l.remarks || "—")}</td>
        <td class="px-6 py-4 text-right">
          <button onclick="deleteLauncher(${l.id})" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
      </tr>
    `;
  });
}

function initLauncherForm() {
  const form = document.getElementById("launcher-form");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        type: document.getElementById("launcher-type").value,
        quantity: document.getElementById("launcher-qty").value,
        status: document.getElementById("launcher-status").value,
        remarks: document.getElementById("launcher-remarks").value,
      };
      const res = await api("/api/launchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res && res.success) {
        alert("✅ Launcher added!");
        closeModal("launcher-modal");
        loadLaunchers();
        e.target.reset();
      } else {
        alert("❌ Error adding launcher");
      }
    };
  }
}

async function deleteLauncher(id) {
  if (!confirm("Delete this launcher?")) return;
  const res = await api('/api/launchers/' + id, { method: 'DELETE' });
  if (res && res.success) {
    loadLaunchers();
  } else {
    alert("❌ Error deleting");
  }
}

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
        <td class="px-6 py-4 font-bold text-army-900">${escapeHtml(n.ba_no)}</td>
        <td class="px-6 py-4">${escapeHtml(n.type)}</td>
        <td class="px-6 py-4">${escapeHtml(n.status)}</td>
        <td class="px-6 py-4">${escapeHtml(n.remarks || "—")}</td>
        <td class="px-6 py-4 text-right">
          <button onclick="deleteNGen(${n.id})" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
      </tr>
    `;
  });
}

function initNGenForm() {
  const form = document.getElementById("ngen-form");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        ba_no: document.getElementById("ngen-ba-no").value,
        type: document.getElementById("ngen-type").value,
        status: document.getElementById("ngen-status").value,
        remarks: document.getElementById("ngen-remarks").value,
      };
      const res = await api("/api/ngen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res && res.success) {
        alert("✅ NGE vehicle added!");
        closeModal("ngen-modal");
        loadNGen();
        e.target.reset();
      } else {
        alert("❌ Error adding NGE");
      }
    };
  }
}

async function deleteNGen(id) {
  if (!confirm("Delete this NGE vehicle?")) return;
  const res = await api('/api/ngen/' + id, { method: 'DELETE' });
  if (res && res.success) {
    loadNGen();
  } else {
    alert("❌ Error deleting");
  }
}

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
          <button onclick="alert('Delete functionality coming soon!')" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
      </tr>
    `;
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
        return alert("Please select a valid BA No.");
      }

      const res = await api("/api/ceme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res && res.success) {
        alert("✅ CEME Log added!");
        closeModal("ceme-modal");
        loadCeme();
        e.target.reset();
      } else {
        alert("❌ Error adding CEME Log");
      }
    };
  }
}
