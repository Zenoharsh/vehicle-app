
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
        <td class="px-6 py-4 font-bold text-army-900">${escapeHtml(l.name || "")}</td>
        <td class="px-6 py-4">${escapeHtml(l.coy || "")}</td>
        <td class="px-6 py-4">${escapeHtml(l.status || "ACTIVE")}</td>
        <td class="px-6 py-4">${escapeHtml(l.remarks || "—")}</td>
        <td class="px-6 py-4 text-right">
          <button onclick="editLauncher(event, ${l.id}, \`${escapeHtml(l.name || "")}\`, \`${escapeHtml(l.coy || "")}\`, \`${escapeHtml(l.status || "ACTIVE")}\`, \`${escapeHtml(l.remarks || "")}\`)" class="text-army-700 hover:text-black font-bold text-sm mr-3">Edit</button>
          <button onclick="deleteLauncher(event, ${l.id}, \`${escapeHtml(l.name || "")}\`)" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
      </tr>
    `;
  });
}

let editingLauncherId = null;

window.openAddLauncherModal = function() {
  editingLauncherId = null;
  const form = document.getElementById("launcher-form");
  if(form) form.reset();
  const title = document.querySelector('#launcher-modal h2, #launcher-modal h3');
  if (title) title.innerText = 'ADD LAUNCHER';
  openModal('launcher-modal');
}

window.editLauncher = function(e, id, name, coy, status, remarks) {
  if (e) e.stopPropagation();
  editingLauncherId = id;
  document.getElementById("l-name").value = name;
  document.getElementById("l-coy").value = coy;
  document.getElementById("l-status").value = status;
  document.getElementById("l-remarks").value = remarks || "";
  const title = document.querySelector('#launcher-modal h2, #launcher-modal h3');
  if (title) title.innerText = 'EDIT LAUNCHER';
  openModal('launcher-modal');
}

async function deleteLauncher(e, id, name) {
  if (e) e.stopPropagation();
  if (!(await showConfirm())) return;
  const res = await api('/api/launchers/' + id, { method: 'DELETE' });
  if (res && res.success) {
    loadLaunchers();
  } else {
    showToast("❌ Error deleting");
  }
}

function initLauncherForm() {
  const form = document.getElementById("launcher-form");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById("l-name").value,
        coy: document.getElementById("l-coy").value,
        status: document.getElementById("l-status").value,
        remarks: document.getElementById("l-remarks").value,
      };
      const url = editingLauncherId ? `/api/launchers/${editingLauncherId}` : "/api/launchers";
      const method = editingLauncherId ? "PUT" : "POST";
      const res = await api(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res && res.success) {
        showToast(editingLauncherId ? "✅ Launcher updated!" : "✅ Launcher added!");
        closeModal("launcher-modal");
        loadLaunchers();
        e.target.reset();
      } else {
        showToast("❌ Error saving launcher");
      }
    };
  }
}