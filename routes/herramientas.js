const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener herramientas', error: err.message });
  }
});

router.get('/:codigo', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM herramientas WHERE codigo_herra = ? AND deleted_at IS NULL',
      [req.params.codigo]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'No encontrada' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { codigo_herra, id_marca, nombre, tipo, num_serie, estado, ubicacion, cantidad, stock_minimo, descripcion } = req.body;
    await pool.query(
      `INSERT INTO herramientas (codigo_herra, id_marca, nombre, tipo, num_serie, estado, ubicacion, cantidad, stock_minimo, descripcion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo_herra, id_marca, nombre, tipo, num_serie, estado || 'bueno', ubicacion, cantidad || 0, stock_minimo || 1, descripcion]
    );
    res.json({ success: true, message: 'Herramienta creada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:codigo', async (req, res) => {
  try {
    const { id_marca, nombre, tipo, num_serie, estado, ubicacion, cantidad, stock_minimo, descripcion } = req.body;
    await pool.query(
      `UPDATE herramientas SET id_marca=?, nombre=?, tipo=?, num_serie=?, estado=?, ubicacion=?, cantidad=?, stock_minimo=?, descripcion=? 
       WHERE codigo_herra=?`,
      [id_marca, nombre, tipo, num_serie, estado, ubicacion, cantidad, stock_minimo, descripcion, req.params.codigo]
    );
    res.json({ success: true, message: 'Herramienta actualizada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:codigo', async (req, res) => {
  try {
    await pool.query('UPDATE herramientas SET deleted_at = NOW() WHERE codigo_herra = ?', [req.params.codigo]);
    res.json({ success: true, message: 'Herramienta eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;