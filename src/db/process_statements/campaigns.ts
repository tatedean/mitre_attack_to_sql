import { StatementsA } from "../db.seed.js";

export const process_campaigns = (
  item: any,
  version: string,
  matrix: string,
  stmt: StatementsA,
  externalId: string,
) => {
  stmt.campaigns.campaign.run(
    item.id,
    version,
    matrix,
    externalId,
    item.name,
    item.description || "",
    item.first_seen || null, // SQLite handles ISO date strings as TEXT perfectly
    item.last_seen || null,
    item.revoked ? 1 : 0,
    item.x_mitre_deprecated ? 1 : 0,
  );

  if (item.aliases) {
    for (const alias of item.aliases) {
      stmt.campaigns.alias.run(item.id, version, matrix, alias);
    }
  }
};
