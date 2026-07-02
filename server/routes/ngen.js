const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

router.get("/", async (req, res) => {
  const db = getDB();
  const rows = await db.all("SELECT * FROM ngen_vehicles");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const db = getDB();
  const { release_date, equipment, oem_details, remarks } = req.body;
  try {
    await db.run(
      `INSERT INTO ngen_vehicles (release_date, equipment, oem_details, remarks) VALUES (?, ?, ?, ?)`,
      release_date, equipment, oem_details, remarks
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { release_date, equipment, oem_details, remarks } = req.body;
  try {
    await db.run(
      `UPDATE ngen_vehicles SET release_date=?, equipment=?, oem_details=?, remarks=? WHERE id=?`,
      release_date, equipment, oem_details, remarks, id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// DELETE NGEN_VEHICLES
// ==========================================
router.delete('/:id', async (req, res) => {
  const db = getDB();
  try {
    await db.run('DELETE FROM ngen_vehicles WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
