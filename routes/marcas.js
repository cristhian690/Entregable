const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_marca, nombre FROM marcas WHERE deleted_at IS NULL ORDER BY id_marca'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
