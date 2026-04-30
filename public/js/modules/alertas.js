'use strict';

const AlertasModule = {
  async init() {
    console.log('AlertasModule init');
    await this.renderTable();
  },

  async renderTable() {
    try {
      const res = await http('/api/alertas');
      const data = res.data;
      const tbody = document.getElementById('tabla-alertas');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No hay alertas</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(a => `
        <tr>
          <td>${a.tipo}</td>
          <td>${escapeHtml(a.mensaje || '—')}</td>
          <td>${formatFecha(a.fecha)}</td>
          <td>${a.leida ? '✅ Leída' : '🔔 Pendiente'}</td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error al cargar alertas', 'error');
    }
  }
};