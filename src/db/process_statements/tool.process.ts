import { StatementsA } from "../db.seed.js";

export const process_tool_table = (
  item: any,
  version: string,
  matrix: string,
  stmt: StatementsA,
  externalId: string,
) => {
  stmt.tool.tool.run({
    ":stix_id": item.id,
    ":version": version,
    ":matrix_type": matrix,
    ":external_id": externalId,
    ":name": item.name,
    ":description": item.description || "",
  });

  if (item.x_mitre_aliases) {
    for (const alias of item.x_mitre_aliases) {
      stmt.tool.alias.run({
        ":stix_id": item.id,
        ":version": version,
        ":matrix_type": matrix,
        ":alias_name": alias,
      });
    }
  }

  if (item.x_mitre_platforms) {
    for (const platform_name of item.x_mitre_platforms) {
      stmt.tool.platform.run({
        ":stix_id": item.id,
        ":version": version,
        ":matrix_type": matrix,
        ":platform_name": platform_name,
      });
    }
  }
};