'use strict';

const EncargadosModule = {
  _editId: null,

  async init() {
    console.log('EncargadosModule init');
    await this.renderTable();
    this.initEvents();
  },

  initEvents() {
    document.getElementById('btnNuevoEncargado')?.addEventListener('click', () => this.openModal());
    document.getElementById('saveEncargado')?.addEventListener('click', () => this.save());
    document.getElementById('closeModalEncargado')?.addEventListener('click', () => closeOverlay('modalEncargado'));
    document.getElementById('cancelEncargado')?.addEventListener('click', () => closeOverlay('modalEncargado'));
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
          <td>${escapeHtml(e.nombre)}</td>
          <td>${escapeHtml(e.cargo  || '—')}</td>
          <td>${escapeHtml(e.area   || '—')}</td>
          <td>${escapeHtml(e.turno  || '—')}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="EncargadosModule.edit(${e.id_encargado})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="EncargadosModule.confirmDelete(${e.id_encargado}, '${escapeHtml(e.nombre).replace(/'/g, "\\'")}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error al cargar encargados', 'error');
    }
  },

  openModal(data = null) {
    this._editId = data ? data.id_encargado : null;

    document.getElementById('encNombre').value = data?.nombre || '';
    document.getElementById('encCargo').value  = data?.cargo  || '';
    document.getElementById('encArea').value   = data?.area   || '';
    document.getElementById('encTurno').value  = data?.turno  || '';

    const title = document.querySelector('#modalEncargado .modal-title-custom');
    if (title) title.textContent = this._editId ? 'Editar Encargado' : 'Nuevo Encargado';

    openOverlay('modalEncargado');
  },

  async edit(id) {
    try {
      const res = await http('/api/encargados');
      const enc = res.data.find(e => e.id_encargado == id);
      if (enc) {
        this.openModal(enc);
      } else {
        showToast('Encargado no encontrado', 'error');
      }
    } catch (err) {
      showToast('Error al cargar encargado', 'error');
    }
  },

  async save() {
    const nombre = document.getElementById('encNombre')?.value.trim();
    const cargo  = document.getElementById('encCargo')?.value.trim();
    const area   = document.getElementById('encArea')?.value.trim();
    const turno  = document.getElementById('encTurno')?.value;

    if (!nombre) return showToast('El nombre es requerido', 'warning');

    try {
      if (this._editId) {
        await http(`/api/encargados/${this._editId}`, 'PUT', { nombre, cargo, area, turno });
        showToast('Encargado actualizado correctamente');
      } else {
        await http('/api/encargados', 'POST', { nombre, cargo, area, turno });
        showToast('Encargado creado correctamente');
      }
      closeOverlay('modalEncargado');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  confirmDelete(id, name) {
    if (confirm(`¿Estás seguro de eliminar al encargado "${name}"?`)) {
      this.delete(id);
    }
  },

  async delete(id) {
    try {
      await http(`/api/encargados/${id}`, 'DELETE');
      showToast('Encargado eliminado correctamente');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};