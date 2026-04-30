const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM alertas ORDER BY fecha DESC LIMIT 50');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id/leer', async (req, res) => {
  try {
    await pool.query('UPDATE alertas SET leida = 1 WHERE id_alerta = ?', [req.params.id]);
    res.json({ success: true, message: 'Marcada como leída' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;