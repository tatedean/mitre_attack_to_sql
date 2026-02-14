import { StatementsA } from "../db.seed.js";

export const process_attack_pattern = (
  item: any,
  version: string,
  matrix: string,
  stmt: StatementsA,
  externalId: string,
) => {
  // stix_id, external_id, name, is_subtechnique, description, matrix_type, version
  stmt["attack-pattern"].technique.run({
    ":stix_id": item.id,
    ":external_id": externalId,
    ":name": item.name,
    ":is_subtechnique": item.x_mitre_is_subtechnique ? 1 : 0,
    ":description": item.description,
    ":matrix_type": matrix,
    ":version": version,
  });

  if (item.kill_chain_phases) {
    for (const phase of item.kill_chain_phases) {
      stmt["attack-pattern"].phase.run(
        item.id,
        version,
        matrix,
        phase.phase_name,
      );
    }
  }

  // Handle sub-tables (platforms)
  if (item.x_mitre_platforms) {
    for (const p of item.x_mitre_platforms) {
      stmt["attack-pattern"].platform.run(item.id, version, matrix, p);
    }
  }
};
