import db from "../db.js";

export const toolTable = () => {
  db.exec(`
      CREATE TABLE IF NOT EXISTS tool (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      external_id TEXT,
      name TEXT,
      description TEXT,
      PRIMARY KEY (stix_id, version, matrix_type)
      );`);

  db.exec(`
      CREATE TABLE IF NOT EXISTS tool_aliases (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      alias_name TEXT,
      PRIMARY KEY (stix_id, version, matrix_type, alias_name),
      FOREIGN KEY (stix_id, version, matrix_type) 
            REFERENCES tool (stix_id, version, matrix_type) ON DELETE CASCADE
      );
      CREATE INDEX idx_tool_alias_lookup ON tool_aliases (stix_id, version, matrix_type);`);

  db.exec(`
      CREATE TABLE IF NOT EXISTS tool_platforms (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      platform_name TEXT,
      PRIMARY KEY (stix_id, version, matrix_type, platform_name),
      FOREIGN KEY (stix_id, version, matrix_type) 
            REFERENCES tool (stix_id, version, matrix_type) ON DELETE CASCADE
      );
      CREATE INDEX idx_tool_plat_lookup ON tool_platforms (stix_id, version, matrix_type);`);
};
