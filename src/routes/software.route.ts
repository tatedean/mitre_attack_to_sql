import { Router } from "express";
import db from "../db/db.js";

const routerSoftware = Router();


routerSoftware.get("/:id", (req, res) => {
  const { id } = req.params; // e.g., S0604 (Industroyer)
  const { matrix = "ics-attack", version = "18.1" } = req.query;

  const sql = `
    SELECT 
      s.*,
      -- 1. Software Aliases
      (SELECT JSON_GROUP_ARRAY(alias_name) FROM malware_aliases sa 
       WHERE sa.stix_id = s.stix_id AND sa.version = s.version) as aliases,

      -- 2. Software Platforms
      (SELECT JSON_GROUP_ARRAY(platform_name) FROM malware_platforms sp 
       WHERE sp.stix_id = s.stix_id AND sp.version = s.version) as platforms,
      
      -- 3. Techniques used by this software (Software -> uses -> Technique)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', t.external_id, 
            'name', t.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN techniques t ON r.target_ref = t.stix_id AND r.version = t.version
       WHERE r.source_ref = s.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = s.version) as techniques,

      -- 4. Campaigns that used this software (Campaign -> uses -> Software)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', c.external_id, 
            'name', c.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN campaigns c ON r.source_ref = c.stix_id AND r.version = c.version
       WHERE r.target_ref = s.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = s.version) as campaigns,

      -- 5. Intrusion Sets (Groups) that use this software (Group -> uses -> Software)
      (SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', i.external_id, 
            'name', i.name,
            'desc', IFNULL(r.description, '')
          )
        )
       FROM relationships r 
       JOIN intrusion_set i ON r.source_ref = i.stix_id AND r.version = i.version
       WHERE r.target_ref = s.stix_id 
       AND r.relationship_type = 'uses' 
       AND r.version = s.version) as intrusion_set

    FROM malware s
    WHERE s.external_id = ? 
      AND s.matrix_type = ? 
      AND s.version = ?
  `;

  try {
    const row = db.prepare(sql).get(id, matrix, version) as any;

    if (!row) {
      return res.status(404).json({ error: "Software not found" });
    }

    // Use a helper or inline parse to hydrate the strings
    const response = {
      ...row,
      aliases: JSON.parse(row.aliases || "[]"),
      platforms: JSON.parse(row.platforms || "[]"),
      techniques: JSON.parse(row.techniques || "[]"),
      campaigns: JSON.parse(row.campaigns || "[]"),
      intrusion_set: JSON.parse(row.intrusion_set || "[]"),
      revoked: !!row.revoked,
      x_mitre_deprecated: !!row.x_mitre_deprecated,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default routerSoftware;