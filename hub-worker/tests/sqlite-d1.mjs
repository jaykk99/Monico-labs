/* D1 stand-in over node:sqlite, so tests run the real schema and the
 * real SQL the Worker issues (no hand-written query fakes). */
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const migration = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations", "0001_init.sql");

export function makeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(migration, "utf-8"));
  const norm = (v) => (v === undefined ? null : typeof v === "boolean" ? Number(v) : v);
  return {
    raw: db,
    prepare(sql) {
      let binds = [];
      const stmt = {
        bind(...values) { binds = values.map(norm); return stmt; },
        async run() { db.prepare(sql).run(...binds); return { success: true }; },
        async first() { return db.prepare(sql).get(...binds) || null; },
        async all() { return { results: db.prepare(sql).all(...binds) }; },
      };
      return stmt;
    },
  };
}
