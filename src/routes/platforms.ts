import { Router } from "express";
import db from "../db/db.js";

const routerPlatforms = Router();

routerPlatforms.get("/:platform_name", (req, res) => {
  const { platform_name } = req.params; // e.g., S0604 (Industroyer)
  const { matrix = "ics-attack", version = "18.1" } = req.query;

  const sql = `
    SELECT 
        'technique' as type,
        t.external_id,
        t.name
        -- t.version
    FROM techniques t
    JOIN technique_platforms tp ON t.stix_id = tp.stix_id 
        AND t.version = tp.version
    WHERE tp.platform_name = :platform_name COLLATE NOCASE
    AND t.matrix_type = :matrix

    UNION ALL

    -- Get all Malware for Windows
    SELECT 
        'malware' as type,
        m.external_id,
        m.name
        -- m.version
    FROM malware m
    JOIN malware_platforms sp ON m.stix_id = sp.stix_id 
        AND m.version = sp.version
    WHERE sp.platform_name = :platform_name COLLATE NOCASE
    AND m.matrix_type = :matrix;
  `;

  try {
    const result = db.prepare(sql).all({matrix, platform_name});

    if (!result) {
      return res.status(404).json({ error: "Platform not found" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default routerPlatforms;
