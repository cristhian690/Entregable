'use strict';

const PrestamosModule = {
  _herramientasSeleccionadas: [],

  async init() {
    console.log('PrestamosModule init');
    await this.renderTable();
    this.initEvents();
  },

  initEvents() {
    document.getElementById('btnNuevoPrestamo')?.addEventListener('click', () => this.openModal());
    document.getElementById('savePrestamo')?.addEventListener('click', () => this.save());
    document.getElementById('closeModalPrestamo')?.addEventListener('click', () => closeOverlay('modalPrestamo'));
    document.getElementById('cancelPrestamo')?.addEventListener('click', () => closeOverlay('modalPrestamo'));
    document.getElementById('btnAgregarHerramienta')?.addEventListener('click', () => this.agregarHerramienta());
  },

  async renderTable() {
    try {
      const res = await http('/api/prestamos');
      const data = res.data;
      const tbody = document.getElementById('tabla-prestamos');
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">No hay préstamos registrados</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(p => `
        <tr>
          <td><code>#${p.id_pres}</code></td>
          <td>${escapeHtml(p.nombre_empleado || '—')}</td>
          <td>${escapeHtml(p.nombre_encargado || '—')}</td>
          <td>${escapeHtml(p.motivo_uso || '—')}</td>
          <td>${escapeHtml(p.area_uso || '—')}</td>
          <td>${formatFecha(p.fecha)}</td>
          <td><span class="badge ${getEstadoPrestamo(p.estado)}">${p.estado}</span></td>
          <td class="text-end">
            ${p.estado === 'activo' ? `
              <button class="btn btn-sm btn-outline-success" onclick="PrestamosModule.confirmDevolver(${p.id_pres})">
                <i class="bi bi-arrow-return-left"></i> Devolver
              </button>
            ` : '<span class="text-muted">—</span>'}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      showToast('Error al cargar préstamos', 'error');
    }
  },

  async openModal() {
    this._herramientasSeleccionadas = [];

    try {
      // Cargar empleados, encargados y herramientas en paralelo
      const [empRes, encRes, herrRes] = await Promise.all([
        http('/api/empleados'),
        http('/api/encargados'),
        http('/api/herramientas')
      ]);

      // Llenar select de empleados
      const selEmp = document.getElementById('selectEmpleado');
      if (selEmp) {
        selEmp.innerHTML = '<option value="">Seleccionar empleado...</option>' +
          empRes.data.map(e => `<option value="${e.id_emp}">${escapeHtml(e.nombre)}</option>`).join('');
      }

      // Llenar select de encargados
      const selEnc = document.getElementById('selectEncargado');
      if (selEnc) {
        selEnc.innerHTML = '<option value="">Seleccionar encargado...</option>' +
          encRes.data.map(e => `<option value="${e.id_encargado}">${escapeHtml(e.nombre)}</option>`).join('');
      }

      // Llenar select de herramientas (solo las que tengan stock > 0)
      const selHerr = document.getElementById('selectHerramienta');
      if (selHerr) {
        const disponibles = herrRes.data.filter(h => h.cantidad > 0);
        selHerr.innerHTML = '<option value="">Seleccionar herramienta...</option>' +
          disponibles.map(h => `<option value="${h.codigo_herra}" data-stock="${h.cantidad}">
            ${escapeHtml(h.codigo_herra)} - ${escapeHtml(h.nombre)} (Stock: ${h.cantidad})
          </option>`).join('');
      }

      // Limpiar formulario
      document.getElementById('presMotivo').value = '';
      document.getElementById('presArea').value = '';
      document.getElementById('cantidadHerramienta').value = 1;
      document.getElementById('herramientasSeleccionadas').innerHTML = '';

      openOverlay('modalPrestamo');
    } catch (err) {
      showToast('Error al cargar datos', 'error');
    }
  },

  agregarHerramienta() {
    const sel = document.getElementById('selectHerramienta');
    const cantInput = document.getElementById('cantidadHerramienta');
    const cantidad = parseInt(cantInput?.value || 1);
    
    if (!sel?.value) return showToast('Selecciona una herramienta', 'warning');
    if (cantidad < 1) return showToast('Cantidad debe ser mayor a 0', 'warning');

    const stockDisponible = parseInt(sel.options[sel.selectedIndex].dataset.stock);
    if (cantidad > stockDisponible) {
      return showToast(`Solo hay ${stockDisponible} disponibles`, 'warning');
    }

    // Verificar si ya está agregada
    const ya = this._herramientasSeleccionadas.find(h => h.codigo_herra === sel.value);
    if (ya) return showToast('Esta herramienta ya está agregada', 'warning');

    this._herramientasSeleccionadas.push({
      codigo_herra: sel.value,
      cantidad: cantidad,
      nombre: sel.options[sel.selectedIndex].text
    });

    this.renderHerramientasSeleccionadas();
    sel.value = '';
    cantInput.value = 1;
  },

  renderHerramientasSeleccionadas() {
    const cont = document.getElementById('herramientasSeleccionadas');
    if (!cont) return;

    if (this._herramientasSeleccionadas.length === 0) {
      cont.innerHTML = '<div class="text-muted small">No hay herramientas agregadas</div>';
      return;
    }

    cont.innerHTML = this._herramientasSeleccionadas.map((h, i) => `
      <div class="d-flex justify-content-between align-items-center p-2 mb-1 bg-light rounded">
        <span><i class="bi bi-tools me-2"></i>${escapeHtml(h.nombre)} <strong>× ${h.cantidad}</strong></span>
        <button class="btn btn-sm btn-outline-danger" onclick="PrestamosModule.quitarHerramienta(${i})">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `).join('');
  },

  quitarHerramienta(index) {
    this._herramientasSeleccionadas.splice(index, 1);
    this.renderHerramientasSeleccionadas();
  },

  async save() {
    const id_emp = document.getElementById('selectEmpleado')?.value;
    const id_encargado = document.getElementById('selectEncargado')?.value;
    const motivo_uso = document.getElementById('presMotivo')?.value.trim();
    const area_uso = document.getElementById('presArea')?.value.trim();

    if (!id_emp) return showToast('Selecciona un empleado', 'warning');
    if (!id_encargado) return showToast('Selecciona un encargado', 'warning');
    if (this._herramientasSeleccionadas.length === 0) {
      return showToast('Agrega al menos una herramienta', 'warning');
    }

    try {
      await http('/api/prestamos', 'POST', {
        id_emp,
        id_encargado,
        motivo_uso,
        area_uso,
        herramientas: this._herramientasSeleccionadas
      });
      showToast('Préstamo registrado correctamente');
      closeOverlay('modalPrestamo');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  confirmDevolver(id) {
    if (confirm(`¿Confirmar devolución del préstamo #${id}?\nLas herramientas regresarán al inventario.`)) {
      this.devolver(id);
    }
  },

  async devolver(id) {
    try {
      await http(`/api/prestamos/${id}/devolver`, 'PUT');
      showToast('Préstamo devuelto correctamente');
      await this.renderTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};