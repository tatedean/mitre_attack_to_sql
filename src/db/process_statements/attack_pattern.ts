import { StatementsA } from "../db.seed.js";

export const process_attack_pattern = (
  item: any,
  version: string,
  matrix: string,
  stmt: StatementsA,
  externalId: string,
) => {
  // stix_id, external_id, name, is_subtechnique, description, matrix_type, version
  stmt["attack-pattern"].technique.run(
    item.id,
    externalId,
    item.name,
    item.is_subtechnique ? 1 : 0,
    item.description,
    matrix,
    version,
  );

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
