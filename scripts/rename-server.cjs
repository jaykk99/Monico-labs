// Post-build helper: tsc emits dist/server.js (CommonJS); rename it to
// dist/server.cjs so it loads as CommonJS even though package.json is "type": "module".
// Same treatment for any server/ submodule chunks (e.g. sqlite-db.js -> sqlite-db.cjs),
// with the require() path in server.cjs rewritten to match.
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

function renameJsToCjs(from, to) {
  if (fs.existsSync(from)) {
    if (fs.existsSync(to)) fs.unlinkSync(to);
    fs.renameSync(from, to);
    console.log(`[build] ${path.relative(distDir, from)} -> ${path.relative(distDir, to)}`);
  }
}

// 1) server entry
renameJsToCjs(path.join(distDir, "server.js"), path.join(distDir, "server.cjs"));

// 2) server submodules
const serverSubDir = path.join(distDir, "server");
if (fs.existsSync(serverSubDir)) {
  for (const f of fs.readdirSync(serverSubDir)) {
    if (!f.endsWith(".js")) continue;
    const base = f.slice(0, -3);
    renameJsToCjs(path.join(serverSubDir, f), path.join(serverSubDir, base + ".cjs"));
    // 3) rewrite the require path inside server.cjs
    const entry = path.join(distDir, "server.cjs");
    if (fs.existsSync(entry)) {
      const src = fs.readFileSync(entry, "utf-8");
      const patched = src.split(`require("./server/${base}")`).join(`require("./server/${base}.cjs")`);
      if (patched !== src) {
        fs.writeFileSync(entry, patched);
        console.log(`[build] rewrote require("./server/${base}") in server.cjs`);
      }
    }
  }
}

if (!fs.existsSync(path.join(distDir, "server.cjs"))) {
  console.error("[build] expected dist/server.cjs to exist; server emit may have failed");
  process.exit(1);
}
