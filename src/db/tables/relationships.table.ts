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
        description TEXT,
        PRIMARY KEY (stix_id, version, matrix_type)
        );
        CREATE INDEX idx_rel_lookup ON relationships (source_ref, target_ref, version, matrix_type);`);
};
