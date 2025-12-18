let API_URL = "";

window.electronAPI.on("APP_CONFIG", (config) => {
  API_URL = config.apiUrl;
  document.getElementById("conn-status").innerText = `SERVER: ${
    config.serverIp
  } | MODE: ${config.mode.toUpperCase()}`;
  loadDashboard();
});

async function api(endpoint, opts) {
  try {
    return await (await fetch(API_URL + endpoint, opts)).json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function loadDashboard() {
  try {
    const stats = await api("/api/dashboard");
    if (stats) {
      document.getElementById("stat-off").innerText = stats.off_road;
      document.getElementById("stat-repair").innerText = stats.active_repairs;
      document.getElementById("stat-alert-count").innerText =
        stats.active_repairs;
    }
  } catch (e) {}
}

async function loadVehicles() {
  try {
    const vehicles = await api("/api/vehicles");
    const tbody = document.getElementById("vehicle-table-body");
    tbody.innerHTML = "";
    if (!vehicles) return;

    vehicles.forEach((v) => {
      const statusColor =
        v.status === "On Road"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800";

      tbody.innerHTML += `
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 font-mono font-bold text-army-900">${
              v.ba_no
            }</td>
            <td class="px-6 py-4">${v.make} ${v.model}</td>
            <td class="px-6 py-4">${v.coy}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 rounded text-xs font-bold ${statusColor}">
                ${v.status}
              </span>
            </td>
            <td class="px-6 py-4 text-right font-mono">
              ${v.current_odometer.toLocaleString()}
            </td>
          </tr>`;
    });
  } catch (e) {}
}

function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(id + "-page").classList.add("active");
  if (id === "home") loadDashboard();
  if (id === "vehicles") loadVehicles();
}

function openModal(id) {
  const el = document.getElementById(id);
  el.classList.remove("hidden");
  el.classList.add("flex");
}

function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.add("hidden");
  el.classList.remove("flex");
}

document.getElementById("vehicle-form").onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    ba_no: document.getElementById("v-ba").value,
    make: document.getElementById("v-make").value,
    model: document.getElementById("v-model").value,
    coy: document.getElementById("v-coy").value,
    current_odometer: document.getElementById("v-odo").value,
    status: "On Road",
  };
  await api("/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  closeModal("vehicle-modal");
  showPage("vehicles");
};
