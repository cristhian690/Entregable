'use strict';

const DashboardModule = {
  async init() {
    console.log('DashboardModule init');
    await this.loadStats();
  },

  async loadStats() {
    try {
      const [herrRes, empRes, prestRes] = await Promise.all([
        http('/api/herramientas').catch(() => ({ data: [] })),
        http('/api/empleados').catch(() => ({ data: [] })),
        http('/api/prestamos').catch(() => ({ data: [] }))
      ]);

      const herramientas = herrRes.data || [];
      const empleados = empRes.data || [];
      const prestamos = prestRes.data || [];

      // Contadores principales (IDs reales del HTML)
      setText('stat-total-productos', herramientas.length);
      setText('stat-total-marcas', empleados.length);

      const prestActivos = prestamos.filter(p => p.estado === 'activo').length;
      setText('stat-valor-total', prestActivos);

      const stockBajo = herramientas.filter(h => h.cantidad <= h.stock_minimo).length;
      setText('stat-precio-promedio', stockBajo);

      // Badges del sidebar
      setText('badge-herramientas', herramientas.length);
      setText('badge-prestamos', prestActivos);

      // Últimas herramientas
      const tablaReciente = document.getElementById('tabla-recientes');
      if (tablaReciente && herramientas.length > 0) {
        const ultimas = herramientas.slice(0, 5);
        tablaReciente.innerHTML = `
          <table class="table table-sm">
            <thead>
              <tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Stock</th></tr>
            </thead>
            <tbody>
              ${ultimas.map(h => `
                <tr>
                  <td><code>${escapeHtml(h.codigo_herra)}</code></td>
                  <td>${escapeHtml(h.nombre)}</td>
                  <td>${escapeHtml(h.nombre_marca || '—')}</td>
                  <td>${formatNumber(h.cantidad)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`;
      }

      // Herramientas por marca (gráfico simple con barras)
      const chartMarcas = document.getElementById('chart-marcas');
      if (chartMarcas && herramientas.length > 0) {
        const porMarca = {};
        herramientas.forEach(h => {
          const m = h.nombre_marca || 'Sin marca';
          porMarca[m] = (porMarca[m] || 0) + 1;
        });
        const max = Math.max(...Object.values(porMarca));
        chartMarcas.innerHTML = Object.entries(porMarca).map(([marca, count]) => `
          <div class="mb-2">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-sm">${escapeHtml(marca)}</span>
              <strong>${count}</strong>
            </div>
            <div class="progress" style="height:8px">
              <div class="progress-bar bg-primary" style="width:${(count/max)*100}%"></div>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    }
  }
};