const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET todos los empleados activos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM empleados WHERE deleted_at IS NULL ORDER BY id_emp DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener empleados', error: err.message });
  }
});

// GET un empleado por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM empleados WHERE id_emp = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST crear empleado
router.post('/', async (req, res) => {
  try {
    const { nombre, cargo, area, turno } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es requerido' });

    const [result] = await pool.query(
      'INSERT INTO empleados (nombre, cargo, area, turno) VALUES (?, ?, ?, ?)',
      [nombre, cargo || null, area || null, turno || null]
    );
    res.json({ success: true, message: 'Empleado creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT actualizar empleado
router.put('/:id', async (req, res) => {
  try {
    const { nombre, cargo, area, turno } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es requerido' });

    const [result] = await pool.query(
      'UPDATE empleados SET nombre=?, cargo=?, area=?, turno=? WHERE id_emp=? AND deleted_at IS NULL',
      [nombre, cargo || null, area || null, turno || null, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    res.json({ success: true, message: 'Empleado actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE empleado (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE empleados SET deleted_at = NOW() WHERE id_emp = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    res.json({ success: true, message: 'Empleado eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;