import { Router } from "express";
import db from "../db/db.js";

const routerPlatforms = Router();

routerPlatforms.get("/", (req, res) => {
  const { matrix = "enterprise-attack", version = null } = req.query;

  const sql = `
    WITH target_v AS (
      -- Determine the latest version for the specific matrix
      SELECT COALESCE(:version, MAX(version)) as val 
      FROM techniques 
      WHERE matrix_type = :matrix
    )
    SELECT DISTINCT platform_name FROM (
      SELECT tp.platform_name 
      FROM technique_platforms tp
      JOIN techniques t ON tp.stix_id = t.stix_id AND tp.version = t.version
      CROSS JOIN target_v
      WHERE t.matrix_type = :matrix AND t.version = target_v.val

      UNION

      SELECT sp.platform_name 
      FROM malware_platforms sp
      JOIN malware m ON sp.stix_id = m.stix_id AND sp.version = m.version
      CROSS JOIN target_v
      WHERE m.matrix_type = :matrix AND m.version = target_v.val
    )
    ORDER BY platform_name ASC
  `;

  try {
    const rows = db.prepare(sql).all({ matrix, version }) as { platform_name: string }[];
    
    // Check if the array is empty
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: "No platforms found for this matrix/version",
        matrix,
        version: version || "latest"
      });
    }

    // Flatten to a simple string array: ["Windows", "Linux", etc.]
    const platforms = rows.map(row => row.platform_name);
    res.json(platforms);

  } catch (err) {
    res.status(500).json({ error: "Query failed", message: err.message });
  }
});

routerPlatforms.get("/:platform_name", (req, res) => {
  const { platform_name } = req.params;
  const { matrix = "enterprise-attack", version = null } = req.query;

  const sql = `
    WITH target_v AS (
      -- We calculate the latest version for this matrix once
      -- We can check 'techniques' as the source of truth for the matrix version
      SELECT COALESCE(:version, MAX(version)) as val 
      FROM techniques 
      WHERE matrix_type = :matrix
    )
    -- Get all Techniques for this platform
    SELECT 
        'technique' as type,
        t.external_id,
        t.name
    FROM techniques t
    JOIN target_v tv ON t.version = tv.val
    JOIN technique_platforms tp ON t.stix_id = tp.stix_id 
        AND t.version = tp.version
    WHERE tp.platform_name = :platform_name COLLATE NOCASE
      AND t.matrix_type = :matrix

    UNION ALL

    -- Get all Malware for this platform
    SELECT 
        'malware' as type,
        m.external_id,
        m.name
    FROM malware m
    JOIN target_v tv ON m.version = tv.val
    JOIN malware_platforms sp ON m.stix_id = sp.stix_id 
        AND m.version = sp.version
    WHERE sp.platform_name = :platform_name COLLATE NOCASE
      AND m.matrix_type = :matrix
    
    ORDER BY type DESC, name ASC;
  `;

  try {
    const results = db.prepare(sql).all({ matrix, platform_name, version });

    if (results.length === 0) {
      return res.status(404).json({ 
        error: "No entries found for this platform", 
        platform: platform_name,
        matrix,
        version: version || "latest"
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Query failed", message: err.message });
  }
});

export default routerPlatforms;
