import { Router } from "express";
import db from "../db/db.js";
import { Technique } from "../types/db.types.js";

const routerAttack = Router();

routerAttack.get("/:id", (req, res) => {
  const stmt = db.prepare("SELECT * FROM techniques WHERE external_id = ?");

  // Cast the result to your Interface for autocomplete/safety
  const technique = stmt.get(req.params.id) as Technique | undefined;

  if (!technique) {
    return res.status(404).json({ error: "Technique not found" });
  }

  res.json(technique);
});

routerAttack.get("/", (req, res) => {
  const { matrix, version } = req.query;

  // 1. Basic validation
  if (!matrix) {
    return res
      .status(400)
      .json({ error: "matrix_type (enterprise, mobile, ics) is required" });
  }

  // 2. Prepare the query
  // We use a LEFT JOIN to get the platforms associated with the techniques
  const sql = `
    SELECT 
      t.*, 
      GROUP_CONCAT(DISTINCT p.platform_name) as platforms,
      GROUP_CONCAT(DISTINCT v.phase_name) as phases
    FROM techniques t
    LEFT JOIN technique_platforms p 
      ON t.stix_id = p.stix_id 
      AND t.version = p.version 
      AND t.matrix_type = p.matrix_type
    LEFT JOIN technique_phases v 
      ON t.stix_id = v.stix_id 
      AND t.version = v.version 
      AND t.matrix_type = v.matrix_type
    WHERE t.matrix_type = ? AND t.version = ?
    GROUP BY t.stix_id, t.version, t.matrix_type
  `;

  try {
    const stmt = db.prepare(sql);
    const results = stmt.all(matrix, version || "18.1"); // Default version if missing

    // 3. Clean up the GROUP_CONCAT result back into an array
    const formattedResults = results.map((row: any) => ({
      ...row,
      platforms: row.platforms ? row.platforms.split(",") : [],
      phases: row.phases ? row.phases.split(",") : [],
    }));

    res.json(formattedResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

routerAttack.get("/:id/mitigations", (req, res) => {
  const { id } = req.params;
  const matrix = req.query.matrix || "enterprise-attack";
  const targetVersion = req.query.version || null; // Pass null if empty

  const sql = `
    WITH target_version AS (
      SELECT COALESCE(:targetVersion, MAX(version)) as val 
      FROM techniques 
      WHERE matrix_type = :matrix
    )
    SELECT 
      m.external_id as mitigation_id,
      m.name as name,
      m.description as description,
      r.description as details,
      m.version as version
    FROM techniques t
    JOIN relationships r ON t.stix_id = r.target_ref
      AND r.version = t.version
    JOIN mitigations m ON r.source_ref = m.stix_id
      AND m.version = r.version
    CROSS JOIN target_version
    WHERE t.external_id = :id
      AND r.relationship_type = 'mitigates'
      AND t.matrix_type = :matrix
      AND t.version = target_version.val
      AND m.matrix_type = t.matrix_type 
      AND m.version = t.version
  `;

  try {
    // Parameter order: 1. version, 2. matrix, 3. id, 4. matrix
    const results = db.prepare(sql).all({ targetVersion, matrix, id });
    res.json({
      technique_id: id,
      mitigations: results,
      matrix_type: matrix,
      input_version: targetVersion,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default routerAttack;
