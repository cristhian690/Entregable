'use strict';

const EmpleadosModule = {
  _editId: null,

  async init() {
    console.log('EmpleadosModule init');
    await this.renderTable();
    this.initEvents();
  },

  initEvents() {
    document.getElementById('btnNuevoEmpleado')?.addEventListener('click', () => this.openModal());
    document.getElementById('saveEmpleado')?.addEventListener('click', () => this.save());
    document.getElementById('closeModalEmpleado')?.addEventListener('click', () => closeOverlay('modalEmpleado'));
    document.getElementById('cancelEmpleado')?.addEventListener('click', () => closeOverlay('modalEmpleado'));
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
          <td>${escapeHtml(e.nombre)}</td>
          <td>${escapeHtml(e.cargo  || '—')}</td>
          <td>${escapeHtml(e.area   || '—')}</td>
          <td>${escapeHtml(e.turno  || '—')}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="EmpleadosModule.edit(${e.id_emp})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="EmpleadosModule.confirmDelete(${e.id_emp}, '${escapeHtml(e.nombre).replace(/'/g, "\\'")}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error al cargar empleados', 'error');
    }
  },

  openModal(data = null) {
    this._editId = data ? data.id_emp : null;

    document.getElementById('empNombre').value = data?.nombre || '';
    document.getElementById('empCargo').value  = data?.cargo  || '';
    document.getElementById('empArea').value   = data?.area   || '';
    document.getElementById('empTurno').value  = data?.turno  || '';

    const title = document.querySelector('#modalEmpleado .modal-title-custom');
    if (title) title.textContent = this._editId ? 'Editar Empleado' : 'Nuevo Empleado';

    openOverlay('modalEmpleado');
  },

  async edit(id) {
    try {
      const res = await http('/api/empleados');
      const emp = res.data.find(e => e.id_emp == id);
      if (emp) {
        this.openModal(emp);
      } else {
        showToast('Empleado no encontrado', 'error');
      }
    } catch (err) {
      showToast('Error al cargar empleado', 'error');
    }
  },

  async save() {
    const nombre = document.getElementById('empNombre')?.value.trim();
    const cargo  = document.getElementById('empCargo')?.value.trim();
    const area   = document.getElementById('empArea')?.value.trim();
    const turno  = document.getElementById('empTurno')?.value;

    if (!nombre) return showToast('El nombre es requerido', 'warning');

    try {
      if (this._editId) {
        await http(`/api/empleados/${this._editId}`, 'PUT', { nombre, cargo, area, turno });
        showToast('Empleado actualizado correctamente');
      } else {
        await http('/api/empleados', 'POST', { nombre, cargo, area, turno });
        showToast('Empleado creado correctamente');
      }
      closeOverlay('modalEmpleado');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  confirmDelete(id, name) {
    if (confirm(`¿Estás seguro de eliminar al empleado "${name}"?`)) {
      this.delete(id);
    }
  },

  async delete(id) {
    try {
      await http(`/api/empleados/${id}`, 'DELETE');
      showToast('Empleado eliminado correctamente');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};