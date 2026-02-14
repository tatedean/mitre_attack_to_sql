import { StatementsA } from "../db.seed.js";

export const process_detection_strategy_table = (
  item: any,
  version: string,
  matrix: string,
  stmt: StatementsA,
  externalId: string,
) => {
  stmt.detection_strategy.detection_strategy.run({
    ":stix_id": item.id,
    ":version": version,
    ":matrix_type": matrix,
    ":external_id": externalId,
    ":name": item.name,
  });

  if (item.x_mitre_analytic_refs) {
    for (const analytic_ref of item.x_mitre_analytic_refs) {
      stmt.detection_strategy.analytic.run({
        ":stix_id": item.id,
        ":version": version,
        ":matrix_type": matrix,
        ":analytic_id": analytic_ref,
      });
    }
  }
};
