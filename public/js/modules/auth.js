'use strict';

/* ════════════════════════════════════════════
   HTTP HELPER — incluye JWT en cada petición
════════════════════════════════════════════ */
async function http(url, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };

  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);

  if (res.status === 401) {
    Auth.logout();
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

/* ════════════════════════════════════════════
   AUTH
════════════════════════════════════════════ */
const Auth = {
  protectPage() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
    }
  },

  renderUser() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const nameEl = document.getElementById('sidebarUserName');
      const rolEl  = document.getElementById('sidebarUserRol');
      if (nameEl) nameEl.textContent = payload.nombre || payload.email || 'Usuario';
      if (rolEl)  rolEl.textContent  = payload.rol || '';
    } catch (_) { /* token malformado */ }
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }
};
