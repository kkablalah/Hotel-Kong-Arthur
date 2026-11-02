import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const databasePath = process.env.SQLITE_DATABASE || path.resolve(process.cwd(), 'data/hotel.sqlite');
const wasmPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/sql.js/dist/sql-wasm.wasm');

const databasePromise = (async () => {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  const database = fs.existsSync(databasePath)
    ? new SQL.Database(fs.readFileSync(databasePath))
    : new SQL.Database();
  database.run('PRAGMA foreign_keys = ON');
  return database;
})();

const persist = (database) => {
  const temporaryPath = `${databasePath}.tmp`;
  fs.writeFileSync(temporaryPath, Buffer.from(database.export()));
  fs.renameSync(temporaryPath, databasePath);
};

export const pool = {
  async query(sql, parameters = []) {
    const database = await databasePromise;
    const statement = database.prepare(sql);
    const rows = [];
    const returnsRows = statement.getColumnNames().length > 0;
    try {
      statement.bind(parameters.map((value) => value === undefined ? null : value));
      while (statement.step()) {
        rows.push(statement.getAsObject());
      }
    } finally {
      statement.free();
    }

    if (!/^\s*(SELECT|PRAGMA)\b/i.test(sql)) {
      persist(database);
    }

    const affectedRows = database.getRowsModified();
    const [insertIdRows] = database.exec('SELECT last_insert_rowid() AS insertId');
    const insertId = insertIdRows?.values[0]?.[0] ?? 0;
    return [returnsRows ? rows : { affectedRows, insertId }, []];
  },
};

export default pool;
