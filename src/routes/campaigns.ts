import { Router } from "express";
import db from "../db/db.js";

const routerCampaigns = Router();

routerCampaigns.get("/", (req, res) => {
  const { matrix = "enterprise-attack", version = null } = req.query;

  const sql = `
    WITH target_v AS (
      SELECT COALESCE(:version, MAX(version)) as val 
      FROM campaigns 
      WHERE matrix_type = :matrix
    )
    SELECT 
      c.external_id, 
      c.name,
      c.last_seen
    FROM campaigns c
    JOIN target_v tv ON c.version = tv.val
    WHERE c.matrix_type = :matrix
    ORDER BY c.name ASC
  `;

  try {
    const rows = db.prepare(sql).all({ matrix, version }) as any[];

    // If you want to throw an error when no campaigns are found for that matrix/version
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: "No campaigns found", 
        matrix, 
        version: version || "latest" 
      });
    }

    // Hydrate the JSON strings into real JS arrays

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Query failed", message: (err as Error).message });
  }
});

routerCampaigns.get("/:id", (req, res) => {
  const { id } = req.params;
  const matrix = req.query.matrix || "enterprise-attack";
  const targetVersion = req.query.version || null;

  const sql = `
    WITH target_v AS (
      SELECT COALESCE(:targetVersion, MAX(version)) as val 
      FROM campaigns 
      WHERE matrix_type = :matrix
    )
    SELECT 
      c.*,
      -- 1. Aliases (Matrix scoped)
      (SELECT JSON_GROUP_ARRAY(alias_name) FROM campaign_aliases ca 
       WHERE ca.stix_id = c.stix_id AND ca.version = c.version AND ca.matrix_type = :matrix) as aliases,
      
      -- 2. Techniques (Software -> uses -> Technique)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', t.external_id, 
            'name', t.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN techniques t ON r.target_ref = t.stix_id AND r.version = t.version AND r.matrix_type = :matrix
       WHERE r.source_ref = c.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = c.version
       AND t.matrix_type = :matrix) as techniques,

      -- 3. Intrustion Set (Campaign -> attributed-to -> Intrusion Set)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', i.external_id, 
            'name', i.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN intrusion_set i ON r.target_ref = i.stix_id AND r.version = i.version AND r.matrix_type = :matrix
       WHERE r.source_ref = c.stix_id 
       AND r.relationship_type = 'attributed-to' 
       AND r.version = c.version
       AND i.matrix_type = :matrix) as intrusion_sets,

      -- 4. Software (Campaign -> uses -> Malware/Tool)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', m.external_id, 
            'name', m.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN malware m ON r.target_ref = m.stix_id AND r.version = m.version AND r.matrix_type = :matrix
       WHERE r.source_ref = c.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = c.version
       AND m.matrix_type = :matrix) as software

    FROM campaigns c
    JOIN target_v tv ON c.version = tv.val
    WHERE c.external_id = :id 
      AND c.matrix_type = :matrix
  `;

  try {
    const row = db.prepare(sql).get({ id, matrix, targetVersion }) as any;

    if (!row) {
      return res.status(404).json({ 
        error: "Campaign not found", 
        id, 
        matrix, 
        version: targetVersion || "latest" 
      });
    }

    // Hydrating the results
    const response = {
      ...row,
      aliases: JSON.parse(row.aliases || "[]"),
      techniques: JSON.parse(row.techniques || "[]"),
      intrusion_sets: JSON.parse(row.intrusion_sets || "[]"),
      software: JSON.parse(row.software || "[]"),
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Database query failed", message: err.message });
  }
});

export default routerCampaigns;
