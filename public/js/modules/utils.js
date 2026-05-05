'use strict';

// http() está definida en auth.js — NO duplicar aquí

/* ════════════════════════════════════════════
   TOASTS
════════════════════════════════════════════ */
function showToast(msg, type = 'success') {
  const map = {
    success: { icon: 'bi-check-circle-fill', cls: 'toast-success' },
    error:   { icon: 'bi-x-circle-fill',     cls: 'toast-error'   },
    info:    { icon: 'bi-info-circle-fill',  cls: 'toast-info'    },
    warning: { icon: 'bi-exclamation-triangle-fill', cls: 'toast-warning' }
  };

  const t = map[type] || map.info;

  const el = document.createElement('div');
  el.className = `toast-item ${t.cls}`;
  el.innerHTML = `
    <i class="bi ${t.icon} toast-icon"></i>
    <span>${msg}</span>
  `;

  document.getElementById('toastContainer').appendChild(el);

  setTimeout(() => el.remove(), 3500);
}

/* ════════════════════════════════════════════
   FORMULARIOS
════════════════════════════════════════════ */
function setError(inputId, errId, msg) {
  document.getElementById(inputId)?.classList.add('is-invalid');
  const err = document.getElementById(errId);
  if (err) err.textContent = msg;
}

function clearErrors(inputIds) {
  inputIds.forEach(id => {
    document.getElementById(id)?.classList.remove('is-invalid');
    const err = document.getElementById('err-' + id);
    if (err) err.textContent = '';
  });
}

function setLoading(btnId, textId, spinnerId, loading) {
  const btn = document.getElementById(btnId);
  if (btn) btn.disabled = loading;

  document.getElementById(textId)?.classList.toggle('d-none', loading);
  document.getElementById(spinnerId)?.classList.toggle('d-none', !loading);
}

/* ════════════════════════════════════════════
   UI HELPERS
════════════════════════════════════════════ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function openOverlay(id)  { document.getElementById(id)?.classList.add('open'); }
function closeOverlay(id) { document.getElementById(id)?.classList.remove('open'); }

/* ════════════════════════════════════════════
   FORMATTERS
════════════════════════════════════════════ */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* 💰 Para compras */
function formatPrecio(val) {
  return parseFloat(val || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* 📅 Para préstamos / devoluciones */
function formatFecha(fechaStr) {
  if (!fechaStr) return '—';

  const fecha = new Date(fechaStr);

  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/* ════════════════════════════════════════════
   FUNCIONES NUEVAS (CLAVE PARA TU SISTEMA)
════════════════════════════════════════════ */

/* 🔧 Estado de herramientas */
function getEstadoBadge(estado) {
  const map = {
    bueno:   'badge-success',
    regular: 'badge-warning',
    malo:    'badge-danger'
  };
  return map[estado] || 'badge-secondary';
}

/* 📄 Estado de préstamo */
function getEstadoPrestamo(estado) {
  const map = {
    activo:    'badge-warning',
    devuelto:  'badge-success',
    parcial:   'badge-info',
    cancelado: 'badge-danger'
  };
  return map[estado] || 'badge-secondary';
}

/* 📦 Stock bajo */
function isStockBajo(cantidad, minimo) {
  return cantidad <= minimo;
}

/* 🔢 Formato número */
function formatNumber(val) {
  return Number(val || 0).toLocaleString('es-PE');
}

/* 📊 Texto de stock */
function getStockStatus(cantidad, minimo) {
  if (cantidad === 0) return 'Sin stock';
  if (cantidad <= minimo) return 'Stock bajo';
  return 'Disponible';
}

