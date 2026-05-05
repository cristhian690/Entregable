require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const pool               = require('./config/db');
const { authMiddleware } = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/herramientas',authMiddleware, require('./routes/herramientas'));
app.use('/api/empleados',   authMiddleware, require('./routes/empleados'));
app.use('/api/encargados',  authMiddleware, require('./routes/encargados'));
app.use('/api/proveedores', authMiddleware, require('./routes/proveedores'));
app.use('/api/prestamos',   authMiddleware, require('./routes/prestamos'));
app.use('/api/compras',     authMiddleware, require('./routes/compras'));
app.use('/api/alertas',     authMiddleware, require('./routes/alertas'));
app.use('/api/reportes',    authMiddleware, require('./routes/reportes')); // ✅ activado

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado a MySQL:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  }
})();

app.get('/', (req, res) => res.redirect('/login.html'));

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor en: http://localhost:${PORT}`);
});