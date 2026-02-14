import fs from "node:fs";
import db from "./db.js";
import { handleItem } from "./process_statements/process_handler.js";
import { StatementSync } from "node:sqlite";
import { createAttackTables } from "./db.tables.js";

export type StatementsA = {
  "x-mitre-tactic": StatementSync;
  "attack-pattern": {
    technique: StatementSync;
    platform: StatementSync;
    phase: StatementSync;
  };
  "course-of-action": StatementSync;
  relationships: StatementSync;
  campaigns: {
    campaign: StatementSync;
    alias: StatementSync;
  };
  intrusion_set: {
    intrusion_set: StatementSync;
    alias: StatementSync;
  };
  malware: {
    malware: StatementSync;
    alias: StatementSync;
    platform: StatementSync;
  };
};

export const seedDatabase = ({
  filepath,
  matrix,
  version,
  clearTables = false,
}: {
  filepath: string;
  matrix: string;
  version: string;
  clearTables?: boolean;
}) => {
  if (clearTables) {
    createAttackTables();
  }
  // const countRow = db
  //   .prepare("SELECT COUNT(*) as count FROM techniques")
  //   .get() as { count: number };

  // if (countRow.count > 0) {
  //   console.log("Database already seeded");
  //   return;
  // }

  const rawData = fs.readFileSync(filepath, "utf-8");
  const data = JSON.parse(rawData);

  const statements: StatementsA = {
    "x-mitre-tactic": db.prepare(`
      INSERT INTO tactics (stix_id, external_id, version, matrix_type, name, description, orderNum) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stix_id, version, matrix_type) DO UPDATE SET
          external_id = excluded.external_id,
          name = excluded.name,
          description = excluded.description`),
    "attack-pattern": {
      technique: db.prepare(`
        INSERT INTO techniques (stix_id, external_id, name, is_subtechnique, description, matrix_type, version)
        VALUES (:stix_id, :external_id, :name, :is_subtechnique, :description, :matrix_type, :version)`),
      platform: db.prepare(`
        INSERT INTO technique_platforms (stix_id, version, matrix_type, platform_name) VALUES (?, ?, ?, ?)`),
      phase: db.prepare(`
        INSERT INTO technique_phases (stix_id, version, matrix_type, phase_name) 
        VALUES (?, ?, ?, ?)`),
    },
    "course-of-action": db.prepare(`
        INSERT INTO mitigations (stix_id, external_id, version, matrix_type, name, description) 
        VALUES (?, ?, ?, ?, ?, ?)`),
    relationships: db.prepare(`
        INSERT INTO relationships (stix_id, source_ref, target_ref, relationship_type, description, version, matrix_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`),
    campaigns: {
      campaign: db.prepare(`
        INSERT INTO campaigns (
          stix_id, version, matrix_type, external_id, name, 
          description, first_seen, last_seen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
      alias: db.prepare(`
        INSERT INTO campaign_aliases (stix_id, version, matrix_type, alias_name) VALUES (?, ?, ?, ?)`),
    },
    intrusion_set: {
      intrusion_set: db.prepare(`
        INSERT INTO intrusion_set (
          stix_id, version, matrix_type, external_id, name, 
          description
        ) VALUES (?, ?, ?, ?, ?, ?)`),
      alias: db.prepare(`
        INSERT INTO intrusion_set_aliases (stix_id, version, matrix_type, alias_name) VALUES (?, ?, ?, ?)`),
    },
    malware: {
      malware: db.prepare(`
        INSERT INTO malware (
          stix_id, version, matrix_type, external_id, name, 
          description
        ) VALUES (?, ?, ?, ?, ?, ?)`),
      alias: db.prepare(`
        INSERT INTO malware_aliases (stix_id, version, matrix_type, alias_name) VALUES (?, ?, ?, ?)`),
      platform: db.prepare(`
        INSERT INTO malware_platforms (stix_id, version, matrix_type, platform_name) VALUES (?, ?, ?, ?)`),
    },
  };

  db.exec("BEGIN");

  try {
    for (const item of data.objects) {
      handleItem(item, statements, version, matrix);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
};
