const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET todas las alertas
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM alertas ORDER BY fecha DESC LIMIT 50');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT marcar alerta como leída
router.put('/:id/leer', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE alertas SET leida = 1 WHERE id_alerta = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    res.json({ success: true, message: 'Marcada como leída' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;