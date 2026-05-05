// routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });

  try {
    // Buscar usuario activo
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1 AND deleted_at IS NULL',
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

    const usuario = rows[0];

    // Verificar contraseña con bcrypt
    const passwordOk = await bcrypt.compare(password, usuario.password);
    if (!passwordOk)
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

    // Generar token JWT (expira en 8 horas)
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        nombre:     usuario.nombre,
        email:      usuario.email,
        rol:        usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Actualizar último login
    await pool.query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id_usuario = ?',
      [usuario.id_usuario]
    );

    res.json({
      success: true,
      message: `Bienvenido, ${usuario.nombre}`,
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre:     usuario.nombre,
        email:      usuario.email,
        rol:        usuario.rol
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me — verificar sesión activa
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, usuario: req.usuario });
});

// POST /api/auth/logout — el cliente elimina el token
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada' });
});

module.exports = router;