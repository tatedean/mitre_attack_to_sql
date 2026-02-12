import { StatementsA } from "../db.seed.js";
import { process_attack_pattern } from "./attack_pattern.js";
import { process_campaigns } from "./campaigns.js";
import { process_intrusion_set } from "./intrusion_set.js";

export const handleItem = (
  item: any,
  stmt: StatementsA,
  version: string,
  matrix: string,
) => {
  const externalId = item.external_references?.[0]?.external_id || "N/A";

  switch (item.type) {
    case "attack-pattern":
      process_attack_pattern(item, version, matrix, stmt, externalId);
      break;

    case "campaign":
      process_campaigns(item, version, matrix, stmt, externalId);
      break;

     case "intrusion-set":
      process_intrusion_set(item, version, matrix, stmt, externalId);
      break;

    case "malware":
      process_malware_table(item, version, matrix, stmt, externalId);
      break;

    case "relationship":
      stmt.relationships.run(
        item.id,
        item.source_ref,
        item.target_ref,
        item.relationship_type,
        item?.description || "",
        version,
        matrix,
        item.revoked ? 1 : 0,
        item.x_mitre_deprecated ? 1 : 0,
      );
      break;

    case "course-of-action":
      stmt["course-of-action"].run(
        item.id,
        externalId,
        version,
        matrix,
        item.name,
        item.description,
        item?.revoked ? 1 : 0,
        item?.x_mitre_deprecated ? 1 : 0,
      );
      break;

    default:
      // Ignore other STIX types like 'relationship' or 'identity' for now
      break;
  }
};
