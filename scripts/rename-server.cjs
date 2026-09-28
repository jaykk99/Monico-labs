// Post-build helper: tsc emits dist/server.js (CommonJS); rename it to
// dist/server.cjs so it loads as CommonJS even though package.json is "type": "module".
const fs = require("fs");
const path = require("path");

const from = path.join(__dirname, "..", "dist", "server.js");
const to = path.join(__dirname, "..", "dist", "server.cjs");

if (fs.existsSync(from)) {
  if (fs.existsSync(to)) fs.unlinkSync(to);
  fs.renameSync(from, to);
  console.log("[build] dist/server.js -> dist/server.cjs");
} else {
  console.error("[build] expected dist/server.js to exist; server emit may have failed");
  process.exit(1);
}
