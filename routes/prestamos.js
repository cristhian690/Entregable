const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET todos los préstamos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*,
             e.nombre  AS nombre_empleado,
             en.nombre AS nombre_encargado
      FROM prestamos p
      LEFT JOIN empleados  e  ON p.id_emp       = e.id_emp
      LEFT JOIN encargados en ON p.id_encargado = en.id_encargado
      ORDER BY p.fecha DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET un préstamo por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM prestamos WHERE id_pres = ?',
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST crear préstamo con transacción
// El trigger trg_salida_prestamo baja el stock automáticamente
router.post('/', async (req, res) => {
  const { id_emp, id_encargado, motivo_uso, area_uso, herramientas } = req.body;

  if (!id_emp || !id_encargado)
    return res.status(400).json({ success: false, message: 'Empleado y encargado son requeridos' });
  if (!herramientas || herramientas.length === 0)
    return res.status(400).json({ success: false, message: 'Agrega al menos una herramienta' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verificar stock de cada herramienta ANTES de insertar
    for (const h of herramientas) {
      const [stock] = await conn.query(
        'SELECT cantidad, nombre FROM herramientas WHERE codigo_herra = ? AND deleted_at IS NULL',
        [h.codigo_herra]
      );
      if (stock.length === 0)
        throw new Error(`Herramienta ${h.codigo_herra} no encontrada`);
      if (stock[0].cantidad < h.cantidad)
        throw new Error(`Stock insuficiente para "${stock[0].nombre}": disponible ${stock[0].cantidad}`);
    }

    // 2. Crear el préstamo
    const [result] = await conn.query(
      'INSERT INTO prestamos (id_emp, id_encargado, motivo_uso, area_uso) VALUES (?, ?, ?, ?)',
      [id_emp, id_encargado, motivo_uso || '', area_uso || '']
    );
    const id_pres = result.insertId;

    // 3. Insertar detalle — el trigger baja el stock automáticamente
    for (const h of herramientas) {
      await conn.query(
        'INSERT INTO detalle_prestamo (id_pres, codigo_herra, cantidad) VALUES (?, ?, ?)',
        [id_pres, h.codigo_herra, h.cantidad || 1]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Préstamo registrado correctamente', id: id_pres });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// PUT devolver préstamo
// El trigger trg_entrada_devolucion sube el stock automáticamente
router.put('/:id/devolver', async (req, res) => {
  const id_pres = req.params.id;
  const conn    = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Verificar que el préstamo existe y está activo
    const [prestamos] = await conn.query(
      'SELECT * FROM prestamos WHERE id_pres = ?',
      [id_pres]
    );
    if (prestamos.length === 0) throw new Error('Préstamo no encontrado');
    if (prestamos[0].estado !== 'activo') throw new Error(`Este préstamo no puede devolverse (estado: ${prestamos[0].estado})`);

    const prestamo = prestamos[0];

    // 2. Obtener detalle del préstamo
    const [detalles] = await conn.query(
      'SELECT * FROM detalle_prestamo WHERE id_pres = ?',
      [id_pres]
    );
    if (detalles.length === 0) throw new Error('El préstamo no tiene herramientas registradas');

    // 3. Crear la devolución
    const [devResult] = await conn.query(
      'INSERT INTO devoluciones (id_pres, id_emp, id_encargado, observaciones, estado) VALUES (?, ?, ?, ?, ?)',
      [id_pres, prestamo.id_emp, prestamo.id_encargado, 'Devolución regular', 'bueno']
    );
    const id_devol = devResult.insertId;

    // 4. Insertar detalle devolución — el trigger sube el stock automáticamente
    for (const d of detalles) {
      await conn.query(
        'INSERT INTO detalle_devolucion (id_devol, codigo_herra, cantidad, estado) VALUES (?, ?, ?, ?)',
        [id_devol, d.codigo_herra, d.cantidad, 'bueno']
      );
    }

    // 5. Marcar el préstamo como devuelto
    await conn.query(
      "UPDATE prestamos SET estado = 'devuelto' WHERE id_pres = ?",
      [id_pres]
    );

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