'use strict';

const ProveedoresModule = {
  async init() {
    console.log('ProveedoresModule init');
    await this.renderTable();
    this.initEvents();
  },

  initEvents() {
    document.getElementById('btnNuevoProveedor')?.addEventListener('click', () => this.openModal());
    document.getElementById('saveProveedor')?.addEventListener('click', () => this.save());
    document.getElementById('closeModalProveedor')?.addEventListener('click', () => closeOverlay('modalProveedor'));
    document.getElementById('cancelProveedor')?.addEventListener('click', () => closeOverlay('modalProveedor'));
  },

  async renderTable() {
    try {
      const res = await http('/api/proveedores');
      const data = res.data;
      const tbody = document.getElementById('tabla-proveedores');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No hay proveedores registrados</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(p => `
        <tr>
          <td>${escapeHtml(p.nombre)}</td>
          <td><code>${escapeHtml(p.ruc || '—')}</code></td>
          <td>${escapeHtml(p.telefono || '—')}</td>
          <td>${escapeHtml(p.email || '—')}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="ProveedoresModule.edit(${p.id_proveedor})" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="ProveedoresModule.confirmDelete(${p.id_proveedor}, '${escapeHtml(p.nombre).replace(/'/g, '\\\'')}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error al cargar proveedores', 'error');
    }
  },

  _editId: null,

  openModal(data = null) {
    this._editId = data ? data.id_proveedor : null;

    // Verificar que los elementos existan ANTES de tocarlos
    const nombre = document.getElementById('provNombre');
    const ruc = document.getElementById('provRuc');
    const tel = document.getElementById('provTelefono');
    const email = document.getElementById('provEmail');
    const direccion = document.getElementById('provDireccion');
    const contacto = document.getElementById('provContacto');

    if (!nombre || !ruc) {
      showToast('Modal no encontrado', 'error');
      return;
    }

    nombre.value = data?.nombre || '';
    ruc.value = data?.ruc || '';
    if (tel) tel.value = data?.telefono || '';
    if (email) email.value = data?.email || '';
    if (direccion) direccion.value = data?.direccion || '';
    if (contacto) contacto.value = data?.contacto || '';

    const modalTitle = document.querySelector('#modalProveedor .modal-title-custom');
    if (modalTitle) modalTitle.textContent = this._editId ? 'Editar Proveedor' : 'Nuevo Proveedor';

    openOverlay('modalProveedor');
  },

  async edit(id) {
    try {
      const res = await http('/api/proveedores');
      const p = res.data.find(x => x.id_proveedor == id);
      if (p) {
        this.openModal(p);
      } else {
        showToast('Proveedor no encontrado', 'error');
      }
    } catch (err) {
      showToast('Error al cargar proveedor', 'error');
    }
  },

  async save() {
    const nombre = document.getElementById('provNombre')?.value.trim();
    const ruc = document.getElementById('provRuc')?.value.trim();
    const telefono = document.getElementById('provTelefono')?.value.trim();
    const email = document.getElementById('provEmail')?.value.trim();
    const direccion = document.getElementById('provDireccion')?.value.trim() || '';
    const contacto = document.getElementById('provContacto')?.value.trim() || '';

    if (!nombre) return showToast('El nombre es requerido', 'warning');
    if (!ruc) return showToast('El RUC es requerido', 'warning');

    try {
      if (this._editId) {
        await http(`/api/proveedores/${this._editId}`, 'PUT', {
          nombre, ruc, telefono, email, direccion, contacto, activo: 1
        });
        showToast('Proveedor actualizado correctamente');
      } else {
        await http('/api/proveedores', 'POST', { nombre, ruc, telefono, email, direccion, contacto });
        showToast('Proveedor creado correctamente');
      }
      closeOverlay('modalProveedor');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  confirmDelete(id, name) {
    if (confirm(`¿Estás seguro de eliminar al proveedor "${name}"?`)) {
      this.delete(id);
    }
  },

  async delete(id) {
    try {
      await http(`/api/proveedores/${id}`, 'DELETE');
      showToast('Proveedor eliminado correctamente');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};