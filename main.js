/*
 * === UNIT COMMAND SYSTEM: 15th Battalion (Polished UI) ===
 * Updates:
 * 1. Dark, integrated Navbar (Command Console style).
 * 2. 5-Tile Top Row Layout.
 * 3. Horizontal Scroll Bottom Deck.
 */

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const express = require("express");
const cors = require("cors");
const os = require("os");
const fs = require("fs");

// --- OPTIMIZATION ---
app.disableHardwareAcceleration();

// --- VARIABLES ---
let db;
let server;
let mainWindow;
const SERVER_PORT = 4999;

// --- DATABASE SETUP ---
async function initializeDatabase() {
  const dbPath = path.join(app.getPath("userData"), "unit_command_v2.db");
  db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.exec(
    `CREATE TABLE IF NOT EXISTS vehicles (vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT, ba_no TEXT UNIQUE, make TEXT, model TEXT, class_group TEXT, coy TEXT, status TEXT, current_odometer INTEGER, department TEXT);`
  );
  await db.exec(
    `CREATE TABLE IF NOT EXISTS drivers (driver_id INTEGER PRIMARY KEY AUTOINCREMENT, army_no TEXT UNIQUE, rank_name TEXT, coy TEXT, license_type TEXT, qualified_for TEXT);`
  );
  await db.exec(
    `CREATE TABLE IF NOT EXISTS checklist_tasks (task_id INTEGER PRIMARY KEY AUTOINCREMENT, task_name TEXT, check_type TEXT, category TEXT);`
  );
  await db.exec(
    `CREATE TABLE IF NOT EXISTS repair_logs (repair_id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle_id INTEGER, defect_description TEXT, date_reported TEXT, status TEXT, FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id));`
  );
  await db.exec(
    `CREATE TABLE IF NOT EXISTS maintenance_logs (log_id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle_id INTEGER, service_name TEXT, service_date TEXT, service_mileage INTEGER, description TEXT, cost REAL, performed_by TEXT, FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id));`
  );

  // Seed Data
  const vCount = await db.get("SELECT COUNT(*) as count FROM vehicles");
  if (vCount.count === 0) {
    await db.run(
      "INSERT INTO vehicles (ba_no, make, model, class_group, coy, status, current_odometer) VALUES (?, ?, ?, ?, ?, ?, ?)",
      "21D12345M",
      "Tata",
      "Safari Storme GS",
      "B",
      "Alpha",
      "On Road",
      15400
    );
    await db.run(
      "INSERT INTO vehicles (ba_no, make, model, class_group, coy, status, current_odometer) VALUES (?, ?, ?, ?, ?, ?, ?)",
      "19B88776K",
      "Ashok Leyland",
      "Stallion 4x4",
      "A",
      "HQ",
      "On Road",
      42000
    );
    await db.run(
      "INSERT INTO repair_logs (vehicle_id, defect_description, date_reported, status) VALUES (?, ?, ?, ?)",
      2,
      "Air Brake Leakage",
      "2023-12-05",
      "Pending"
    );
  }
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

// --- SERVER API ---
function startServer() {
  const expressApp = express();
  expressApp.use(cors());
  expressApp.use(express.json());

  expressApp.get("/api/dashboard", async (req, res) => {
    try {
      const totalVehicles = await db.get(
        "SELECT COUNT(*) as count FROM vehicles"
      );
      const offRoad = await db.get(
        'SELECT COUNT(*) as count FROM vehicles WHERE status != "On Road"'
      );
      const activeRepairs = await db.get(
        'SELECT COUNT(*) as count FROM repair_logs WHERE status != "Rectified"'
      );
      res.json({
        total_vehicles: totalVehicles.count,
        off_road: offRoad.count,
        active_repairs: activeRepairs.count,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  expressApp.get("/api/vehicles", async (req, res) => {
    const vehicles = await db.all(
      "SELECT * FROM vehicles ORDER BY coy, class_group"
    );
    res.json(vehicles);
  });
  expressApp.post("/api/vehicles", async (req, res) => {
    const { ba_no, make, model, coy, status, current_odometer } = req.body;
    try {
      const result = await db.run(
        "INSERT INTO vehicles (ba_no, make, model, coy, status, current_odometer) VALUES (?, ?, ?, ?, ?, ?)",
        ba_no,
        make,
        model,
        coy,
        status,
        current_odometer
      );
      res.status(201).json({ newId: result.lastID });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  server = expressApp.listen(SERVER_PORT, "0.0.0.0", () =>
    console.log(`Unit Server Active: ${SERVER_PORT}`)
  );
}

function createMainWindow(mode, serverIp = "") {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
    autoHideMenuBar: true,
  });

  const config = {
    mode: mode,
    apiUrl:
      mode === "server"
        ? `http://127.0.0.1:${SERVER_PORT}`
        : `http://${serverIp}:${SERVER_PORT}`,
    serverIp: getLocalIpAddress(),
  };
  mainWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(getHtmlApp())}`
  );
  mainWindow.webContents.on("did-finish-load", () =>
    mainWindow.webContents.send("APP_CONFIG", config)
  );
}

app.on("ready", async () => {
  await initializeDatabase();
  startServer();
  createMainWindow("server");
});
app.on("window-all-closed", () => {
  if (server) server.close();
  app.quit();
});

// --- THE UI ---
function getHtmlApp() {
  return `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>15th Bn Command</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Black+Ops+One&display=swap" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              army: { 900: '#1B2418', 700: '#2E3B29', 500: '#4A5D43', 100: '#E8F0E6' },
              gold: { 500: '#D4AF37' }
            },
            fontFamily: { 
              sans: ['Roboto', 'sans-serif'],
              stencil: ['"Black Ops One"', 'cursive']
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #F3F4F6; color: #1F2937; }
      
      /* Tiles */
      .cmd-tile {
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        transition: all 0.2s;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        text-align: center; cursor: pointer;
        padding: 1.5rem; height: 160px;
      }
      .cmd-tile:hover { transform: translateY(-3px); box-shadow: 0 8px 12px rgba(0,0,0,0.1); border-color: #4A5D43; }
      .cmd-tile h3 { margin-top: 0.75rem; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; color: #2E3B29; }
      
      /* Info Deck (Scrollable Bottom) */
      .info-deck {
        display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 1rem;
        scroll-snap-type: x mandatory;
      }
      .info-card {
        min-width: 300px; flex: 1;
        background: white; border-radius: 8px; padding: 1.5rem;
        border-left: 4px solid #4A5D43;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        scroll-snap-align: start;
      }
      
      /* Hero Header */
      .hero-section {
        background: linear-gradient(to bottom, #1B2418, #2E3B29);
        color: white; padding: 3rem 2rem;
        border-bottom: 4px solid #D4AF37; margin-bottom: 2rem;
        border-radius: 0 0 4px 4px; /* Slight rounding at bottom */
      }

      .page { display: none; }
      .page.active { display: block; animation: fadeIn 0.2s; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      
      .info-deck::-webkit-scrollbar { height: 8px; }
      .info-deck::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
      .info-deck::-webkit-scrollbar-track { background: transparent; }
    </style>
</head>
<body class="h-full flex flex-col font-sans">

    <nav class="bg-army-900 text-white px-8 py-4 flex justify-between items-center shadow-md z-20">
       <div class="flex items-center gap-3">
          <span class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <div class="text-xs font-mono text-gray-400 uppercase tracking-widest" id="conn-status">System Initializing...</div>
       </div>
       <div class="flex gap-8">
          <button onclick="showPage('home')" class="text-sm font-bold uppercase tracking-wide hover:text-gold-500 transition-colors">Command Home</button>
          <button onclick="showPage('vehicles')" class="text-sm font-bold uppercase tracking-wide text-gray-400 hover:text-white transition-colors">Fleet Register</button>
          <button class="text-sm font-bold uppercase tracking-wide text-gray-400 hover:text-white transition-colors">Settings</button>
       </div>
    </nav>

    <main class="flex-1 overflow-y-auto px-6 pb-8">
      <div class="mx-auto max-w-7xl">

        <div id="home-page" class="page active">
           
           <div class="hero-section flex items-center gap-8 shadow-lg">
              <div class="h-24 w-24 bg-white rounded-full flex items-center justify-center border-4 border-gold-500 shadow-xl text-army-900 font-black text-3xl shrink-0">15</div>
              <div>
                <h1 class="text-4xl font-stencil text-gold-500 tracking-wider">15th Battalion</h1>
                <p class="text-lg font-bold tracking-[0.2em] uppercase opacity-90 text-gray-300">Brigade of The Guards</p>
                <div class="mt-4 flex gap-6 text-xs font-mono font-bold tracking-wide">
                   <span class="px-3 py-1 bg-black/30 rounded border border-gray-600">OFF ROAD: <b id="stat-off" class="text-red-400 text-sm">--</b></span>
                   <span class="px-3 py-1 bg-black/30 rounded border border-gray-600">REPAIRS: <b id="stat-repair" class="text-yellow-400 text-sm">--</b></span>
                </div>
              </div>
           </div>

           <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div onclick="showPage('vehicles')" class="cmd-tile">
                 <svg class="w-8 h-8 text-army-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                 <h3>Vehicles</h3>
              </div>
              <div class="cmd-tile">
                 <svg class="w-8 h-8 text-army-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                 <h3>Training</h3>
              </div>
              <div class="cmd-tile">
                 <svg class="w-8 h-8 text-army-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                 <h3>Modifications</h3>
              </div>
              <div class="cmd-tile">
                 <svg class="w-8 h-8 text-army-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                 <h3>Drivers</h3>
              </div>
              <div onclick="openModal('vehicle-modal')" class="cmd-tile border-army-500 bg-army-100 hover:bg-army-200">
                 <svg class="w-8 h-8 text-army-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <h3 class="text-army-900">Add New Eqpt</h3>
              </div>
           </div>

           <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Information & Alerts</h3>
           <div class="info-deck">
              <div class="info-card">
                 <div class="flex items-center gap-3 mb-2">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h4 class="font-bold text-gray-800">S.O.P.</h4>
                 </div>
                 <p class="text-xs text-gray-500">Standard Operating Procedures for Field & Peace locations.</p>
              </div>
              <div class="info-card border-l-blue-500">
                 <div class="flex items-center gap-3 mb-2">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                    <h4 class="font-bold text-gray-800">Gen. Instructions</h4>
                 </div>
                 <p class="text-xs text-gray-500">Daily Technical Orders and Safety advisories.</p>
              </div>
              <div class="info-card border-l-red-500">
                 <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                       <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                       <h4 class="font-bold text-gray-800">Repair Alerts</h4>
                    </div>
                    <span id="stat-alert-count" class="text-2xl font-black text-red-600">0</span>
                 </div>
                 <p class="text-xs text-gray-500">Critical defects pending rectification.</p>
              </div>
           </div>
        </div>

        <div id="vehicles-page" class="page">
           <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-800">Unit Vehicles</h2>
              <button onclick="showPage('home')" class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-50">Back</button>
           </div>
           <div class="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <table class="w-full text-left">
                 <thead class="bg-army-100 text-xs uppercase font-bold text-army-900 border-b border-gray-300">
                    <tr><th class="px-6 py-4">BA Number</th><th class="px-6 py-4">Model</th><th class="px-6 py-4">Coy</th><th class="px-6 py-4">Status</th><th class="px-6 py-4 text-right">Odometer</th></tr>
                 </thead>
                 <tbody id="vehicle-table-body" class="divide-y divide-gray-100 text-sm font-medium"></tbody>
              </table>
           </div>
        </div>

      </div>
    </main>

    <div id="vehicle-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 backdrop-blur-sm">
       <div class="bg-white w-full max-w-md rounded-lg shadow-xl p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4 uppercase">New Vehicle Entry</h3>
          <form id="vehicle-form" class="space-y-4">
             <input id="v-ba" placeholder="BA Number (e.g. 21D1234K)" class="w-full p-2 border rounded bg-gray-50" required>
             <div class="grid grid-cols-2 gap-4">
                <input id="v-make" placeholder="Make" class="w-full p-2 border rounded bg-gray-50" required>
                <input id="v-model" placeholder="Model" class="w-full p-2 border rounded bg-gray-50" required>
             </div>
             <input id="v-coy" placeholder="Company (Alpha/Bravo)" class="w-full p-2 border rounded bg-gray-50">
             <input id="v-odo" type="number" placeholder="Odometer" class="w-full p-2 border rounded bg-gray-50" required>
             <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModal('vehicle-modal')" class="px-4 py-2 text-gray-600 font-bold">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-army-700 text-white font-bold rounded">Confirm Add</button>
             </div>
          </form>
       </div>
    </div>

    <script>
      let API_URL = '';
      window.electronAPI.on('APP_CONFIG', (config) => {
        API_URL = config.apiUrl;
        document.getElementById('conn-status').innerText = \`SERVER: \${config.serverIp} | MODE: \${config.mode.toUpperCase()}\`;
        loadDashboard();
      });
      async function api(endpoint, opts) { try { return await (await fetch(API_URL + endpoint, opts)).json(); } catch (e) { console.error(e); return null; } }
      async function loadDashboard() {
        const stats = await api('/api/dashboard');
        if (stats) {
           document.getElementById('stat-off').innerText = stats.off_road;
           document.getElementById('stat-repair').innerText = stats.active_repairs;
           document.getElementById('stat-alert-count').innerText = stats.active_repairs;
        }
      }
      async function loadVehicles() {
        const vehicles = await api('/api/vehicles');
        const tbody = document.getElementById('vehicle-table-body');
        tbody.innerHTML = '';
        if(!vehicles) return;
        vehicles.forEach(v => {
           let statusColor = v.status === 'On Road' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
           tbody.innerHTML += \`<tr class="hover:bg-gray-50"><td class="px-6 py-4 font-mono font-bold text-army-900">\${v.ba_no}</td><td class="px-6 py-4">\${v.make} \${v.model}</td><td class="px-6 py-4">\${v.coy}</td><td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-bold \${statusColor}">\${v.status}</span></td><td class="px-6 py-4 text-right font-mono">\${v.current_odometer.toLocaleString()}</td></tr>\`;
        });
      }
      function showPage(id) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById(id + '-page').classList.add('active'); if(id === 'home') loadDashboard(); if(id === 'vehicles') loadVehicles(); }
      function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); }
      function closeModal(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); }
      document.getElementById('vehicle-form').onsubmit = async (e) => { e.preventDefault(); const data = { ba_no: document.getElementById('v-ba').value, make: document.getElementById('v-make').value, model: document.getElementById('v-model').value, coy: document.getElementById('v-coy').value, current_odometer: document.getElementById('v-odo').value, status: 'On Road' }; await api('/api/vehicles', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)}); closeModal('vehicle-modal'); showPage('vehicles'); };
    </script>
</body>
</html>
  `;
}
