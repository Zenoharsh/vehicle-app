// ===============================
// HISTORY MODULE
// ===============================
async function loadHistory() {
  const dates = await api('/api/vehicles/history/dates');
  const list = document.getElementById('history-dates-list');
  if (!list) return;
  list.innerHTML = '';
  if (!dates || dates.length === 0) {
    list.innerHTML = `<div class="p-4 text-gray-500 italic text-sm">No past rolls found.</div>`;
    return;
  }
  dates.forEach(date => {
    list.innerHTML += `<button onclick="viewHistoryDetail('${date}')" class="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 font-mono font-bold text-gray-700 transition-colors">${date}</button>`;
  });
}

async function viewHistoryDetail(date) {
  document.getElementById('history-detail-title').innerText = 'Roll for ' + date;
  const records = await api(`/api/vehicles/history/${date}`);
  const tbody = document.getElementById('history-detail-body');
  document.getElementById('history-detail-count').innerText = (records ? records.length : 0) + ' records';
  
  if (!records || records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-gray-500 italic">No data for this date.</td></tr>`;
    return;
  }

  // Generate dynamic header based on all records' custom_data keys
  let allKeys = new Set();
  records.forEach(r => {
    try {
      const cData = JSON.parse(r.custom_data);
      Object.keys(cData).forEach(k => allKeys.add(k));
    } catch(e){}
  });
  const keys = Array.from(allKeys);
  
  const thead = document.getElementById('history-detail-head');
  if (thead) {
    let headHTML = `
      <th class="px-6 py-3 w-16 border-b-2 border-army-200">S.No</th>
      <th class="px-6 py-3 border-b-2 border-army-200">BA Number</th>
      <th class="px-6 py-3 border-b-2 border-army-200">Class</th>
      <th class="px-6 py-3 border-b-2 border-army-200">Coy</th>
    `;
    keys.forEach(k => {
      headHTML += `<th class="px-6 py-3 border-b-2 border-army-200 text-center">${escapeHtml(k)}</th>`;
    });
    headHTML += `<th class="px-6 py-3 border-b-2 border-army-200">Remarks</th>`;
    thead.innerHTML = headHTML;
  }

  if (tbody) {
    tbody.innerHTML = '';
    records.forEach((r, i) => {
      let cData = {};
      try { cData = JSON.parse(r.custom_data); } catch(e){}
      
      let checksHTML = '';
      keys.forEach(k => {
        const pass = cData[k] === true;
        checksHTML += `<td class="px-6 py-3 text-center border-l border-gray-100">
          ${pass ? '<span class="text-green-600 font-bold">[ ✓ ]</span>' : '<span class="text-red-400 font-mono">[   ]</span>'}
        </td>`;
      });

      tbody.innerHTML += `
        <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100">
          <td class="px-6 py-3 text-gray-500 font-mono">${i + 1}</td>
          <td class="px-6 py-3 font-bold text-gray-800">${r.ba_no}</td>
          <td class="px-6 py-3 font-bold text-gray-600">${r.class || "—"}</td>
          <td class="px-6 py-3 text-gray-600">${r.coy}</td>
          ${checksHTML}
          <td class="px-6 py-3 text-gray-500 text-sm italic">${r.remarks || "-"}</td>
        </tr>
      `;
    });
  }
}