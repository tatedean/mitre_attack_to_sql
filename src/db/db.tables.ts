import db from "./db.js";
import { campaignsTable } from "./tables/campaigns.table.js";
import { intrusion_setTable } from "./tables/intrusion_set.table.js";
import { malwareTable } from "./tables/malware.table.js";
import { mitigationsTable } from "./tables/mitigations.table.js";
import { relationshipsTable } from "./tables/relationships.table.js";
import { tacticsTable } from "./tables/tactics.table.js";
import { techniqueTable } from "./tables/technique.table.js";

const clearTables = () => {
  db.exec(`
        DROP TABLE IF EXISTS tactics;

        DROP TABLE IF EXISTS techniques;
        DROP TABLE IF EXISTS technique_platforms;
        DROP TABLE IF EXISTS technique_phases;

        DROP TABLE IF EXISTS mitigations;
        
        DROP TABLE IF EXISTS relationships;

        DROP TABLE IF EXISTS campaigns;
        DROP TABLE IF EXISTS campaign_aliases;

        DROP TABLE IF EXISTS intrusion_set;
        DROP TABLE IF EXISTS intrusion_set_aliases;

        DROP TABLE IF EXISTS malware;
        DROP TABLE IF EXISTS malware_aliases;
        DROP TABLE IF EXISTS malware_platforms;
        `);
};

export const createAttackTables = () => {
  clearTables();
  tacticsTable();
  relationshipsTable();

  techniqueTable();
  mitigationsTable();
  campaignsTable();
  intrusion_setTable();
  malwareTable();
};
