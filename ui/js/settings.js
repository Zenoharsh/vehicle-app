// ===============================
// 6. NETWORK SETTINGS MODULE
// ===============================
function initSettingsPage() {
  if (!currentAppConfig) return;
  const modeEl = document.getElementById("config-mode");
  const ipEl = document.getElementById("config-ip");

  if (modeEl) modeEl.value = currentAppConfig.mode;
  if (ipEl)
    ipEl.value =
      currentAppConfig.serverIp === "localhost"
        ? ""
        : currentAppConfig.serverIp;
  toggleIPField();
}

function toggleIPField() {
  const mode = document.getElementById("config-mode")?.value;
  const ipInput = document.getElementById("config-ip");
  if (!ipInput) return;

  if (mode === "server") {
    ipInput.value = "localhost";
    ipInput.disabled = true;
    ipInput.classList.add("opacity-50", "bg-gray-200");
  } else {
    ipInput.disabled = false;
    ipInput.classList.remove("opacity-50", "bg-gray-200");
    if (ipInput.value === "localhost") ipInput.value = "";
  }
}

function saveSettings() {
  const mode = document.getElementById("config-mode").value;
  const serverIp =
    document.getElementById("config-ip").value.trim() || "localhost";
  if (mode === "client" && (!serverIp || serverIp === "localhost")) {
    alert(
      "⚠️ ERROR: Please enter a valid Target Server IP address for Client mode."
    );
    return;
  }
  const newConfig = { mode, serverIp };
  if (window.electronAPI.saveConfig) {
    window.electronAPI.saveConfig(newConfig);
  } else {
    console.error("electronAPI.saveConfig not found in preload.js");
  }
}
