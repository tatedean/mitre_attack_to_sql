import { Router } from "express";
import db from "../db/db.js";
import { Technique } from "../types/db.types.js";

const routerAttack = Router();

routerAttack.get("/techniques/:id", (req, res) => {
  const stmt = db.prepare("SELECT * FROM techniques WHERE external_id = ?");

  // Cast the result to your Interface for autocomplete/safety
  const technique = stmt.get(req.params.id) as Technique | undefined;

  if (!technique) {
    return res.status(404).json({ error: "Technique not found" });
  }

  res.json(technique);
});

routerAttack.get("/platforms/:platform_id", (req, res) => {
  const platform_id = req.params.platform_id as string;
  //   const cleaned = stringUtils.toTitleCase(platform_id)

  const query = `
    SELECT t.name, t.external_id 
    FROM techniques t
    JOIN technique_platforms p ON t.stix_id = p.technique_id
    WHERE p.platform_name = '${platform_id}'
  `;

  const results = db.prepare(query).all();
  res.json(results);
});

routerAttack.get("/techniques", (req, res) => {
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

routerAttack.get("/techniques/:id/mitigations", (req, res) => {
  const { id } = req.params; // e.g., T1059
  const { matrix, version } = req.query;

  const sql = `
    SELECT 
      -- m.stix_id as mitigation_stix_id,
      m.external_id as mitigation_id,
      m.name as name,
      m.description as description,
      r.description as details
    FROM techniques t
    JOIN relationships r ON t.stix_id = r.target_ref
    JOIN mitigations m ON r.source_ref = m.stix_id
    WHERE t.external_id = ? 
      AND r.relationship_type = 'mitigates'
      AND t.matrix_type = ? 
      AND t.version = ?
      AND m.matrix_type = t.matrix_type -- Ensure we stay in the same matrix
      AND m.version = t.version
  `;

  try {
    const results = db
      .prepare(sql)
      .all(id, matrix || "ics-attack", version || "18.1");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default routerAttack;
