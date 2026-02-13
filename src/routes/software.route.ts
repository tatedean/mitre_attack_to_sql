import { Router } from "express";
import db from "../db/db.js";

const routerSoftware = Router();

routerSoftware.get("/:id", (req, res) => {
  const { id } = req.params; // e.g., /ics-attack/S0604
  const version = req.query.version || null;
  const matrix = req.query.matrix || 'enterprise-attack';

  const sql = `
    WITH target_v AS (
      SELECT COALESCE(:version, MAX(version)) as val 
      FROM malware 
      WHERE matrix_type = :matrix
    )
    SELECT 
      s.*,
      -- 1. Aliases (Scoped to this matrix/version)
      (SELECT JSON_GROUP_ARRAY(alias_name) FROM malware_aliases sa 
       WHERE sa.stix_id = s.stix_id AND sa.version = s.version AND sa.matrix_type = :matrix) as aliases,

      -- 2. Platforms (Scoped to this matrix/version)
      (SELECT JSON_GROUP_ARRAY(platform_name) FROM malware_platforms sp 
       WHERE sp.stix_id = s.stix_id AND sp.version = s.version AND sp.matrix_type = :matrix) as platforms,
      
      -- 3. Techniques (Scoped to this matrix)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', t.external_id, 
            'name', t.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN techniques t ON r.target_ref = t.stix_id AND r.version = t.version AND r.matrix_type = :matrix
       WHERE r.source_ref = s.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = s.version
       AND t.matrix_type = :matrix) as techniques,

      -- 4. Campaigns (Scoped to this matrix)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', c.external_id, 
            'name', c.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN campaigns c ON r.source_ref = c.stix_id AND r.version = c.version AND r.matrix_type = :matrix
       WHERE r.target_ref = s.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = s.version
       AND c.matrix_type = :matrix) as campaigns,

      -- 5. Intrusion Sets (Scoped to this matrix)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', i.external_id, 
            'name', i.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r
       JOIN intrusion_set i ON r.source_ref = i.stix_id AND r.version = i.version AND r.matrix_type = :matrix
       WHERE r.target_ref = s.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = s.version
       AND i.matrix_type = :matrix) as intrusion_sets

    FROM malware s
    JOIN target_v ON s.version = target_v.val
    WHERE s.external_id = :id
      AND s.matrix_type = :matrix
  `;

  try {
    const row = db.prepare(sql).get({ id, matrix, version }) as any;

    if (!row) {
      return res.status(404).json({ error: "Software not found", matrix, id });
    }

    res.json({
      ...row,
      aliases: JSON.parse(row.aliases || "[]"),
      platforms: JSON.parse(row.platforms || "[]"),
      techniques: JSON.parse(row.techniques || "[]"),
      campaigns: JSON.parse(row.campaigns || "[]"),
      intrusion_sets: JSON.parse(row.intrusion_sets || "[]")
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


routerSoftware.get("/", (req, res) => {
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
      s.name, 
      s.external_id
    FROM malware s
    JOIN target_v ON s.version = target_v.val
    WHERE s.matrix_type = :matrix
    ORDER BY s.name ASC
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

export default routerSoftware;
