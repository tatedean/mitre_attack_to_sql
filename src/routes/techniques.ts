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
          WHERE pa.stix_id = t.stix_id AND pa.version = t.version AND pa.matrix_type = :matrix) as phases,

          -- 1. Groups ==
          (SELECT JSON_GROUP_ARRAY(
              JSON_OBJECT(
                'id', i.external_id, 
                'name', i.name,
                'desc', IFNULL(r.description, '')
              )
            )
          FROM relationships r 
          JOIN intrusion_set i ON r.source_ref = i.stix_id AND r.version = i.version AND r.matrix_type = :matrix
          WHERE r.target_ref = t.stix_id 
          AND r.relationship_type = 'uses' 
          AND r.version = t.version
          AND i.matrix_type = :matrix) as intrusion_sets,

          -- 2. Software (Scoped to this matrix)
          (SELECT JSON_GROUP_ARRAY(
              JSON_OBJECT(
                'id', m.external_id, 
                'name', m.name,
                'desc', IFNULL(r.description, '')
              )
            )
          FROM relationships r
          JOIN malware m ON r.source_ref = m.stix_id AND r.version = m.version AND r.matrix_type = :matrix
          WHERE r.target_ref = t.stix_id 
          AND r.relationship_type = 'uses' 
          AND r.version = t.version
          AND m.matrix_type = :matrix) as software,
          
          -- 3. Campaign (Campaign -> attributed-to -> Intrusion Set)
          (SELECT JSON_GROUP_ARRAY(
              JSON_OBJECT(
                'id', c.external_id, 
                'name', c.name,
                'desc', IFNULL(r.description, '')
              )
            )
          FROM relationships r 
          JOIN campaigns c ON r.source_ref = c.stix_id AND r.version = c.version AND r.matrix_type = :matrix
          WHERE r.target_ref = t.stix_id 
          AND r.relationship_type = 'uses' 
          AND r.version = t.version
          AND c.matrix_type = :matrix) as campaigns,

          -- 3. Mitigations
          (SELECT JSON_GROUP_ARRAY(
              JSON_OBJECT(
                'id', m.external_id, 
                'name', m.name,
                'desc', IFNULL(r.description, '')
              )
            )
          FROM relationships r 
          JOIN mitigations m ON r.source_ref = m.stix_id AND r.version = m.version AND r.matrix_type = :matrix
          WHERE r.target_ref = t.stix_id 
          AND r.relationship_type = 'mitigates' 
          AND r.version = t.version
          AND m.matrix_type = :matrix) as mitigations

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
      software: JSON.parse(technique.software || []),
      campaigns: JSON.parse(technique.campaigns || []),
      mitigations: JSON.parse(technique.mitigations || []),
      intrusion_sets: JSON.parse(technique.intrusion_sets || []),
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

export default routerAttack;
