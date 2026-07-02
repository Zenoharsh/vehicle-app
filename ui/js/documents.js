
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