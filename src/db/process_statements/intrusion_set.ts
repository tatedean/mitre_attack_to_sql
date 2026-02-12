import { StatementsA } from "../db.seed.js";

export const process_intrusion_set = (
  item: any,
  version: string,
  matrix: string,
  stmt: StatementsA,
  externalId: string,
) => {
  stmt.intrusion_set.intrusion_set.run(
    item.id,
    version,
    matrix,
    externalId,
    item.name,
    item.description || "",
    item.revoked ? 1 : 0,
    item.x_mitre_deprecated ? 1 : 0,
  );

  if (item.aliases) {
    for (const alias of item.aliases) {
      stmt.intrusion_set.alias.run(item.id, version, matrix, alias);
    }
  }
};
