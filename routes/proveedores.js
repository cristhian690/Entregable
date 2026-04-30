const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM proveedores WHERE activo = 1 ORDER BY id_proveedor DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM proveedores WHERE id_proveedor = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, ruc, telefono, email, direccion, contacto } = req.body;
    const [result] = await pool.query(
      'INSERT INTO proveedores (nombre, ruc, telefono, email, direccion, contacto) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, ruc, telefono, email, direccion, contacto]
    );
    res.json({ success: true, message: 'Proveedor creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, ruc, telefono, email, direccion, contacto, activo } = req.body;
    await pool.query(
      'UPDATE proveedores SET nombre=?, ruc=?, telefono=?, email=?, direccion=?, contacto=?, activo=? WHERE id_proveedor=?',
      [nombre, ruc, telefono, email, direccion, contacto, activo, req.params.id]
    );
    res.json({ success: true, message: 'Actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE proveedores SET activo = 0 WHERE id_proveedor = ?', [req.params.id]);
    res.json({ success: true, message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;