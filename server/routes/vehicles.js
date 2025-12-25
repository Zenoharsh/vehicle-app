const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// Get all vehicles
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

// Add vehicle
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

// Get single vehicle + CME checks
// Get single vehicle + Checks + Logs (Repairs & Mods)
router.get("/:id", async (req, res) => {
  const db = getDB();
  const vehicleId = req.params.id;

  try {
    // 1. Basic Info
    const vehicle = await db.get(
      "SELECT * FROM vehicles WHERE vehicle_id = ?",
      vehicleId
    );

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // 2. CME Checks
    const checks = await db.get(
      "SELECT * FROM vehicle_checks WHERE vehicle_id = ?",
      vehicleId
    );

    // 3. Repair Logs (History)
    const repairs = await db.all(
      "SELECT * FROM repair_logs WHERE vehicle_id = ? ORDER BY reported_on DESC",
      vehicleId
    );

    // 4. Modification Logs
    const modifications = await db.all(
      "SELECT * FROM modifications WHERE vehicle_id = ? ORDER BY date DESC",
      vehicleId
    );

    res.json({ vehicle, checks, repairs, modifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get distinct Coy and Vehicle Types (for Drivers integration)
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
module.exports = router;
