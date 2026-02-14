import { StatementsA } from "../db.seed.js";

export const process_tactics_order = (
  item: any,
  version: string,
  matrix: string,
  stmt: StatementsA,
) => {
  const tactic_ids = item.tactic_refs as string[];
  if (!tactic_ids) {
    throw new Error("Tactic array not found at 'x-mitre-matrix'");
  }

  for (const [i, tactic_id] of tactic_ids.entries()) {
    stmt["x-mitre-tactic"].run(tactic_id, "", version, matrix, "", "", i + 1);
  }
};
