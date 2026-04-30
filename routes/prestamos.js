const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET todos los préstamos con nombres reales
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, 
             e.nombre AS nombre_empleado, 
             en.nombre AS nombre_encargado
      FROM prestamos p
      LEFT JOIN empleados e ON p.id_emp = e.id_emp
      LEFT JOIN encargados en ON p.id_encargado = en.id_encargado
      ORDER BY p.fecha DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET un préstamo
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM prestamos WHERE id_pres = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST crear préstamo con detalle (transacción)
router.post('/', async (req, res) => {
  const { id_emp, id_encargado, motivo_uso, area_uso, herramientas } = req.body;
  
  if (!id_emp || !id_encargado) {
    return res.status(400).json({ success: false, message: 'Empleado y encargado son requeridos' });
  }
  if (!herramientas || herramientas.length === 0) {
    return res.status(400).json({ success: false, message: 'Debe agregar al menos una herramienta' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Crear el préstamo
    const [result] = await conn.query(
      'INSERT INTO prestamos (id_emp, id_encargado, motivo_uso, area_uso) VALUES (?, ?, ?, ?)',
      [id_emp, id_encargado, motivo_uso || '', area_uso || '']
    );
    const id_pres = result.insertId;

    // 2. Crear el detalle (esto activa el trigger que baja el stock)
    for (const h of herramientas) {
      await conn.query(
        'INSERT INTO detalle_prestamo (id_pres, codigo_herra, cantidad) VALUES (?, ?, ?)',
        [id_pres, h.codigo_herra, h.cantidad || 1]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Préstamo registrado', id: id_pres });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// PUT devolver préstamo
router.put('/:id/devolver', async (req, res) => {
  const id_pres = req.params.id;
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();

    // 1. Obtener el préstamo
    const [prestamos] = await conn.query('SELECT * FROM prestamos WHERE id_pres = ?', [id_pres]);
    if (prestamos.length === 0) {
      throw new Error('Préstamo no encontrado');
    }
    const prestamo = prestamos[0];

    if (prestamo.estado !== 'activo') {
      throw new Error('Este préstamo ya fue devuelto');
    }

    // 2. Obtener detalle del préstamo
    const [detalles] = await conn.query('SELECT * FROM detalle_prestamo WHERE id_pres = ?', [id_pres]);

    // 3. Crear devolución
    const [devResult] = await conn.query(
      'INSERT INTO devoluciones (id_pres, id_emp, id_encargado, observaciones, estado) VALUES (?, ?, ?, ?, ?)',
      [id_pres, prestamo.id_emp, prestamo.id_encargado, 'Devolución regular', 'bueno']
    );
    const id_devol = devResult.insertId;

    // 4. Crear detalle de devolución (activa trigger que sube stock)
    for (const d of detalles) {
      await conn.query(
        'INSERT INTO detalle_devolucion (id_devol, codigo_herra, cantidad, estado) VALUES (?, ?, ?, ?)',
        [id_devol, d.codigo_herra, d.cantidad, 'bueno']
      );
    }

    // 5. Actualizar estado del préstamo
    await conn.query('UPDATE prestamos SET estado = ? WHERE id_pres = ?', ['devuelto', id_pres]);

    await conn.commit();
    res.json({ success: true, message: 'Préstamo devuelto correctamente' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;