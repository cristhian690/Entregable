'use strict';

const ROUTES = {
  dashboard: {
    title: 'Dashboard',
    view: '/views/dashboard.html',
    module: () => DashboardModule
  },
  herramientas: {
    title: 'Herramientas',
    view: '/views/herramientas.html',
    module: () => HerramientasModule
  },
  empleados: {
    title: 'Empleados',
    view: '/views/empleados.html',
    module: () => EmpleadosModule
  },
  encargados: {
    title: 'Encargados',
    view: '/views/encargados.html',
    module: () => EncargadosModule
  },
  proveedores: {
    title: 'Proveedores',
    view: '/views/proveedores.html',
    module: () => ProveedoresModule
  },
  prestamos: {
    title: 'Préstamos',
    view: '/views/prestamos.html',
    module: () => PrestamosModule
  },
  compras: {
    title: 'Compras',
    view: '/views/compras.html',
    module: () => ComprasModule
  },
  alertas: {
    title: 'Alertas',
    view: '/views/alertas.html',
    module: () => AlertasModule
  }
};

const Router = {

  async navigateTo(page) {
    const route = ROUTES[page];
    if (!route) return;

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    document.getElementById('topbarTitle').textContent = route.title;

    const container = document.getElementById('pageContainer');
    container.innerHTML = `<div class="text-center"><div class="spinner-border"></div></div>`;

    const res = await fetch(route.view);
    const html = await res.text();
    container.innerHTML = html;

    const mod = route.module();
    if (mod?.init) mod.init();
  },

  init() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.navigateTo(item.dataset.page);
      });
    });

    this.navigateTo('dashboard');
  }
};