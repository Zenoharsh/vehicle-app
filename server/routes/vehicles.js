const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// ==========================================
// 1. GET ALL VEHICLES
// ==========================================
router.get("/", async (_, res) => {
  const db = getDB();
  const rows = await db.all(`
    SELECT
      vehicle_id,
      ba_no,
      vehicle_type,
      coy,
      status,
      general_remarks
    FROM vehicles
    ORDER BY coy, ba_no
  `);
  res.json(rows);
});

// ==========================================
// 2. ADD NEW VEHICLE
// ==========================================
router.post("/", async (req, res) => {
  const db = getDB();
  const { ba_no, vehicle_type, coy, general_remarks } = req.body;

  const result = await db.run(
    `INSERT INTO vehicles
     (ba_no, vehicle_type, coy, general_remarks, created_at)
     VALUES (?,?,?,?,datetime('now'))`,
    ba_no,
    vehicle_type,
    coy,
    general_remarks
  );

  // Ensure CME checklist exists
  await db.run(
    `INSERT OR IGNORE INTO vehicle_checks
     (vehicle_id,last_updated)
     VALUES (?,datetime('now'))`,
    result.lastID
  );

  res.json({ success: true });
});

// ==========================================
// 3. GET SINGLE VEHICLE + LOGS
// ==========================================
router.get("/:id", async (req, res) => {
  const db = getDB();
  const vehicleId = req.params.id;

  try {
    // Basic Info
    const vehicle = await db.get(
      "SELECT * FROM vehicles WHERE vehicle_id = ?",
      vehicleId
    );

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // CME Checks
    const checks = await db.get(
      "SELECT * FROM vehicle_checks WHERE vehicle_id = ?",
      vehicleId
    );

    // Repair Logs (History)
    const repairs = await db.all(
      "SELECT * FROM repair_logs WHERE vehicle_id = ? ORDER BY reported_on DESC",
      vehicleId
    );

    // Modification Logs
    const modifications = await db.all(
      "SELECT * FROM modifications WHERE vehicle_id = ? ORDER BY date DESC",
      vehicleId
    );

    res.json({ vehicle, checks, repairs, modifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. GET DISTINCT COY & TYPES (FOR FILTERS)
// ==========================================
router.get("/meta/distinct", async (_, res) => {
  const db = getDB();
  const coys = await db.all(`SELECT DISTINCT coy FROM vehicles ORDER BY coy`);
  const types = await db.all(
    `SELECT DISTINCT vehicle_type FROM vehicles ORDER BY vehicle_type`
  );

  res.json({
    coys: coys.map((r) => r.coy),
    vehicle_types: types.map((r) => r.vehicle_type),
  });
});

// ==========================================
// 5. BULK DAILY MAINTENANCE ROLL (PARADE)
// ==========================================
router.post("/bulk-maintenance", async (req, res) => {
  const db = getDB();
  const payload = req.body; // Array of objects from the frontend

  if (!Array.isArray(payload) || payload.length === 0) {
    return res.status(400).json({ error: "Empty or invalid payload" });
  }

  try {
    // Start a transaction for fast bulk insertion
    await db.run("BEGIN TRANSACTION");

    // Prepare the statement. Note: We use date('now', 'localtime') to stamp today's date.
    const stmt = await db.prepare(`
      INSERT INTO daily_inspections
      (vehicle_id, inspection_date, tires_checked, oil_checked, coolant_checked, monthly_check, remarks)
      VALUES (?, date('now', 'localtime'), ?, ?, ?, ?, ?)
    `);

    for (const item of payload) {
      // Master Pass Logic: If 'daily' is checked on the UI, we assume tires, oil, and coolant passed.
      const pass = item.daily ? 1 : 0;
      const monthly = item.monthly ? 1 : 0;
      const remarks = item.remarks || "";

      await stmt.run([item.vehicle_id, pass, pass, pass, monthly, remarks]);
    }

    await stmt.finalize();
    await db.run("COMMIT");

    // Test log to verify DB insertion
    const checkLogs = await db.all("SELECT * FROM daily_inspections");
    console.log("Current DB Logs:", checkLogs);

    res.json({ success: true, processed: payload.length });
  } catch (err) {
    // If anything fails, rollback the entire batch so we don't get partial data
    await db.run("ROLLBACK");
    console.error("Bulk Maintenance Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
