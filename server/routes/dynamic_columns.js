const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

router.get("/:module_name", async (req, res) => {
  const db = getDB();
  const moduleName = req.params.module_name;
  try {
    const rows = await db.all("SELECT * FROM dynamic_columns WHERE module_name = ?", moduleName);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const db = getDB();
  const { module_name, column_label } = req.body;
  try {
    await db.run(
      `INSERT INTO dynamic_columns (module_name, column_label) VALUES (?, ?)`,
      module_name, column_label
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  try {
    await db.run("DELETE FROM dynamic_columns WHERE id = ?", id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
