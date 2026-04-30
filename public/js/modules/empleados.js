'use strict';

const EmpleadosModule = {
  async init() {
    console.log('EmpleadosModule init');
    await this.renderTable();
  },

  async renderTable() {
    try {
      const res = await http('/api/empleados');
      const data = res.data;
      const tbody = document.getElementById('tabla-empleados');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No hay empleados registrados</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(e => `
        <tr>
          <td><code>#${e.id_emp}</code></td>
          <td>${escapeHtml(e.nombre)}</td>
          <td>${escapeHtml(e.cargo || '—')}</td>
          <td>${escapeHtml(e.area || '—')}</td>
          <td>${escapeHtml(e.turno || '—')}</td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error al cargar empleados', 'error');
    }
  }
};