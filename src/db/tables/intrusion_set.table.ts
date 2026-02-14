import db from "../db.js";

export const intrusion_setTable = () => {
  db.exec(`
      CREATE TABLE IF NOT EXISTS intrusion_set (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      external_id TEXT,
      name TEXT,
      description TEXT,
      PRIMARY KEY (stix_id, version, matrix_type)
      );`);

  db.exec(`
      CREATE TABLE IF NOT EXISTS intrusion_set_aliases (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      alias_name TEXT,
      PRIMARY KEY (stix_id, version, matrix_type, alias_name),
      FOREIGN KEY (stix_id, version, matrix_type) 
            REFERENCES intrusion_set (stix_id, version, matrix_type) ON DELETE CASCADE
      );
      CREATE INDEX idx_intru_alias_lookup ON intrusion_set_aliases (stix_id, version, matrix_type);`);
};
