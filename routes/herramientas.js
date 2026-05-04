const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET todas las herramientas con su marca
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, m.nombre AS nombre_marca
      FROM herramientas h
      LEFT JOIN marcas m ON h.id_marca = m.id_marca
      WHERE h.deleted_at IS NULL
      ORDER BY h.codigo_herra
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener herramientas', error: err.message });
  }
});

// GET una herramienta por código
router.get('/:codigo', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, m.nombre AS nombre_marca
       FROM herramientas h
       LEFT JOIN marcas m ON h.id_marca = m.id_marca
       WHERE h.codigo_herra = ? AND h.deleted_at IS NULL`,
      [req.params.codigo]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST crear herramienta
router.post('/', async (req, res) => {
  try {
    const {
      codigo_herra, id_marca, nombre, tipo,
      num_serie, estado, ubicacion,
      cantidad, stock_minimo, descripcion
    } = req.body;

    if (!codigo_herra) return res.status(400).json({ success: false, message: 'El código es requerido' });
    if (!nombre)       return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    if (!id_marca)     return res.status(400).json({ success: false, message: 'La marca es requerida' });

    await pool.query(
      `INSERT INTO herramientas
        (codigo_herra, id_marca, nombre, tipo, num_serie, estado, ubicacion, cantidad, stock_minimo, descripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo_herra, id_marca, nombre, tipo || null, num_serie || null,
       estado || 'bueno', ubicacion || null, cantidad || 0, stock_minimo || 1, descripcion || null]
    );
    res.json({ success: true, message: 'Herramienta creada' });
  } catch (err) {
    // Código duplicado
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, message: 'El código ya existe' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT actualizar herramienta
router.put('/:codigo', async (req, res) => {
  try {
    const {
      id_marca, nombre, tipo, num_serie,
      estado, ubicacion, cantidad, stock_minimo, descripcion
    } = req.body;

    const [result] = await pool.query(
      `UPDATE herramientas
       SET id_marca=?, nombre=?, tipo=?, num_serie=?,
           estado=?, ubicacion=?, cantidad=?, stock_minimo=?, descripcion=?
       WHERE codigo_herra=? AND deleted_at IS NULL`,
      [id_marca, nombre, tipo || null, num_serie || null,
       estado, ubicacion || null, cantidad, stock_minimo,
       descripcion || null, req.params.codigo]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
    res.json({ success: true, message: 'Herramienta actualizada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE herramienta (soft delete)
router.delete('/:codigo', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE herramientas SET deleted_at = NOW() WHERE codigo_herra = ? AND deleted_at IS NULL',
      [req.params.codigo]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Herramienta no encontrada' });
    res.json({ success: true, message: 'Herramienta eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;