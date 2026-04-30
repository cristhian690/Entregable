'use strict';

const ProductosModule = {
  async init() {
    console.log('ProductosModule init');
    const container = document.getElementById('pageContainer');
    if (container) {
      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Productos</h1>
        </div>
        <div class="card-panel text-center py-5 text-muted">
          <i class="bi bi-box-seam" style="font-size:3rem"></i>
          <p class="mt-3">Módulo en construcción</p>
        </div>
      `;
    }
  }
};