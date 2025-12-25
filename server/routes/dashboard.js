const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

router.get("/", async (req, res) => {
  const db = getDB();

  // 1. Count Off Road Vehicles
  const offRoad = await db.get(`
    SELECT COUNT(*) as count FROM vehicles WHERE status = 'OFF_ROAD'
  `);

  // 2. Count Active Repairs
  const activeRepairs = await db.get(`
    SELECT COUNT(*) as count FROM repair_logs WHERE status != 'RECTIFIED'
  `);

  // Return combined stats
  res.json({
    off_road: offRoad.count,
    active_repairs: activeRepairs.count,
  });
});

module.exports = router;
