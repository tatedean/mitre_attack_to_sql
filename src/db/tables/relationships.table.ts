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
        CREATE INDEX idx_rel_source_lookup ON relationships (source_ref, version, relationship_type, matrix_type);
        CREATE INDEX idx_rel_target_lookup ON relationships (target_ref, version, relationship_type, matrix_type);`);
};
