import db from "../db.js";

export const campaignsTable = () => {
  db.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      external_id TEXT,
      name TEXT,
      description TEXT,
      first_seen TEXT,
      last_seen TEXT,
      PRIMARY KEY (stix_id, version, matrix_type)
      );
      CREATE INDEX idx_campaign_lookup ON campaigns (stix_id, version, matrix_type);`);

  db.exec(`
      CREATE TABLE IF NOT EXISTS campaign_aliases (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      alias_name TEXT,
      PRIMARY KEY (stix_id, version, matrix_type, alias_name),
      FOREIGN KEY (stix_id, version, matrix_type) 
            REFERENCES campaigns (stix_id, version, matrix_type) ON DELETE CASCADE
      );`);
};
