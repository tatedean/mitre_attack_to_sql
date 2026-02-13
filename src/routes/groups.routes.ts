import { Router } from "express";
import db from "../db/db.js";

const routerGroups = Router();

routerGroups.get("/:id", (req, res) => {
  const { id } = req.params; // e.g., /ics-attack/S0604
  const version = req.query.version || null;
  const matrix = req.query.matrix || 'enterprise-attack';

  const sql = `
    WITH target_v AS (
      SELECT COALESCE(:version, MAX(version)) as val 
      FROM techniques
      WHERE matrix_type = :matrix
    )
    SELECT 
      g.*,
      -- 1. Aliases (Scoped to this matrix/version)
      (SELECT JSON_GROUP_ARRAY(alias_name) FROM intrusion_set_aliases sa 
       WHERE sa.stix_id = g.stix_id AND sa.version = g.version AND sa.matrix_type = :matrix) as aliases,

      -- 2. Techniques (Scoped to this matrix)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', t.external_id, 
            'name', t.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN techniques t ON r.target_ref = t.stix_id AND r.version = t.version AND r.matrix_type = :matrix
       WHERE r.source_ref = g.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = g.version
       AND t.matrix_type = :matrix) as techniques,

      -- 3. Software (Scoped to this matrix)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', m.external_id, 
            'name', m.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r
       JOIN malware m ON r.target_ref = m.stix_id AND r.version = m.version AND r.matrix_type = :matrix
       WHERE r.source_ref = g.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = g.version
       AND m.matrix_type = :matrix) as software,

      -- 4. Campaign (Campaign -> attributed-to -> Intrusion Set)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', c.external_id, 
            'name', c.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN campaigns c ON r.source_ref = c.stix_id AND r.version = c.version AND r.matrix_type = :matrix
       WHERE r.target_ref = g.stix_id 
       AND r.relationship_type = 'attributed-to' 
       AND r.version = g.version
       AND c.matrix_type = :matrix) as campaigns

    FROM intrusion_set g
    JOIN target_v ON g.version = target_v.val
    WHERE g.external_id = :id
      AND g.matrix_type = :matrix
  `;

  try {
    const row = db.prepare(sql).get({ id, matrix, version }) as any;

    if (!row) {
      return res.status(404).json({ error: "Software not found", matrix, id });
    }

    res.json({
      ...row,
      aliases: JSON.parse(row.aliases || "[]"),
      techniques: JSON.parse(row.techniques || "[]"),
      software: JSON.parse(row.software || "[]"),
      campaigns: JSON.parse(row.campaigns || "[]")
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


routerGroups.get("/", (req, res) => {
  // Defaulting to enterprise-attack if no matrix is provided
  const matrix = req.query.matrix || "enterprise-attack";
  const version = req.query.version || null;

  const sql = `
    WITH target_v AS (
      SELECT COALESCE(:version, MAX(version)) as val 
      FROM malware 
      WHERE matrix_type = :matrix
    )
    SELECT 
      g.name, 
      g.external_id
    FROM intrusion_set g
    JOIN target_v ON g.version = target_v.val
    WHERE g.matrix_type = :matrix
    ORDER BY g.name ASC
  `;

  try {
    const rows = db.prepare(sql).all({ matrix, version }) as any[];

    // .all() returns an array, so we check .length
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: "No software found", 
        matrix, 
        version: version || "latest" 
      });
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Query failed", message: err.message });
  }
});

export default routerGroups;
