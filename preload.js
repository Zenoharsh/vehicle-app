/*
 * === preload.js ===
 * This file is REQUIRED for Electron security.
 * It acts as a secure "bridge" between the Electron main process (Node.js)
 * and the renderer window (the webpage).
 */
const { contextBridge, ipcRenderer } = require("electron");

// Expose a safe, limited API to the webpage
contextBridge.exposeInMainWorld("electronAPI", {
  // Expose the 'on' method of ipcRenderer to
  // allow the webpage to *receive* messages from the main process.
  on: (channel, callback) => {
    // Whitelist the channel to prevent security risks
    const validChannels = ["APP_CONFIG"];
    if (validChannels.includes(channel)) {
      // (event, ...args) => callback(...args)
      // This strips the 'event' argument, which is good practice
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
});
