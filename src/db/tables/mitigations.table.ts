import db from "../db.js";

export const mitigationsTable = () => {
  db.exec(`
        CREATE TABLE IF NOT EXISTS mitigations (
        stix_id TEXT,
        version TEXT,
        external_id TEXT,
        matrix_type TEXT,
        name TEXT,
        x_mitre_deprecated INTEGER,
        revoked INTEGER,
        description TEXT,
        PRIMARY KEY (stix_id, version, matrix_type)
        );`);
};
