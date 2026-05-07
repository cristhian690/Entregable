'use strict';


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

  if (res.status === 401 || res.status === 403) {
    Auth.logout();
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

const Auth = {
  protectPage() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
    }
  },

  getUsuario() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (_) { return null; }
  },

  renderUser() {
    const u = this.getUsuario();
    if (!u) return;

    const rolBadge = {
      admin:     '🔑 Administrador',
      encargado: '📋 Encargado',
      empleado:  '👷 Empleado'
    };

    const nameEl = document.getElementById('sidebarUserName');
    const rolEl  = document.getElementById('sidebarUserRol');

    if (nameEl) nameEl.textContent = u.nombre;
    if (rolEl)  rolEl.textContent  = rolBadge[u.rol] || u.rol;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }
};
