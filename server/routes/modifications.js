const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// Get all modifications (Joined with Vehicle BA Number)
router.get("/", async (req, res) => {
  const db = getDB();
  const rows = await db.all(`
    SELECT 
      m.mod_id,
      m.modification,
      m.authority,
      m.date,
      m.remarks,
      v.ba_no,
      v.vehicle_type
    FROM modifications m
    JOIN vehicles v ON m.vehicle_id = v.vehicle_id
    ORDER BY m.date DESC
  `);
  res.json(rows);
});

// Add new modification
router.post("/", async (req, res) => {
  const db = getDB();
  const { vehicle_id, modification, authority, date, remarks } = req.body;

  try {
    await db.run(
      `INSERT INTO modifications (vehicle_id, modification, authority, date, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      vehicle_id,
      modification,
      authority,
      date,
      remarks
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
