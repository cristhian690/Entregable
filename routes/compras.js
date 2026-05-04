const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET todas las compras
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
             p.nombre AS nombre_proveedor,
             e.nombre AS nombre_encargado
      FROM compras c
      LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      LEFT JOIN encargados  e ON c.id_encargado  = e.id_encargado
      ORDER BY c.fecha DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET una compra por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM compras WHERE id_compra = ?',
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST crear compra con transacción
// El trigger trg_entrada_compra sube el stock automáticamente
router.post('/', async (req, res) => {
  const { id_proveedor, id_encargado, herramientas } = req.body;

  if (!id_proveedor || !id_encargado)
    return res.status(400).json({ success: false, message: 'Proveedor y encargado son requeridos' });
  if (!herramientas || herramientas.length === 0)
    return res.status(400).json({ success: false, message: 'Agrega al menos una herramienta' });

  const total = herramientas.reduce(
    (sum, h) => sum + parseFloat(h.precio_unitario) * parseInt(h.cantidad), 0
  );

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Crear la compra
    const [result] = await conn.query(
      'INSERT INTO compras (id_proveedor, id_encargado, total, estado) VALUES (?, ?, ?, ?)',
      [id_proveedor, id_encargado, total, 'recibido']
    );
    const id_compra = result.insertId;

    // 2. Insertar detalle — el trigger sube el stock automáticamente
    for (const h of herramientas) {
      await conn.query(
        'INSERT INTO detalle_compra (id_compra, codigo_herra, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [id_compra, h.codigo_herra, h.cantidad, h.precio_unitario]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Compra registrada correctamente', id: id_compra, total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;