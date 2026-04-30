const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM encargados WHERE deleted_at IS NULL ORDER BY id_encargado DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener encargados', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM encargados WHERE id_encargado = ? AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, cargo, area, turno } = req.body;
    const [result] = await pool.query(
      'INSERT INTO encargados (nombre, cargo, area, turno) VALUES (?, ?, ?, ?)',
      [nombre, cargo, area, turno]
    );
    res.json({ success: true, message: 'Encargado creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, cargo, area, turno, activo } = req.body;
    await pool.query(
      'UPDATE encargados SET nombre=?, cargo=?, area=?, turno=?, activo=? WHERE id_encargado=?',
      [nombre, cargo, area, turno, activo, req.params.id]
    );
    res.json({ success: true, message: 'Actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE encargados SET deleted_at = NOW() WHERE id_encargado = ?', [req.params.id]);
    res.json({ success: true, message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;