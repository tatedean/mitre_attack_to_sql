import db from "../db.js";

export const tacticsTable = () => {
  db.exec(`
        CREATE TABLE IF NOT EXISTS tactics (
        stix_id TEXT,
        version TEXT,
        external_id TEXT,
        matrix_type TEXT,
        name TEXT,
        orderNum INTEGER,
        description TEXT,
        PRIMARY KEY (stix_id, version, matrix_type)
        );`);
};
