// ================================
// Electron & Node Imports
// ================================
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// ================================
// Server & DB Imports
// ================================
const { initDB } = require("./server/db");
const { startServer } = require("./server/server");

// ================================
// App Config Helpers
// ================================
const CONFIG_PATH = path.join(app.getPath("userData"), "app-config.json");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// ================================
// Windows
// ================================
let mainWindow = null;
let modeWindow = null;

// ✅ FIXED VERSION
function createMainWindow(mode, serverIp = null) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "ui/index.html"));

  // 👇 THIS WAS MISSING! 👇
  mainWindow.webContents.on("did-finish-load", () => {
    const apiUrl =
      mode === "server" ? "http://localhost:4999" : `http://${serverIp}:4999`;

    mainWindow.webContents.send("APP_CONFIG", {
      mode,
      serverIp: serverIp || "localhost",
      apiUrl,
    });
  });
  // 👆 END MISSING BLOCK 👆

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createModeSelectionWindow() {
  modeWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // If you don’t have mode.html yet, index.html is fine temporarily
  modeWindow.loadFile(path.join(__dirname, "ui/index.html"));

  modeWindow.on("closed", () => {
    modeWindow = null;
  });
}

// ================================
// IPC (Mode Selection)
// ================================
ipcMain.on("SET_MODE", (_, mode, serverIp = "") => {
  saveConfig({ mode, serverIp });
  app.relaunch();
  app.exit();
});

// ================================
// App Lifecycle
// ================================
app.disableHardwareAcceleration();

app.on("ready", async () => {
  try {
    const cfg = loadConfig();

    if (!cfg) {
      createModeSelectionWindow();
      return;
    }

    if (cfg.mode === "server") {
      await initDB();
      startServer();
      createMainWindow("server");
    } else {
      if (!cfg.serverIp) {
        dialog.showErrorBox("Client Mode Error", "Server IP not configured.");
        createModeSelectionWindow();
        return;
      }
      createMainWindow("client", cfg.serverIp);
    }
  } catch (err) {
    dialog.showErrorBox(
      "Startup Error",
      err.message || "Unknown error during startup"
    );
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow("server");
  }
});
