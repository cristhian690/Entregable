'use strict';

const ReportesModule = {

  // Referencias a gráficos — igual que el profe
  graficoPorMes:      null,
  graficoHerramientas: null,
  graficoEmpleados:   null,

  async init() {
    console.log('ReportesModule init');
    await Promise.all([
      this.loadResumen(),
      this.loadGraficaPorMes(),
      this.loadGraficaHerramientas(),
      this.loadGraficaEmpleados()
    ]);
  },

  // ── Tarjetas ──────────────────────────────────────────────
  async loadResumen() {
    try {
      const res = await http('/api/reportes/resumen');
      setText('rep-herramientas', res.data.total_herramientas);
      setText('rep-empleados',    res.data.total_empleados);
      setText('rep-prestamos',    res.data.prestamos_activos);
      setText('rep-stockbajo',    res.data.stock_bajo);
    } catch (_) {}
  },

  // ── GRÁFICA 1: Préstamos por mes ─────────────────────────
  async loadGraficaPorMes() {
    try {
      const res  = await http('/api/reportes/prestamos-por-mes');
      const data = res.data;

      const lienzo = document.getElementById('lienzoPorMes');
      if (!lienzo) return;
      if (this.graficoPorMes) this.graficoPorMes.destroy();

      // Colores como el profe
      const coloresFondo = [
        'rgba(99,102,241,0.7)',
        'rgba(16,185,129,0.7)',
        'rgba(245,158,11,0.7)',
        'rgba(239,68,68,0.7)',
        'rgba(107,114,128,0.7)',
        'rgba(59,130,246,0.7)'
      ];
      const coloresContorno = coloresFondo.map(c => c.replace('0.7', '1'));

      this.graficoPorMes = new Chart(lienzo, {
        type: 'bar',
        data: {
          labels:   data.map(d => d.mes_label),
          datasets: [{
            label:           'Préstamos',
            data:            data.map(d => d.total),
            backgroundColor: coloresFondo.slice(0, data.length),
            borderColor:     coloresContorno.slice(0, data.length),
            borderWidth:     2,
            borderRadius:    6
          }]
        },
        options: {
          responsive:          true,
          maintainAspectRatio: true,
          aspectRatio:         3,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              ticks: { stepSize: 1 },
              grid: { color: 'rgba(0,0,0,.05)' }
            },
            x: { grid: { display: false } }
          }
        }
      });
    } catch (_) {}
  },

  // ── GRÁFICA 2: Herramientas más prestadas ────────────────
  async loadGraficaHerramientas() {
    try {
      const res  = await http('/api/reportes/herramientas-mas-prestadas');
      const data = res.data;

      const lienzo = document.getElementById('lienzoHerramientas');
      if (!lienzo) return;
      if (this.graficoHerramientas) this.graficoHerramientas.destroy();

      const coloresFondo = [
        'rgba(245,158,11,0.7)',
        'rgba(99,102,241,0.7)',
        'rgba(16,185,129,0.7)',
        'rgba(239,68,68,0.7)',
        'rgba(59,130,246,0.7)',
        'rgba(168,85,247,0.7)',
        'rgba(236,72,153,0.7)',
        'rgba(107,114,128,0.7)'
      ];
      const coloresContorno = coloresFondo.map(c => c.replace('0.7', '1'));

      this.graficoHerramientas = new Chart(lienzo, {
        type: 'bar',
        data: {
          labels:   data.map(d => d.nombre),
          datasets: [{
            label:           'Veces prestada',
            data:            data.map(d => d.total_prestamos),
            backgroundColor: coloresFondo.slice(0, data.length),
            borderColor:     coloresContorno.slice(0, data.length),
            borderWidth:     2,
            borderRadius:    6
          }]
        },
        options: {
          responsive:          true,
          maintainAspectRatio: true,
          aspectRatio:         3,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              ticks: { stepSize: 1 },
              grid: { color: 'rgba(0,0,0,.05)' }
            },
            x: { grid: { display: false } }
          }
        }
      });
    } catch (_) {}
  },

  // ── GRÁFICA 3: Empleados más activos ─────────────────────
  async loadGraficaEmpleados() {
    try {
      const res  = await http('/api/reportes/empleados-mas-activos');
      const data = res.data;

      const lienzo = document.getElementById('lienzoEmpleados');
      if (!lienzo) return;
      if (this.graficoEmpleados) this.graficoEmpleados.destroy();

      const coloresFondo = [
        'rgba(16,185,129,0.7)',
        'rgba(99,102,241,0.7)',
        'rgba(245,158,11,0.7)',
        'rgba(239,68,68,0.7)',
        'rgba(59,130,246,0.7)',
        'rgba(107,114,128,0.7)'
      ];
      const coloresContorno = coloresFondo.map(c => c.replace('0.7', '1'));

      this.graficoEmpleados = new Chart(lienzo, {
        type: 'bar',
        data: {
          labels:   data.map(d => d.nombre),
          datasets: [{
            label:           'Préstamos realizados',
            data:            data.map(d => d.total_prestamos),
            backgroundColor: coloresFondo.slice(0, data.length),
            borderColor:     coloresContorno.slice(0, data.length),
            borderWidth:     2,
            borderRadius:    6
          }]
        },
        options: {
          responsive:          true,
          maintainAspectRatio: true,
          aspectRatio:         3,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              ticks: { stepSize: 1 },
              grid: { color: 'rgba(0,0,0,.05)' }
            },
            x: { grid: { display: false } }
          }
        }
      });
    } catch (_) {}
  },

  // ── Mostrar/Ocultar sección reporte ──────────────────────
  async mostrarSeccionReporte() {
    const sec = document.getElementById('seccionReporte');
    if (!sec) return;
    sec.style.display = 'block';
    sec.scrollIntoView({ behavior: 'smooth' });
    await Promise.all([
      this.loadStockBajo(),
      this.loadEmpleadosSelect()
    ]);
  },

  ocultarSeccionReporte() {
    const sec = document.getElementById('seccionReporte');
    if (sec) sec.style.display = 'none';
    this.limpiarFiltros();
  },

  // ── Select empleados ──────────────────────────────────────
  async loadEmpleadosSelect() {
    try {
      const res = await http('/api/empleados');
      const sel = document.getElementById('filtEmpleado');
      if (!sel) return;
      sel.innerHTML = '<option value="">Todos</option>' +
        res.data.map(e => `<option value="${e.id_emp}">${escapeHtml(e.nombre)}</option>`).join('');
    } catch (_) {}
  },

  // ── Stock bajo ────────────────────────────────────────────
  async loadStockBajo() {
    try {
      const res   = await http('/api/reportes/stock-bajo');
      const tbody = document.getElementById('tablaStockBajo');
      if (!tbody) return;
      if (!res.data.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">✅ Sin herramientas con stock bajo</td></tr>';
        return;
      }
      tbody.innerHTML = res.data.map(h => `
        <tr>
          <td><strong>${escapeHtml(h.nombre)}</strong><br>
              <code class="text-danger" style="font-size:.75rem">${h.codigo_herra}</code></td>
          <td style="color:#6b7280">${escapeHtml(h.nombre_marca || '—')}</td>
          <td class="text-center">
            <span class="badge ${h.cantidad === 0 ? 'badge-danger' : 'badge-warning'}">${h.cantidad}</span>
          </td>
          <td class="text-center" style="color:#6b7280">${h.stock_minimo}</td>
          <td style="font-size:.82rem;color:#6b7280">${escapeHtml(h.ubicacion || '—')}</td>
        </tr>`).join('');
    } catch (_) {}
  },

  // ── FILTRAR PRÉSTAMOS ─────────────────────────────────────
  async filtrarPrestamos() {
    const fecha_desde = document.getElementById('filtFechaDesde')?.value || '';
    const fecha_hasta = document.getElementById('filtFechaHasta')?.value || '';
    const estado      = document.getElementById('filtEstado')?.value    || '';
    const id_emp      = document.getElementById('filtEmpleado')?.value  || '';

    const cont = document.getElementById('resultadoPrestamos');
    cont.innerHTML = '<div class="text-center py-3"><div class="spinner-custom"></div></div>';

    try {
      const res = await http('/api/reportes/prestamos/filtrar', 'POST', {
        fecha_desde, fecha_hasta, estado, id_emp
      });

      if (!res.data.length) {
        cont.innerHTML = '<p class="text-center text-muted py-3">No se encontraron préstamos con esos filtros.</p>';
        document.getElementById('btnPdfPrestamos').disabled = true;
        return;
      }

      document.getElementById('btnPdfPrestamos').disabled = false;

      const ep = {
        activo:'badge-warning', devuelto:'badge-success',
        parcial:'badge-info',   cancelado:'badge-danger'
      };

      cont.innerHTML = `
        <p class="text-muted mb-2" style="font-size:.85rem">
          <strong>${res.data.length}</strong> resultado(s) encontrado(s)
        </p>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr><th>#</th><th>Empleado</th><th>Encargado</th>
                  <th>Motivo</th><th>Área</th><th>Fecha</th><th>Estado</th></tr>
            </thead>
            <tbody>
              ${res.data.map(p => `
                <tr>
                  <td><code>#${p.id_pres}</code></td>
                  <td>${escapeHtml(p.empleado  || '—')}</td>
                  <td>${escapeHtml(p.encargado || '—')}</td>
                  <td style="font-size:.83rem">${escapeHtml(p.motivo_uso || '—')}</td>
                  <td><span class="badge badge-info">${escapeHtml(p.area_uso || '—')}</span></td>
                  <td style="font-size:.82rem">${formatFecha(p.fecha)}</td>
                  <td><span class="badge ${ep[p.estado]||'badge-secondary'}">${p.estado}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      cont.innerHTML = `<p class="text-center text-danger py-3">Error: ${err.message}</p>`;
    }
  },

  // ── Limpiar filtros ───────────────────────────────────────
  limpiarFiltros() {
    ['filtFechaDesde','filtFechaHasta','filtEstado','filtEmpleado']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const btn = document.getElementById('btnPdfPrestamos');
    if (btn) btn.disabled = true;
    const cont = document.getElementById('resultadoPrestamos');
    if (cont) cont.innerHTML = '<p class="text-muted text-center py-3">Aplica los filtros y haz clic en <strong>Filtrar</strong>.</p>';
  },

  // ── DESCARGAR PDF PRÉSTAMOS ───────────────────────────────
  async descargarPdfPrestamos() {
    const fecha_desde = document.getElementById('filtFechaDesde')?.value || '';
    const fecha_hasta = document.getElementById('filtFechaHasta')?.value || '';
    const estado      = document.getElementById('filtEstado')?.value    || '';
    const id_emp      = document.getElementById('filtEmpleado')?.value  || '';

    showToast('Generando PDF...', 'info');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/reportes/pdf/prestamos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ fecha_desde, fecha_hasta, estado, id_emp })
      });
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'reporte_prestamos.pdf'; a.click();
      URL.revokeObjectURL(url);
      showToast('PDF descargado correctamente', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },

  // ── DESCARGAR PDF STOCK BAJO ──────────────────────────────
  async descargarPdfStockBajo() {
    showToast('Generando PDF...', 'info');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/reportes/pdf/stock-bajo', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'reporte_stock_bajo.pdf'; a.click();
      URL.revokeObjectURL(url);
      showToast('PDF descargado correctamente', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }
};