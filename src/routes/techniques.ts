import { Router } from "express";
import db from "../db/db.js";
import { Technique } from "../types/db.types.js";

const routerAttack = Router();

routerAttack.get("/:id", (req, res) => {
  const { id } = req.params;
  const matrix = req.query.matrix || "enterprise-attack";
  const targetVersion = req.query.version || null;

  try {
    const sql = `
      WITH target_version AS (
        SELECT COALESCE(:targetVersion, MAX(version)) as val 
        FROM techniques 
        WHERE matrix_type = :matrix
      )
      SELECT 
        t.*, 
          (SELECT JSON_GROUP_ARRAY(platform_name) FROM technique_platforms pl 
          WHERE pl.stix_id = t.stix_id AND pl.version = t.version AND pl.matrix_type = :matrix) as platforms,

          (SELECT JSON_GROUP_ARRAY(phase_name) FROM technique_phases pa 
          WHERE pa.stix_id = t.stix_id AND pa.version = t.version AND pa.matrix_type = :matrix) as phases

      FROM techniques t
      CROSS JOIN target_version
      WHERE t.matrix_type = :matrix AND t.version = target_version.val AND external_id = :external_id
    `;

    const stmt = db.prepare(sql);

    // Cast the result to your Interface for autocomplete/safety
    const technique = stmt.get({ external_id: id, matrix, targetVersion }) as
      | Technique
      | undefined;

    if (!technique) {
      return res.status(404).json({ error: "Technique not found" });
    }

    res.json({
      ...technique,
      platforms: JSON.parse(technique.platforms || []),
      phases: JSON.parse(technique.phases || []),
    });
  } catch (err) {
    // This catches SQL syntax errors or DB crashes
    res
      .status(500)
      .json({ error: "Database query failed", message: err.message });
  }
});

routerAttack.get("/", (req, res) => {
  const matrix = req.query.matrix || "enterprise-attack";
  const targetVersion = req.query.version || null;

  // 2. Prepare the query
  // We use a LEFT JOIN to get the platforms associated with the techniques
  const sql = `
    WITH target_version AS (
      SELECT COALESCE(:targetVersion, MAX(version)) as val 
      FROM techniques 
      WHERE matrix_type = :matrix
    )
    SELECT 
      t.name, t.external_id

    FROM techniques t
      CROSS JOIN target_version
      WHERE t.matrix_type = :matrix AND t.version = target_version.val
  `;

  try {
    const stmt = db.prepare(sql);
    const results = stmt.all({ matrix, targetVersion }); // Default version if missing

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

routerAttack.get("/:id/mitigations", (req, res) => {
  const { id } = req.params;
  const matrix = req.query.matrix || "enterprise-attack";
  const targetVersion = req.query.version || null;

  const sql = `
    WITH target_version AS (
      SELECT COALESCE(:targetVersion, MAX(version)) as val 
      FROM techniques 
      WHERE matrix_type = :matrix
    )
    SELECT DISTINCT
      m.external_id as mitigation_id,
      m.name as name,
      m.description as description,
      r.description as details,
      m.version as version
    FROM techniques t
    CROSS JOIN target_version
    JOIN relationships r ON t.stix_id = r.target_ref
      AND r.version = t.version
      -- Prevent matrix clashing by ensuring relationship belongs to this matrix
      AND r.matrix_type = t.matrix_type 
    JOIN mitigations m ON r.source_ref = m.stix_id
      AND m.version = r.version
      AND m.matrix_type = r.matrix_type
    WHERE t.external_id = :id
      AND r.relationship_type = 'mitigates'
      AND t.matrix_type = :matrix
      AND t.version = target_version.val
  `;

  try {
    const results = db.prepare(sql).all({ targetVersion, matrix, id });

    // Handle No Results (Throwing a 404 error)
    if (!results || results.length === 0) {
      return res.status(404).json({
        error: "No mitigations found",
        details: `Technique ${id} either does not exist in ${matrix} or has no mitigations for version ${targetVersion || "latest"}`,
      });
    }

    res.json({
      technique_id: id,
      matrix_type: matrix,
      version: results[0].version, // Return the version actually found
      mitigations: results,
    });
  } catch (err) {
    // This catches SQL syntax errors or DB crashes
    res
      .status(500)
      .json({ error: "Database query failed", message: err.message });
  }
});

export default routerAttack;
