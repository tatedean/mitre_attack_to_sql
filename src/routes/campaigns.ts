import { Router } from "express";
import db from "../db/db.js";

const routerCampaigns = Router();

routerCampaigns.get("/", (req, res) => {
  const { matrix = "ics-attack", version = "18.1" } = req.query;

  const sql = `
    SELECT 
      c.external_id, 
      c.name, 
      GROUP_CONCAT(DISTINCT a.alias_name) as aliases
    FROM campaigns c
    LEFT JOIN campaign_aliases a 
      ON c.stix_id = a.stix_id 
      AND c.version = a.version 
      AND c.matrix_type = a.matrix_type
    WHERE c.matrix_type = ? AND c.version = ?
    GROUP BY c.stix_id, c.version, c.matrix_type
    ORDER BY c.name ASC
  `;

  try {
    const rows = db.prepare(sql).all(matrix, version) as any[];

    // Transform comma-separated alias strings into clean JS arrays
    const formatted = rows.map((row) => ({
      ...row,
      aliases: row.aliases ? row.aliases.split(",") : [],
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

routerCampaigns.get("/:id", (req, res) => {
  const { id } = req.params; // e.g., C0028
  const { matrix = "ics-attack", version = "18.1" } = req.query;

const sql = `
    SELECT 
      c.*,
      -- Aliases as a simple JSON array
      (SELECT JSON_GROUP_ARRAY(alias_name) FROM campaign_aliases ca 
       WHERE ca.stix_id = c.stix_id AND ca.version = c.version) as aliases,
      
      -- Get Technique Data (Mapping STIX ID to External ID)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', t.external_id, 
            'stix_id', t.stix_id,
            'name', t.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN techniques t ON r.target_ref = t.stix_id AND r.version = t.version
       WHERE r.source_ref = c.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = c.version) as techniques,

      -- Get Attribution Data (Mapping STIX ID to Actor External ID)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', m.external_id, 
            'name', m.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN intrusion_set m ON r.target_ref = m.stix_id AND r.version = m.version
       WHERE r.source_ref = c.stix_id 
       AND r.relationship_type = 'attributed-to' 
       AND r.version = c.version) as attribution,

       -- Get Malware/Tool Data (Mapping STIX ID to Actor External ID)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', m.external_id, 
            'name', m.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN malware m ON r.target_ref = m.stix_id AND r.version = m.version
       WHERE r.source_ref = c.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = c.version) as software

    FROM campaigns c
    WHERE c.external_id = ? 
      AND c.matrix_type = ? 
      AND c.version = ?
  `;

  try {
    const row = db.prepare(sql).get(id, matrix, version) as any;

    if (!row) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // "Hydrating" the comma-separated strings back into clean arrays
    const response = {
      ...row,
      aliases: JSON.parse(row.aliases || []),
      techniques: JSON.parse(row.techniques || []),
      attribution: JSON.parse(row.attribution || []),
      software: JSON.parse(row.software || []),
      revoked: !!row.revoked,
      x_mitre_deprecated: !!row.x_mitre_deprecated,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default routerCampaigns;
