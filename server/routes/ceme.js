const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// GET all CEME logs, joining with vehicles for relational data
router.get("/", async (req, res) => {
  const db = getDB();
  try {
    const query = `
      SELECT c.id, c.date, c.remarks, v.ba_no, v.coy, v.vehicle_type
      FROM ceme_logs c
      JOIN vehicles v ON c.vehicle_id = v.vehicle_id
      ORDER BY c.date DESC
    `;
    const rows = await db.all(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new CEME log
router.post("/", async (req, res) => {
  const db = getDB();
  const { vehicle_id, date, remarks } = req.body;
  try {
    await db.run(
      `INSERT INTO ceme_logs (vehicle_id, date, remarks) VALUES (?, ?, ?)`,
      vehicle_id, date, remarks
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a CEME log
router.delete("/:id", async (req, res) => {
  const db = getDB();
  try {
    await db.run(`DELETE FROM ceme_logs WHERE id = ?`, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
