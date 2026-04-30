'use strict';

const ComprasModule = {
  _herramientasSeleccionadas: [],

  async init() {
    console.log('ComprasModule init');
    await this.renderTable();
    this.initEvents();
  },

  initEvents() {
    document.getElementById('btnNuevaCompra')?.addEventListener('click', () => this.openModal());
    document.getElementById('saveCompra')?.addEventListener('click', () => this.save());
    document.getElementById('closeModalCompra')?.addEventListener('click', () => closeOverlay('modalCompra'));
    document.getElementById('cancelCompra')?.addEventListener('click', () => closeOverlay('modalCompra'));
    document.getElementById('btnAgregarHerramientaCompra')?.addEventListener('click', () => this.agregarHerramienta());
  },

  async renderTable() {
    try {
      const res = await http('/api/compras');
      const data = res.data;
      const tbody = document.getElementById('tabla-compras');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No hay compras registradas</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(c => `
        <tr>
          <td><code>#${c.id_compra}</code></td>
          <td>${escapeHtml(c.nombre_proveedor || '—')}</td>
          <td>${escapeHtml(c.nombre_encargado || '—')}</td>
          <td>${formatFecha(c.fecha)}</td>
          <td><strong>S/ ${formatPrecio(c.total)}</strong></td>
          <td><span class="badge ${c.estado === 'recibido' ? 'badge-success' : 'badge-warning'}">${c.estado}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error al cargar compras', 'error');
    }
  },

  async openModal() {
    this._herramientasSeleccionadas = [];

    try {
      const [provRes, encRes, herrRes] = await Promise.all([
        http('/api/proveedores'),
        http('/api/encargados'),
        http('/api/herramientas')
      ]);

      // Llenar proveedores
      const selProv = document.getElementById('selectProveedor');
      if (selProv) {
        selProv.innerHTML = '<option value="">Seleccionar proveedor...</option>' +
          provRes.data.map(p => `<option value="${p.id_proveedor}">${escapeHtml(p.nombre)}</option>`).join('');
      }

      // Llenar encargados
      const selEnc = document.getElementById('selectEncargadoCompra');
      if (selEnc) {
        selEnc.innerHTML = '<option value="">Seleccionar encargado...</option>' +
          encRes.data.map(e => `<option value="${e.id_encargado}">${escapeHtml(e.nombre)}</option>`).join('');
      }

      // Llenar herramientas (todas, porque la compra agrega stock)
      const selHerr = document.getElementById('selectHerramientaCompra');
      if (selHerr) {
        selHerr.innerHTML = '<option value="">Seleccionar herramienta...</option>' +
          herrRes.data.map(h => `<option value="${h.codigo_herra}">
            ${escapeHtml(h.codigo_herra)} - ${escapeHtml(h.nombre)}
          </option>`).join('');
      }

      // Limpiar campos
      document.getElementById('cantidadCompra').value = 1;
      document.getElementById('precioCompra').value = 0;
      document.getElementById('herramientasCompraSeleccionadas').innerHTML = '';
      document.getElementById('totalCompraDisplay').textContent = 'S/ 0.00';

      openOverlay('modalCompra');
    } catch (err) {
      showToast('Error al cargar datos', 'error');
    }
  },

  agregarHerramienta() {
    const sel = document.getElementById('selectHerramientaCompra');
    const cantInput = document.getElementById('cantidadCompra');
    const precioInput = document.getElementById('precioCompra');

    const cantidad = parseInt(cantInput?.value || 1);
    const precio = parseFloat(precioInput?.value || 0);

    if (!sel?.value) return showToast('Selecciona una herramienta', 'warning');
    if (cantidad < 1) return showToast('Cantidad debe ser mayor a 0', 'warning');
    if (precio <= 0) return showToast('Ingresa un precio válido', 'warning');

    const ya = this._herramientasSeleccionadas.find(h => h.codigo_herra === sel.value);
    if (ya) return showToast('Esta herramienta ya está agregada', 'warning');

    this._herramientasSeleccionadas.push({
      codigo_herra: sel.value,
      cantidad: cantidad,
      precio_unitario: precio,
      nombre: sel.options[sel.selectedIndex].text
    });

    this.renderHerramientasSeleccionadas();
    sel.value = '';
    cantInput.value = 1;
    precioInput.value = 0;
  },

  renderHerramientasSeleccionadas() {
    const cont = document.getElementById('herramientasCompraSeleccionadas');
    if (!cont) return;

    if (this._herramientasSeleccionadas.length === 0) {
      cont.innerHTML = '<div class="text-muted small">No hay herramientas agregadas</div>';
      document.getElementById('totalCompraDisplay').textContent = 'S/ 0.00';
      return;
    }

    cont.innerHTML = this._herramientasSeleccionadas.map((h, i) => {
      const subtotal = h.cantidad * h.precio_unitario;
      return `
        <div class="d-flex justify-content-between align-items-center p-2 mb-1 bg-light rounded">
          <span>
            <i class="bi bi-tools me-2"></i>${escapeHtml(h.nombre)} 
            <strong>× ${h.cantidad}</strong> 
            <span class="text-muted">@ S/ ${formatPrecio(h.precio_unitario)}</span>
            = <strong>S/ ${formatPrecio(subtotal)}</strong>
          </span>
          <button class="btn btn-sm btn-outline-danger" onclick="ComprasModule.quitarHerramienta(${i})">
            <i class="bi bi-x"></i>
          </button>
        </div>`;
    }).join('');

    // Calcular y mostrar total
    const total = this._herramientasSeleccionadas.reduce((sum, h) => sum + (h.cantidad * h.precio_unitario), 0);
    document.getElementById('totalCompraDisplay').textContent = 'S/ ' + formatPrecio(total);
  },

  quitarHerramienta(index) {
    this._herramientasSeleccionadas.splice(index, 1);
    this.renderHerramientasSeleccionadas();
  },

  async save() {
    const id_proveedor = document.getElementById('selectProveedor')?.value;
    const id_encargado = document.getElementById('selectEncargadoCompra')?.value;

    if (!id_proveedor) return showToast('Selecciona un proveedor', 'warning');
    if (!id_encargado) return showToast('Selecciona un encargado', 'warning');
    if (this._herramientasSeleccionadas.length === 0) {
      return showToast('Agrega al menos una herramienta', 'warning');
    }

    try {
      await http('/api/compras', 'POST', {
        id_proveedor,
        id_encargado,
        herramientas: this._herramientasSeleccionadas
      });
      showToast('Compra registrada correctamente');
      closeOverlay('modalCompra');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};