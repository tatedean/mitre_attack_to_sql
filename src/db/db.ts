import { DatabaseSync } from "node:sqlite";
import fs from 'node:fs';

// 1. Initialize the connection
const db = new DatabaseSync("./mitre_attack_sqlite.db");

// 2. Run "Schema" setup (Equivalent to Mongoose Schema/Model init)
// This ensures your tables exist before any routes try to use them.
db.exec(`
  CREATE TABLE IF NOT EXISTS techniques (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    matrix TEXT
  );
`);

export default db;