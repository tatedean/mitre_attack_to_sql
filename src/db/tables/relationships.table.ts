import db from "../db.js";

export const relationshipsTable = () => {
  db.exec(`
        CREATE TABLE IF NOT EXISTS relationships (
        stix_id TEXT,
        version TEXT,
        source_ref TEXT,
        target_ref TEXT,
        relationship_type TEXT,
        matrix_type TEXT,
        x_mitre_deprecated INTEGER,
        revoked INTEGER,
        description TEXT,
        PRIMARY KEY (stix_id, version, matrix_type)
        );`);
};
