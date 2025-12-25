const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// Get all active repairs (Pending/In_Progress) joined with Vehicle info
router.get("/active", async (req, res) => {
  const db = getDB();
  const rows = await db.all(`
    SELECT 
      r.repair_id,
      r.defect,
      r.reported_on,
      r.status,
      r.remarks,
      v.ba_no,
      v.vehicle_type,
      v.coy
    FROM repair_logs r
    JOIN vehicles v ON r.vehicle_id = v.vehicle_id
    WHERE r.status != 'RECTIFIED'
    ORDER BY r.reported_on DESC
  `);
  res.json(rows);
});

// Report a new defect
router.post("/", async (req, res) => {
  const db = getDB();
  const { vehicle_id, defect, reported_on, status, remarks } = req.body;

  try {
    await db.run(
      `INSERT INTO repair_logs (vehicle_id, defect, reported_on, status, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      vehicle_id,
      defect,
      reported_on,
      status || "PENDING",
      remarks
    );

    // Optional: Auto-mark vehicle as OFF_ROAD if critical (logic can be added here)

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve a repair (Mark as RECTIFIED)
router.post("/:id/resolve", async (req, res) => {
  const db = getDB();
  const repairId = req.params.id;
  const { remarks } = req.body; // Closing remarks

  try {
    await db.run(
      `UPDATE repair_logs 
       SET status = 'RECTIFIED', remarks = remarks || ' [Resolved: ' || ? || ']' 
       WHERE repair_id = ?`,
      remarks || "Fixed",
      repairId
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
