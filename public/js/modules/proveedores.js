'use strict';

const ProveedoresModule = {
  _allData: [],  // ✅ guardamos todos para filtrar
  _editId:  null,

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

    // ✅ Buscador
    document.getElementById('inputBuscar')?.addEventListener('input', (e) => {
      const t = e.target.value.toLowerCase();
      const filtrados = this._allData.filter(p =>
        p.nombre.toLowerCase().includes(t) ||
        (p.ruc    || '').toLowerCase().includes(t) ||
        (p.email  || '').toLowerCase().includes(t)
      );
      this.drawTable(filtrados);
    });
  },

  async renderTable() {
    try {
      const res      = await http('/api/proveedores');
      this._allData  = res.data;
      this.drawTable(this._allData);
    } catch (err) {
      showToast('Error al cargar proveedores', 'error');
    }
  },

  drawTable(data) {
    const tbody = document.getElementById('tabla-proveedores');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No hay proveedores registrados</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td>${escapeHtml(p.nombre)}</td>
        <td><code class="text-danger">${escapeHtml(p.ruc || '—')}</code></td>
        <td>${escapeHtml(p.telefono || '—')}</td>
        <td>${escapeHtml(p.email || '—')}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1"
                  onclick="ProveedoresModule.edit(${p.id_proveedor})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger"
                  onclick="ProveedoresModule.confirmDelete(${p.id_proveedor}, '${escapeHtml(p.nombre).replace(/'/g, "\\'")}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  openModal(data = null) {
    this._editId = data ? data.id_proveedor : null;

    document.getElementById('provNombre').value    = data?.nombre    || '';
    document.getElementById('provRuc').value       = data?.ruc       || '';
    document.getElementById('provTelefono').value  = data?.telefono  || '';
    document.getElementById('provEmail').value     = data?.email     || '';
    document.getElementById('provDireccion').value = data?.direccion || '';
    document.getElementById('provContacto').value  = data?.contacto  || '';

    const title = document.querySelector('#modalProveedor .modal-title-custom');
    if (title) title.textContent = this._editId ? 'Editar Proveedor' : 'Nuevo Proveedor';

    openOverlay('modalProveedor');
  },

  async edit(id) {
    const p = this._allData.find(x => x.id_proveedor == id);
    if (p) {
      this.openModal(p);
    } else {
      showToast('Proveedor no encontrado', 'error');
    }
  },

  async save() {
    const nombre    = document.getElementById('provNombre')?.value.trim();
    const ruc       = document.getElementById('provRuc')?.value.trim();
    const telefono  = document.getElementById('provTelefono')?.value.trim();
    const email     = document.getElementById('provEmail')?.value.trim();
    const direccion = document.getElementById('provDireccion')?.value.trim();
    const contacto  = document.getElementById('provContacto')?.value.trim();

    if (!nombre) return showToast('El nombre es requerido', 'warning');
    if (!ruc)    return showToast('El RUC es requerido', 'warning');

    try {
      if (this._editId) {
        await http(`/api/proveedores/${this._editId}`, 'PUT', { nombre, ruc, telefono, email, direccion, contacto });
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
    if (confirm(`¿Eliminar al proveedor "${name}"?`)) this.delete(id);
  },

  async delete(id) {
    try {
      await http(`/api/proveedores/${id}`, 'DELETE');
      showToast('Proveedor eliminado');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};