import db from "../db.js";

export const techniqueTable = () => {
  db.exec(`
        CREATE TABLE IF NOT EXISTS techniques (
            stix_id TEXT,
            version TEXT,
            matrix_type TEXT,
            external_id TEXT,
            is_subtechnique INTEGER,
            x_mitre_deprecated INTEGER,
            revoked INTEGER,
            name TEXT,
            description TEXT,
            PRIMARY KEY (stix_id, version, matrix_type)
        );
        CREATE INDEX IF NOT EXISTS idx_techniques_external ON techniques (external_id);
        CREATE INDEX IF NOT EXISTS idx_techniques_version_matrix ON techniques (matrix_type, version);
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
    CREATE INDEX IF NOT EXISTS idx_platforms_name ON technique_platforms (platform_name);`);

  db.exec(`
        CREATE TABLE IF NOT EXISTS technique_phases (
        stix_id TEXT,
        version TEXT,
        matrix_type TEXT,
        phase_name TEXT,
        PRIMARY KEY (stix_id, version, matrix_type, phase_name),
        FOREIGN KEY (stix_id, version, matrix_type) REFERENCES techniques (stix_id, version, matrix_type) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_phases_name ON technique_phases (phase_name);
        `);
};
