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
        <td class="px-6 py-4 text-right">
          <button onclick="editTraining(event, ${t.training_id}, \`${escapeHtml(t.title)}\`, \`${escapeHtml(t.category)}\`, \`${t.conducted_on}\`, \`${escapeHtml(t.remarks || "")}\`)" class="text-army-700 hover:text-black font-bold text-sm mr-3">Edit</button>
          <button onclick="deleteTraining(event, ${t.training_id}, \`${escapeHtml(t.title)}\`)" class="text-red-600 hover:text-red-800 font-bold text-sm">Delete</button>
        </td>
      </tr>
    `;
  });
}

let editingTrainingId = null;

window.openAddTrainingModal = function() {
  editingTrainingId = null;
  const form = document.getElementById("training-form");
  if(form) form.reset();
  const title = document.querySelector('#training-modal h2, #training-modal h3');
  if (title) title.innerText = 'ADD TRAINING EVENT';
  openModal('training-modal');
}

window.editTraining = function(e, id, title, cat, date, remarks) {
  if (e) e.stopPropagation();
  editingTrainingId = id;
  document.getElementById("t-title").value = title;
  document.getElementById("t-category").value = cat;
  document.getElementById("t-date").value = date;
  document.getElementById("t-remarks").value = remarks || "";
  const mTitle = document.querySelector('#training-modal h2, #training-modal h3');
  if (mTitle) mTitle.innerText = 'EDIT TRAINING EVENT';
  openModal('training-modal');
}

async function deleteTraining(e, id, title) {
  if (e) e.stopPropagation();
  if (!confirm(`Delete training event ${title}?`)) return;
  const res = await api('/api/training/' + id, { method: 'DELETE' });
  if (res && res.success) {
    loadTraining();
  } else {
    alert("❌ Error deleting");
  }
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
      const url = editingTrainingId ? `/api/training/${editingTrainingId}` : "/api/training";
      const method = editingTrainingId ? "PUT" : "POST";
      const res = await api(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res && res.success) {
        alert(editingTrainingId ? "✅ Training event updated!" : "✅ Training event recorded!");
        closeModal("training-modal");
        loadTraining();
        e.target.reset();
      } else {
        alert("❌ Error recording training");
      }
    };
  } 
}
