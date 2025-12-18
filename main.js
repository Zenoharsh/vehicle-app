/*
 * === UNIT COMMAND SYSTEM: 15th Battalion (Prototype Approval Build) ===
 * Offline • LAN-Based • Electron Desktop Application
 */

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const express = require("express");
const cors = require("cors");
const os = require("os");
const fs = require("fs");

// =====================================================
// APP CONFIG (AUTO-CREATED)
// =====================================================
const CONFIG_PATH = path.join(app.getPath("userData"), "app-config.json");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

app.disableHardwareAcceleration();

// =====================================================
// GLOBALS
// =====================================================
let db = null;
let server = null;
let mainWindow = null;
const SERVER_PORT = 4999;

// =====================================================
// MODE SELECTION IPC
// =====================================================
ipcMain.on("SET_MODE", (_, mode) => {
  saveConfig({
    mode,
    serverIp: mode === "server" ? getLocalIpAddress() : "",
  });
  app.relaunch();
  app.exit();
});

// =====================================================
// DATABASE INITIALIZATION (CORRECTED)
// =====================================================
async function initializeDatabase() {
  const dbPath = path.join(app.getPath("userData"), "unit_command_v5.db");
  db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
      ba_no TEXT UNIQUE NOT NULL,
      make TEXT,
      model TEXT,
      class_group TEXT CHECK(class_group IN ('A','B','C','SPECIAL')),
      coy TEXT,
      status TEXT DEFAULT 'On Road',
      current_odometer INTEGER,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS drivers (
      driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
      army_no TEXT UNIQUE,
      rank_name TEXT,
      coy TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS driver_qualifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER,
      class_group TEXT,
      FOREIGN KEY(driver_id) REFERENCES drivers(driver_id)
    );

    CREATE TABLE IF NOT EXISTS training (
      training_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      training_type TEXT,
      conducted_on TEXT,
      conducted_by TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS modifications (
      mod_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      title TEXT,
      description TEXT,
      date_applied TEXT,
      approved_by TEXT,
      remarks TEXT,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(vehicle_id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_checks (
      check_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      check_type TEXT,
      checked_on TEXT,
      checked_by TEXT,
      remarks TEXT,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(vehicle_id)
    );

    CREATE TABLE IF NOT EXISTS repair_logs (
      repair_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      defect_description TEXT,
      date_reported TEXT,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(vehicle_id)
    );
  `);

  // ===== DEMO SEED =====
  const count = await db.get("SELECT COUNT(*) as c FROM vehicles");
  if (count.c === 0) {
    await db.run(
      "INSERT INTO vehicles (ba_no, make, model, class_group, coy, status, current_odometer) VALUES (?,?,?,?,?,?,?)",
      "21D12345M",
      "Tata",
      "Safari Storme GS",
      "B",
      "Alpha",
      "On Road",
      15400
    );
    await db.run(
      "INSERT INTO vehicles (ba_no, make, model, class_group, coy, status, current_odometer) VALUES (?,?,?,?,?,?,?)",
      "19B88776K",
      "Ashok Leyland",
      "Stallion 4x4",
      "A",
      "HQ",
      "On Road",
      42000
    );
    await db.run(
      "INSERT INTO repair_logs (vehicle_id, defect_description, date_reported, status) VALUES (?,?,?,?)",
      2,
      "Air Brake Leakage",
      "2023-12-05",
      "Pending"
    );
    await db.run(
      "INSERT INTO training (title, training_type, conducted_on, conducted_by, remarks) VALUES (?,?,?,?,?)",
      "Annual Driver Safety",
      "Vehicle",
      "2024-01-15",
      "MT Platoon",
      "Prototype entry"
    );
  }
}

// =====================================================
// NETWORK UTILS
// =====================================================
function getLocalIpAddress() {
  const nets = os.networkInterfaces();
  for (const n of Object.values(nets)) {
    for (const iface of n) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

// =====================================================
// EXPRESS SERVER
// =====================================================
function startServer() {
  const api = express();
  api.use(cors());
  api.use(express.json());

  api.get("/api/dashboard", async (_, res) => {
    const total = await db.get("SELECT COUNT(*) c FROM vehicles");
    const off = await db.get(
      "SELECT COUNT(*) c FROM vehicles WHERE status!='On Road'"
    );
    const rep = await db.get(
      "SELECT COUNT(*) c FROM repair_logs WHERE status!='Rectified'"
    );
    res.json({
      total_vehicles: total.c,
      off_road: off.c,
      active_repairs: rep.c,
    });
  });

  api.get("/api/vehicles", async (_, res) =>
    res.json(await db.all("SELECT * FROM vehicles ORDER BY coy, class_group"))
  );

  api.post("/api/vehicles", async (req, res) => {
    const { ba_no, make, model, coy, current_odometer } = req.body;
    await db.run(
      "INSERT INTO vehicles (ba_no, make, model, coy, current_odometer) VALUES (?,?,?,?,?)",
      ba_no,
      make,
      model,
      coy,
      current_odometer
    );
    res.json({ success: true });
  });

  api.get("/api/training", async (_, res) =>
    res.json(await db.all("SELECT * FROM training ORDER BY conducted_on DESC"))
  );

  api.post("/api/training", async (req, res) => {
    const { title, training_type, conducted_on, conducted_by, remarks } =
      req.body;
    await db.run(
      "INSERT INTO training VALUES (NULL,?,?,?,?,?)",
      title,
      training_type,
      conducted_on,
      conducted_by,
      remarks
    );
    res.json({ success: true });
  });

  server = api.listen(SERVER_PORT, "0.0.0.0");
}

// =====================================================
// MAIN WINDOW
// =====================================================
function createMainWindow(mode, serverIp = "") {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
  });

  const config = {
    mode,
    apiUrl:
      mode === "server"
        ? `http://127.0.0.1:${SERVER_PORT}`
        : `http://${serverIp}:${SERVER_PORT}`,
    serverIp: mode === "server" ? getLocalIpAddress() : serverIp,
  };

  mainWindow.loadFile(path.join(__dirname, "ui", "index.html"));

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("APP_CONFIG", config);
  });
}

// =====================================================
// APP LIFECYCLE
// =====================================================
app.on("ready", async () => {
  const cfg = loadConfig();
  if (!cfg) return createModeSelectionWindow();

  if (cfg.mode === "server") {
    await initializeDatabase();
    startServer();
    createMainWindow("server");
  } else {
    if (!cfg.serverIp) {
      dialog.showErrorBox("Client Mode Error", "Server IP not configured.");
      return createModeSelectionWindow();
    }
    createMainWindow("client", cfg.serverIp);
  }
});

app.on("window-all-closed", () => {
  if (server) server.close();
  app.quit();
});

// =====================================================
// MODE SELECTION WINDOW
// =====================================================
function createModeSelectionWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 260,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  win.loadURL(`data:text/html,
    <h2>Select Application Mode</h2>
    <button onclick="require('electron').ipcRenderer.send('SET_MODE','server')">SERVER</button>
    <button onclick="require('electron').ipcRenderer.send('SET_MODE','client')">CLIENT</button>
  `);
}
