import db from "../db.js";

export const techniqueTable = () => {
  db.exec(`
        CREATE TABLE IF NOT EXISTS techniques (
            stix_id TEXT,
            version TEXT,
            matrix_type TEXT,
            external_id TEXT,
            is_subtechnique INTEGER,
            name TEXT,
            description TEXT,
            PRIMARY KEY (stix_id, version, matrix_type)
        );
        CREATE INDEX idx_tech_lookup ON techniques (stix_id, version, matrix_type);
        CREATE INDEX IF NOT EXISTS idx_techniques_external ON techniques (external_id);
        `);

  db.exec(`
        CREATE TABLE IF NOT EXISTS technique_platforms (
        stix_id TEXT,
        version TEXT,
        matrix_type TEXT,
        platform_name TEXT,
        PRIMARY KEY (stix_id, version, matrix_type, platform_name),
        FOREIGN KEY (stix_id, version, matrix_type) 
            REFERENCES techniques (stix_id, version, matrix_type) ON DELETE CASCADE
    );
    CREATE INDEX idx_tech_platforms_lookup ON technique_platforms (stix_id, version, matrix_type);`);

  db.exec(`
        CREATE TABLE IF NOT EXISTS technique_phases (
        stix_id TEXT,
        version TEXT,
        matrix_type TEXT,
        phase_name TEXT,
        PRIMARY KEY (stix_id, version, matrix_type, phase_name),
        FOREIGN KEY (stix_id, version, matrix_type) REFERENCES techniques (stix_id, version, matrix_type) ON DELETE CASCADE
        );
        CREATE INDEX idx_tech_phases_lookup ON technique_phases (stix_id, version, matrix_type);`);
};
