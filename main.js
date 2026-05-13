// ================================
// Electron & Node Imports
// ================================
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// ================================
// IPC Handlers
// ================================
ipcMain.handle("load-html", async (event, filename) => {
  try {
    const filePath = path.join(__dirname, "ui", filename);
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Failed to load HTML:", err);
    return "";
  }
});

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

function createMainWindow(mode, serverIp = null) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Hide initially to prevent flickering
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // ✅ FIX 1: Maximize window immediately
  mainWindow.maximize();
  mainWindow.show();

  mainWindow.loadFile(path.join(__dirname, "ui/index.html"));

  // Inject Config when UI is ready
  mainWindow.webContents.on("did-finish-load", () => {
    const apiUrl =
      mode === "server" ? "http://localhost:4999" : `http://${serverIp}:4999`;

    mainWindow.webContents.send("APP_CONFIG", {
      mode,
      serverIp: serverIp || "localhost",
      apiUrl,
    });
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ================================
// App Lifecycle
// ================================
app.disableHardwareAcceleration();

app.on("ready", async () => {
  try {
    let cfg = loadConfig();

    // ✅ FIX 2: Auto-Create Config & Start Server if Missing
    // This prevents the "Network Error" on first run
    if (!cfg) {
      console.log("No config found. Auto-initializing as SERVER.");
      cfg = { mode: "server", serverIp: "localhost" };
      saveConfig(cfg);
    }

    if (cfg.mode === "server") {
      // Start Database and API Server
      await initDB();
      startServer();
      createMainWindow("server");
    } else {
      // Client Mode Logic
      if (!cfg.serverIp) {
        // Fallback to server if config is broken
        cfg = { mode: "server", serverIp: "localhost" };
        saveConfig(cfg);
        await initDB();
        startServer();
        createMainWindow("server");
      } else {
        createMainWindow("client", cfg.serverIp);
      }
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
    // If reactivating on Mac, default to server if logic allows,
    // but usually app.on('ready') handles the main logic.
    // For safety in this prototype, we rely on the ready event.
  }
});
