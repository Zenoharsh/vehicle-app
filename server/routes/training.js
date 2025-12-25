const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// Get all training records
router.get("/", async (req, res) => {
  const db = getDB();
  const rows = await db.all(
    `SELECT * FROM training ORDER BY conducted_on DESC`
  );
  res.json(rows);
});

// Add new training record
router.post("/", async (req, res) => {
  const db = getDB();
  const { title, category, conducted_on, remarks } = req.body;

  try {
    await db.run(
      `INSERT INTO training (title, category, conducted_on, remarks)
       VALUES (?, ?, ?, ?)`,
      title,
      category,
      conducted_on,
      remarks
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
