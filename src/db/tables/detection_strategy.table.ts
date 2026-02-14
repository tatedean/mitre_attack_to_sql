import db from "../db.js";

export const detectionStrategyTable = () => {
  // Main Strategy Table
  db.exec(`
      CREATE TABLE IF NOT EXISTS detection_strategy (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      external_id TEXT,
      name TEXT,
      PRIMARY KEY (stix_id, version, matrix_type)
      );
      CREATE INDEX IF NOT EXISTS idx_det_strat_external ON detection_strategy (external_id);
  `);

  // Analytics mapping table
  db.exec(`
      CREATE TABLE IF NOT EXISTS detection_strategy_analytic (
      stix_id TEXT,
      version TEXT,
      matrix_type TEXT,
      analytic_id TEXT,
      PRIMARY KEY (stix_id, version, matrix_type, analytic_id)
      );

      CREATE INDEX IF NOT EXISTS idx_ds_analytic_lookup 
      ON detection_strategy_analytic (stix_id, version, matrix_type);

      CREATE INDEX IF NOT EXISTS idx_ds_analytic_id_lookup 
      ON detection_strategy_analytic (analytic_id, version, matrix_type);
  `);
};