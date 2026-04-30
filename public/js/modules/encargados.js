'use strict';

const EncargadosModule = {
  async init() {
    console.log('EncargadosModule init');
    await this.renderTable();
  },

  async renderTable() {
    try {
      const res = await http('/api/encargados');
      const data = res.data;
      const tbody = document.getElementById('tabla-encargados');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No hay encargados registrados</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(e => `
        <tr>
          <td><code>#${e.id_encargado}</code></td>
          <td>${escapeHtml(e.nombre)}</td>
          <td>${escapeHtml(e.cargo || '—')}</td>
          <td>${escapeHtml(e.area || '—')}</td>
          <td>${escapeHtml(e.turno || '—')}</td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error al cargar encargados', 'error');
    }
  }
};