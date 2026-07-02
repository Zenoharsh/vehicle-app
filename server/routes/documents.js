const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getDB } = require("../db");

// In Electron app context, app.getPath is available if we require 'electron'
// We wrap it in a try-catch for cases where we might run just express standalone for testing
let uploadsDir = "";
try {
  const { app } = require("electron");
  uploadsDir = path.join(app.getPath("userData"), "uploads");
} catch (e) {
  uploadsDir = path.join(process.cwd(), "uploads");
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
  const db = getDB();
  try {
    const rows = await db.all("SELECT id, doc_type, date, equipment_name, remarks, file_name FROM documents ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  const db = getDB();
  const { doc_type, date, equipment_name, remarks } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    await db.run(
      `INSERT INTO documents (doc_type, date, equipment_name, remarks, file_path, file_name) VALUES (?, ?, ?, ?, ?, ?)`,
      doc_type, date, equipment_name, remarks, req.file.path, req.file.originalname
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/download/:id", async (req, res) => {
  const db = getDB();
  try {
    const row = await db.get("SELECT file_path, file_name FROM documents WHERE id = ?", req.params.id);
    if (!row) {
      return res.status(404).json({ error: "File not found" });
    }
    if (fs.existsSync(row.file_path)) {
      res.download(row.file_path, row.file_name);
    } else {
      res.status(404).json({ error: "File does not exist on disk" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// DELETE DOCUMENTS
// ==========================================
router.delete('/:id', async (req, res) => {
  const db = getDB();
  try {
    await db.run('DELETE FROM documents WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
