const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// 1. Get All Drivers (Supports filtering)
router.get("/", async (req, res) => {
  const db = getDB();
  const { coy, vehicle_type } = req.query;

  let query = "SELECT * FROM drivers WHERE 1=1";
  const params = [];

  if (coy) {
    query += " AND coy=?";
    params.push(coy);
  }
  if (vehicle_type) {
    query += " AND vehicle_type=?";
    params.push(vehicle_type);
  }

  query += " ORDER BY coy, name";

  const rows = await db.all(query, params);
  res.json(rows);
});

// 2. Add New Driver
router.post("/", async (req, res) => {
  const db = getDB();
  const { army_no, name, coy, vehicle_type, license_issued, remarks } =
    req.body;

  try {
    await db.run(
      `INSERT INTO drivers (army_no, name, coy, vehicle_type, license_issued, remarks)
       VALUES (?,?,?,?,?,?)`,
      army_no,
      name,
      coy,
      vehicle_type,
      license_issued,
      remarks
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Existing Driver
router.put("/:id", async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { army_no, name, coy, vehicle_type, license_issued, remarks } = req.body;
  try {
    await db.run(
      `UPDATE drivers SET army_no=?, name=?, coy=?, vehicle_type=?, license_issued=?, remarks=? WHERE driver_id=?`,
      army_no, name, coy, vehicle_type, license_issued, remarks, id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// DELETE DRIVERS
// ==========================================
router.delete('/:id', async (req, res) => {
  const db = getDB();
  try {
    await db.run('DELETE FROM drivers WHERE driver_id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
