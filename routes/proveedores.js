const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET todos los proveedores activos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM proveedores WHERE activo = 1 ORDER BY id_proveedor DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET un proveedor por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM proveedores WHERE id_proveedor = ? AND activo = 1',
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST crear proveedor
router.post('/', async (req, res) => {
  try {
    const { nombre, ruc, telefono, email, direccion, contacto } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    if (!ruc)    return res.status(400).json({ success: false, message: 'El RUC es requerido' });

    const [result] = await pool.query(
      'INSERT INTO proveedores (nombre, ruc, telefono, email, direccion, contacto) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, ruc, telefono || null, email || null, direccion || null, contacto || null]
    );
    res.json({ success: true, message: 'Proveedor creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT actualizar proveedor
router.put('/:id', async (req, res) => {
  try {
    const { nombre, ruc, telefono, email, direccion, contacto } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es requerido' });

    const [result] = await pool.query(
      `UPDATE proveedores
       SET nombre=?, ruc=?, telefono=?, email=?, direccion=?, contacto=?
       WHERE id_proveedor=? AND activo=1`,
      [nombre, ruc, telefono || null, email || null,
       direccion || null, contacto || null, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    res.json({ success: true, message: 'Proveedor actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE proveedor (soft delete con activo = 0)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE proveedores SET activo = 0 WHERE id_proveedor = ? AND activo = 1',
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    res.json({ success: true, message: 'Proveedor eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;