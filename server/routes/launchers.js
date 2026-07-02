const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

router.get("/", async (req, res) => {
  const db = getDB();
  const rows = await db.all("SELECT * FROM launchers");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const db = getDB();
  const { name, coy, status, remarks } = req.body;
  try {
    await db.run(
      `INSERT INTO launchers (name, coy, status, remarks) VALUES (?, ?, ?, ?)`,
      name, coy, status || 'ACTIVE', remarks
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { name, coy, status, remarks } = req.body;
  try {
    await db.run(
      `UPDATE launchers SET name=?, coy=?, status=?, remarks=? WHERE id=?`,
      name, coy, status, remarks, id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// DELETE LAUNCHERS
// ==========================================
router.delete('/:id', async (req, res) => {
  const db = getDB();
  try {
    await db.run('DELETE FROM launchers WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
