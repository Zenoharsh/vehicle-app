const express = require("express");
const cors = require("cors");

const dashboard = require("./routes/dashboard");
const vehicles = require("./routes/vehicles");
const training = require("./routes/training");
const commandText = require("./routes/commandText");
const drivers = require("./routes/drivers");
const modifications = require("./routes/modifications");
const repairs = require("./routes/repairs"); // Add this
const SERVER_PORT = 4999;

function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/dashboard", dashboard);
  app.use("/api/vehicles", vehicles);
  app.use("/api/training", training);
  app.use("/api/command-text", commandText);
  app.use("/api/drivers", drivers);
  app.use("/api/modifications", modifications);
  app.use("/api/repairs", repairs);
  app.listen(SERVER_PORT, "0.0.0.0", () => {
    console.log(`API server running on ${SERVER_PORT}`);
  });
}

module.exports = { startServer };
