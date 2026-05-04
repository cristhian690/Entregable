const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET todos los encargados activos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM encargados WHERE deleted_at IS NULL ORDER BY id_encargado DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET un encargado por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM encargados WHERE id_encargado = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Encargado no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST crear encargado
router.post('/', async (req, res) => {
  try {
    const { nombre, cargo, area, turno } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es requerido' });

    const [result] = await pool.query(
      'INSERT INTO encargados (nombre, cargo, area, turno) VALUES (?, ?, ?, ?)',
      [nombre, cargo || null, area || null, turno || null]
    );
    res.json({ success: true, message: 'Encargado creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT actualizar encargado
router.put('/:id', async (req, res) => {
  try {
    const { nombre, cargo, area, turno } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es requerido' });

    const [result] = await pool.query(
      'UPDATE encargados SET nombre=?, cargo=?, area=?, turno=? WHERE id_encargado=? AND deleted_at IS NULL',
      [nombre, cargo || null, area || null, turno || null, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Encargado no encontrado' });
    res.json({ success: true, message: 'Encargado actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE encargado (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE encargados SET deleted_at = NOW() WHERE id_encargado = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Encargado no encontrado' });
    res.json({ success: true, message: 'Encargado eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;