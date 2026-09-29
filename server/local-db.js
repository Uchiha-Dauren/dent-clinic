import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const migrations = fileURLToPath(new URL('../drizzle/', import.meta.url));
export function openLocalDatabase(
  filename = process.env.DATABASE_PATH || '.data/nova-dent.sqlite',
) {
  if (filename !== ':memory:')
    mkdirSync(dirname(resolve(filename)), { recursive: true, mode: 0o700 });
  const sqlite = new DatabaseSync(filename);
  sqlite.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  // Local Node only. The hosted Worker uses deployment-applied D1 migrations.
  sqlite.exec('CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY)');
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    if (sqlite.prepare('SELECT name FROM _local_migrations WHERE name = ?').get(name)) continue;
    sqlite.exec('BEGIN IMMEDIATE');
    try {
      sqlite.exec(readFileSync(resolve(migrations, name), 'utf8'));
      sqlite.prepare('INSERT INTO _local_migrations (name) VALUES (?)').run(name);
      sqlite.exec('COMMIT');
    } catch (error) {
      sqlite.exec('ROLLBACK');
      sqlite.close();
      throw error;
    }
  }
  function prepared(sql, params = []) {
    return {
      bind(...values) {
        return prepared(sql, values);
      },
      first() {
        return sqlite.prepare(sql).get(...params) ?? null;
      },
      all() {
        return { success: true, results: sqlite.prepare(sql).all(...params) };
      },
    };
  }
  return {
    prepare: prepared,
    batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const result = statements.map((statement) => statement.all());
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    close() {
      sqlite.close();
    },
  };
}
