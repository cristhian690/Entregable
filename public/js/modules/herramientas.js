'use strict';

const HerramientasModule = {
  _allData: [], // <-- Nueva propiedad para almacenar la lista original

  async init() {
    console.log('HerramientasModule init');
    await this.renderTable();
    this.initEvents();
  },

  initEvents() {
    document.getElementById('btnNuevaHerramienta')?.addEventListener('click', () => this.openModal());
    document.getElementById('saveHerramienta')?.addEventListener('click', () => this.save());
    document.getElementById('closeModalHerramienta')?.addEventListener('click', () => closeOverlay('modalHerramienta'));
    document.getElementById('cancelHerramienta')?.addEventListener('click', () => closeOverlay('modalHerramienta'));

    // --- NUEVO: Evento para el buscador ---
    document.getElementById('inputBuscar')?.addEventListener('input', (e) => {
      const termino = e.target.value.toLowerCase();
      const filtrados = this._allData.filter(h => 
        h.codigo_herra.toLowerCase().includes(termino) || 
        h.nombre.toLowerCase().includes(termino)
      );
      this.drawTable(filtrados); // Dibujamos solo los filtrados
    });
  },

  async renderTable() {
    try {
      const res = await http('/api/herramientas');
      this._allData = res.data; // <-- Guardamos la copia original aquí
      this.drawTable(this._allData); // Llamamos a la función que dibuja
    } catch (err) {
      showToast('Error al cargar herramientas', 'error');
    }
  },

  // --- NUEVO: Función separada para dibujar las filas ---
  drawTable(data) {
    const tbody = document.getElementById('tabla-herramientas');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">No hay herramientas registradas</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(h => `
      <tr>
        <td><code>${escapeHtml(h.codigo_herra)}</code></td>
        <td>${escapeHtml(h.nombre)}</td>
        <td>${escapeHtml(h.nombre_marca || '—')}</td>
        <td>${escapeHtml(h.tipo || '—')}</td>
        <td><span class="badge ${getEstadoBadge(h.estado)}">${h.estado}</span></td>
        <td>${formatNumber(h.cantidad)}</td>
        <td>${escapeHtml(h.ubicacion || '—')}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="HerramientasModule.edit('${h.codigo_herra}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="HerramientasModule.confirmDelete('${h.codigo_herra}', '${escapeHtml(h.nombre).replace(/'/g, '\\\'')}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  _editCode: null,

  async loadMarcas() {
    try {
      const res = await http('/api/herramientas');
      // Extraer marcas únicas de las herramientas existentes
      const marcasSet = new Map();
      res.data.forEach(h => {
        if (h.id_marca) marcasSet.set(h.id_marca, h.nombre_marca);
      });
      
      // Si tenemos endpoint de marcas, mejor usarlo, pero por ahora usamos las que tenemos
      const select = document.getElementById('herrMarca');
      if (select) {
        // Marcas comunes (puedes ajustar IDs según tu BD)
        select.innerHTML = `
          <option value="">Seleccionar marca...</option>
          <option value="1">Bosch</option>
          <option value="2">Stanley</option>
          <option value="3">Truper</option>
          <option value="4">Makita</option>
          <option value="5">Black & Decker</option>
          <option value="6">Hilti</option>
          <option value="7">Einhell</option>
          <option value="8">Ryobi</option>
          <option value="9">Milwaukee</option>
          <option value="10">Hitachi</option>
          <option value="11">Makita Pro</option>
          <option value="12">DeWalt Industrial</option>
          <option value="13">Bosch Professional</option>
        `;
      }
    } catch (err) {
      console.error(err);
    }
  },

  async openModal(data = null) {
    this._editCode = data ? data.codigo_herra : null;

    await this.loadMarcas();

    const codigo = document.getElementById('herrCodigo');
    const nombre = document.getElementById('herrNombre');
    
    if (!codigo || !nombre) {
      showToast('Modal no encontrado', 'error');
      return;
    }

    codigo.value = data?.codigo_herra || '';
    codigo.disabled = !!this._editCode; // No se puede editar el código si es edición
    nombre.value = data?.nombre || '';
    document.getElementById('herrMarca').value = data?.id_marca || '';
    document.getElementById('herrTipo').value = data?.tipo || 'manual';
    document.getElementById('herrSerie').value = data?.num_serie || '';
    document.getElementById('herrEstado').value = data?.estado || 'bueno';
    document.getElementById('herrCantidad').value = data?.cantidad ?? 0;
    document.getElementById('herrStockMin').value = data?.stock_minimo ?? 1;
    document.getElementById('herrUbicacion').value = data?.ubicacion || '';
    document.getElementById('herrDescripcion').value = data?.descripcion || '';

    const modalTitle = document.querySelector('#modalHerramienta .modal-title-custom');
    if (modalTitle) modalTitle.textContent = this._editCode ? 'Editar Herramienta' : 'Nueva Herramienta';

    openOverlay('modalHerramienta');
  },

  async edit(codigo) {
    try {
      const res = await http('/api/herramientas/${codigo}');
      if (res.data) {
        this.openModal(res.data);
      } else {
        showToast('Herramienta no encontrada', 'error');
      }
    } catch (err) {
      showToast('Error al cargar herramienta', 'error');
    }
  },

  async save() {
    const codigo_herra = document.getElementById('herrCodigo')?.value.trim();
    const nombre = document.getElementById('herrNombre')?.value.trim();
    const id_marca = document.getElementById('herrMarca')?.value;
    const tipo = document.getElementById('herrTipo')?.value;
    const num_serie = document.getElementById('herrSerie')?.value.trim();
    const estado = document.getElementById('herrEstado')?.value;
    const cantidad = parseInt(document.getElementById('herrCantidad')?.value || 0);
    const stock_minimo = parseInt(document.getElementById('herrStockMin')?.value || 1);
    const ubicacion = document.getElementById('herrUbicacion')?.value.trim();
    const descripcion = document.getElementById('herrDescripcion')?.value.trim();

    if (!codigo_herra) return showToast('El código es requerido', 'warning');
    if (!nombre) return showToast('El nombre es requerido', 'warning');
    if (!id_marca) return showToast('Selecciona una marca', 'warning');

    try {
      const payload = { id_marca, nombre, tipo, num_serie, estado, ubicacion, cantidad, stock_minimo, descripcion };

      if (this._editCode) {
        await http('/api/herramientas/${this._editCode}', 'PUT', payload);
        showToast('Herramienta actualizada correctamente');
      } else {
        await http('/api/herramientas', 'POST', { codigo_herra, ...payload });
        showToast('Herramienta creada correctamente');
      }
      closeOverlay('modalHerramienta');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  confirmDelete(codigo, name) {
    if (confirm('¿Estás seguro de eliminar la herramienta "${name}" (${codigo})?')) {
      this.delete(codigo);
    }
  },

  async delete(codigo) {
    try {
      await http('/api/herramientas/${codigo}', 'DELETE');
      showToast('Herramienta eliminada correctamente');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};