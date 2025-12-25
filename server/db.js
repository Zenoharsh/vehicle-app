const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { app } = require("electron");

let db;

async function initDB() {
  // 🔴 CHANGED TO 'final' TO GUARANTEE A FRESH START
  const dbPath = path.join(app.getPath("userData"), "unit_command_final.db");
  db = await open({ filename: dbPath, driver: sqlite3.Database });

  // 🔒 ALL SCHEMA LIVES HERE
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
      ba_no TEXT UNIQUE NOT NULL,
      vehicle_type TEXT CHECK(vehicle_type IN ('A','B','C','SPECIAL')) NOT NULL,
      coy TEXT NOT NULL,
      status TEXT CHECK(status IN ('ON_ROAD','OFF_ROAD')) DEFAULT 'ON_ROAD',
      general_remarks TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS vehicle_checks (
      check_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER UNIQUE NOT NULL,
      field_firing INTEGER DEFAULT 0,
      pre_floatation INTEGER DEFAULT 0,
      floatation INTEGER DEFAULT 0,
      preventive INTEGER DEFAULT 0,
      predictive INTEGER DEFAULT 0,
      remarks TEXT,
      last_updated TEXT,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(vehicle_id)
    );

    CREATE TABLE IF NOT EXISTS drivers (
      driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
      army_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      coy TEXT NOT NULL,
      vehicle_type TEXT CHECK(vehicle_type IN ('A','B','C','SPECIAL')),
      license_issued TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS modifications (
      mod_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      modification TEXT,
      authority TEXT,
      date TEXT,
      remarks TEXT,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(vehicle_id)
    );

    CREATE TABLE IF NOT EXISTS training (
      training_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      category TEXT,
      conducted_on TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS repair_logs (
      repair_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      defect TEXT,
      reported_on TEXT,
      status TEXT CHECK(status IN ('PENDING','IN_PROGRESS','RECTIFIED')),
      remarks TEXT,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(vehicle_id)
    );

    /* This table is required for SOP/Instructions Modals */
    CREATE TABLE IF NOT EXISTS command_texts (
      key TEXT PRIMARY KEY,
      content TEXT,
      updated_at TEXT
    );
  `);

  // Initialize default Command Texts so modals aren't empty
  await db.run(
    `INSERT OR IGNORE INTO command_texts (key, content) VALUES ('SOP', '')`
  );
  await db.run(
    `INSERT OR IGNORE INTO command_texts (key, content) VALUES ('GENERAL_INSTRUCTIONS', '')`
  );

  return db;
}

function getDB() {
  if (!db) throw new Error("DB not initialized");
  return db;
}

module.exports = { initDB, getDB };
