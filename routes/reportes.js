const express     = require('express');
const router      = express.Router();
const PDFDocument = require('pdfkit');
const pool        = require('../config/db');

router.get('/resumen', async (req, res) => {
  try {
    const [[{ total_herramientas }]] = await pool.query('SELECT COUNT(*) AS total_herramientas FROM herramientas WHERE deleted_at IS NULL');
    const [[{ total_empleados }]]    = await pool.query('SELECT COUNT(*) AS total_empleados FROM empleados WHERE deleted_at IS NULL');
    const [[{ prestamos_activos }]]  = await pool.query("SELECT COUNT(*) AS prestamos_activos FROM prestamos WHERE estado = 'activo'");
    const [[{ stock_bajo }]]         = await pool.query('SELECT COUNT(*) AS stock_bajo FROM herramientas WHERE cantidad <= stock_minimo AND deleted_at IS NULL');

    res.json({ success: true, data: { total_herramientas, total_empleados, prestamos_activos, stock_bajo } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Préstamos por estado ──────────────────────────────────────
router.get('/prestamos-por-estado', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT estado, COUNT(*) AS total FROM prestamos GROUP BY estado ORDER BY total DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Préstamos por mes ─────────────────────────────────────────
router.get('/prestamos-por-mes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
             DATE_FORMAT(fecha, '%b %Y') AS mes_label,
             COUNT(*) AS total
      FROM prestamos
      WHERE fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha, '%Y-%m'), DATE_FORMAT(fecha, '%b %Y')
      ORDER BY mes ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Herramientas más prestadas ────────────────────────────────
router.get('/herramientas-mas-prestadas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.nombre, h.codigo_herra, COUNT(dp.id_detalle) AS total_prestamos
      FROM detalle_prestamo dp
      JOIN herramientas h ON dp.codigo_herra = h.codigo_herra
      GROUP BY dp.codigo_herra, h.nombre, h.codigo_herra
      ORDER BY total_prestamos DESC LIMIT 8
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Empleados más activos ─────────────────────────────────────
router.get('/empleados-mas-activos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.nombre, COUNT(p.id_pres) AS total_prestamos
      FROM prestamos p
      JOIN empleados e ON p.id_emp = e.id_emp
      GROUP BY p.id_emp, e.nombre
      ORDER BY total_prestamos DESC LIMIT 6
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Stock bajo ────────────────────────────────────────────────
router.get('/stock-bajo', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.codigo_herra, h.nombre, h.cantidad, h.stock_minimo,
             m.nombre AS nombre_marca, h.ubicacion
      FROM herramientas h
      LEFT JOIN marcas m ON h.id_marca = m.id_marca
      WHERE h.cantidad <= h.stock_minimo AND h.deleted_at IS NULL
      ORDER BY h.cantidad ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Movimientos recientes ─────────────────────────────────────
router.get('/movimientos-recientes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ms.tipo, ms.cantidad, ms.motivo, ms.fecha,
             h.nombre AS herramienta
      FROM movimientos_stock ms
      JOIN herramientas h ON ms.codigo_herra = h.codigo_herra
      ORDER BY ms.fecha DESC LIMIT 10
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  PRÉSTAMOS FILTRADOS — POST /api/reportes/prestamos/filtrar
//  Recibe: { fecha_desde, fecha_hasta, estado, id_emp }
// ══════════════════════════════════════════════════════════════
router.post('/prestamos/filtrar', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, estado, id_emp } = req.body;

    let sql = `
      SELECT p.id_pres, e.nombre AS empleado, en.nombre AS encargado,
             p.motivo_uso, p.area_uso, p.fecha, p.estado
      FROM prestamos p
      JOIN empleados  e  ON p.id_emp       = e.id_emp
      JOIN encargados en ON p.id_encargado = en.id_encargado
      WHERE 1=1
    `;
    const params = [];

    if (fecha_desde) { sql += ' AND DATE(p.fecha) >= ?'; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ' AND DATE(p.fecha) <= ?'; params.push(fecha_hasta); }
    if (estado)      { sql += ' AND p.estado = ?';       params.push(estado); }
    if (id_emp)      { sql += ' AND p.id_emp = ?';       params.push(id_emp); }

    sql += ' ORDER BY p.fecha DESC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  PDF PRÉSTAMOS — POST /api/reportes/pdf/prestamos
//  ✅ USA POST para recibir token en body + filtros
// ══════════════════════════════════════════════════════════════
router.post('/pdf/prestamos', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, estado, id_emp } = req.body;

    let sql = `
      SELECT p.id_pres, e.nombre AS empleado, en.nombre AS encargado,
             p.motivo_uso, p.area_uso, p.fecha, p.estado
      FROM prestamos p
      JOIN empleados  e  ON p.id_emp       = e.id_emp
      JOIN encargados en ON p.id_encargado = en.id_encargado
      WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { sql += ' AND DATE(p.fecha) >= ?'; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ' AND DATE(p.fecha) <= ?'; params.push(fecha_hasta); }
    if (estado)      { sql += ' AND p.estado = ?';       params.push(estado); }
    if (id_emp)      { sql += ' AND p.id_emp = ?';       params.push(id_emp); }
    sql += ' ORDER BY p.fecha DESC';

    const [prestamos] = await pool.query(sql, params);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_prestamos.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('StockPro — Reporte de Préstamos', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
       .text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, { align: 'center' });

    // Filtros aplicados
    const filtrosTexto = [];
    if (fecha_desde) filtrosTexto.push(`Desde: ${fecha_desde}`);
    if (fecha_hasta) filtrosTexto.push(`Hasta: ${fecha_hasta}`);
    if (estado)      filtrosTexto.push(`Estado: ${estado}`);
    if (filtrosTexto.length) {
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#6366f1').text(`Filtros: ${filtrosTexto.join(' | ')}`, { align: 'center' });
    }

    doc.moveDown(1);

    // Resumen
    const activos   = prestamos.filter(p => p.estado === 'activo').length;
    const devueltos = prestamos.filter(p => p.estado === 'devuelto').length;

    doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text('Resumen:');
    doc.fontSize(10).font('Helvetica')
       .text(`Total: ${prestamos.length}  |  Activos: ${activos}  |  Devueltos: ${devueltos}`);
    doc.moveDown(0.8);

    // Tabla
    const colWidths = [30, 120, 110, 130, 70, 70];
    const headers   = ['#', 'Empleado', 'Encargado', 'Motivo', 'Área', 'Estado'];
    const startX    = 50;
    let   y         = doc.y;

    // Cabecera
    doc.rect(startX, y, 530, 20).fill('#6366f1');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    let x = startX;
    headers.forEach((h, i) => {
      doc.text(h, x + 4, y + 5, { width: colWidths[i], lineBreak: false });
      x += colWidths[i];
    });
    y += 20;

    // Filas
    doc.fillColor('#111827').font('Helvetica').fontSize(9);
    prestamos.forEach((p, idx) => {
      if (y > 720) { doc.addPage(); y = 50; }
      doc.rect(startX, y, 530, 18).fill(idx % 2 === 0 ? '#f8f9fa' : '#ffffff');
      doc.fillColor('#111827');
      x = startX;
      const vals = [
        String(p.id_pres),
        (p.empleado  || '—').substring(0, 18),
        (p.encargado || '—').substring(0, 16),
        (p.motivo_uso || '—').substring(0, 20),
        (p.area_uso  || '—').substring(0, 10),
        p.estado || '—'
      ];
      vals.forEach((v, i) => {
        doc.text(v, x + 4, y + 4, { width: colWidths[i] - 6, lineBreak: false });
        x += colWidths[i];
      });
      y += 18;
    });

    doc.moveDown(1.5);
    doc.fontSize(9).fillColor('#6b7280').text(`Total de registros: ${prestamos.length}`, { align: 'right' });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PDF Stock bajo — POST /api/reportes/pdf/stock-bajo ────────
router.post('/pdf/stock-bajo', async (req, res) => {
  try {
    const [herramientas] = await pool.query(`
      SELECT h.codigo_herra, h.nombre, h.cantidad, h.stock_minimo,
             m.nombre AS nombre_marca, h.ubicacion
      FROM herramientas h
      LEFT JOIN marcas m ON h.id_marca = m.id_marca
      WHERE h.cantidad <= h.stock_minimo AND h.deleted_at IS NULL
      ORDER BY h.cantidad ASC
    `);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_stock_bajo.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('StockPro — Reporte Stock Bajo', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
       .text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(11).fillColor('#ef4444').font('Helvetica-Bold')
       .text(`Total herramientas con stock bajo: ${herramientas.length}`);
    doc.moveDown(0.8);

    const colWidths = [80, 150, 80, 60, 60, 100];
    const headers   = ['Código', 'Herramienta', 'Marca', 'Stock', 'Mínimo', 'Ubicación'];
    const startX    = 50;
    let   y         = doc.y;

    doc.rect(startX, y, 530, 20).fill('#ef4444');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    let x = startX;
    headers.forEach((h, i) => {
      doc.text(h, x + 4, y + 5, { width: colWidths[i], lineBreak: false });
      x += colWidths[i];
    });
    y += 20;

    doc.fillColor('#111827').font('Helvetica').fontSize(9);
    herramientas.forEach((h, idx) => {
      if (y > 720) { doc.addPage(); y = 50; }
      doc.rect(startX, y, 530, 18).fill(idx % 2 === 0 ? '#fff5f5' : '#ffffff');
      doc.fillColor('#111827');
      x = startX;
      const vals = [h.codigo_herra, h.nombre.substring(0,20), h.nombre_marca||'—', String(h.cantidad), String(h.stock_minimo), h.ubicacion||'—'];
      vals.forEach((v, i) => {
        doc.text(String(v), x + 4, y + 4, { width: colWidths[i] - 6, lineBreak: false });
        x += colWidths[i];
      });
      y += 18;
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;