'use strict';

const ROUTES = {
  dashboard:    { title: 'Dashboard',    view: '/views/dashboard.html',    module: () => DashboardModule    },
  herramientas: { title: 'Herramientas', view: '/views/herramientas.html', module: () => HerramientasModule },
  prestamos:    { title: 'Préstamos',    view: '/views/prestamos.html',    module: () => PrestamosModule    },
  compras:      { title: 'Compras',      view: '/views/compras.html',      module: () => ComprasModule      },
  proveedores:  { title: 'Proveedores',  view: '/views/proveedores.html',  module: () => ProveedoresModule  },
  empleados:    { title: 'Empleados',    view: '/views/empleados.html',    module: () => EmpleadosModule    },
  encargados:   { title: 'Encargados',   view: '/views/encargados.html',   module: () => EncargadosModule   },
  alertas:      { title: 'Alertas',      view: '/views/alertas.html',      module: () => AlertasModule      },
  productos:    { title: 'Productos',    view: '/views/productos.html',    module: () => ProductosModule     },
};

const Router = {

  async navigateTo(page) {
    const route = ROUTES[page];
    if (!route) return;

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
    document.getElementById('topbarTitle').textContent = route.title;

    const container = document.getElementById('pageContainer');
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height:60vh"><div class="spinner-custom"></div></div>`;

    try {
      const res  = await fetch(route.view);
      const html = await res.text();
      container.innerHTML = html;
      const mod = route.module();
      if (mod?.init) await mod.init();
    } catch (err) {
      container.innerHTML = `<div class="text-center py-5 text-muted"><i class="bi bi-exclamation-triangle" style="font-size:2rem"></i><p class="mt-2">Error al cargar la vista: ${err.message}</p></div>`;
    }
  },

  init() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(item.dataset.page);
      });
    });

    document.getElementById('btnToggleSidebar')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('show');
    });
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('show');
    });

    this.navigateTo('dashboard');
  }
};