const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

router.get("/:key", async (req, res) => {
  const db = getDB();
  const row = await db.get(
    "SELECT content, updated_at FROM command_texts WHERE key = ?",
    req.params.key
  );
  res.json(row || { content: "" });
});

router.post("/:key", async (req, res) => {
  const db = getDB();
  const { content } = req.body;

  await db.run(
    `UPDATE command_texts
     SET content = ?, updated_at = datetime('now')
     WHERE key = ?`,
    content,
    req.params.key
  );

  res.json({ success: true });
});

module.exports = router;
