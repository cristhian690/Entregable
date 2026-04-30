require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/herramientas', require('./routes/herramientas'));
app.use('/api/empleados',    require('./routes/empleados'));
app.use('/api/encargados',   require('./routes/encargados'));
app.use('/api/proveedores',  require('./routes/proveedores'));
app.use('/api/prestamos',    require('./routes/prestamos'));
app.use('/api/compras',      require('./routes/compras'));
app.use('/api/alertas',      require('./routes/alertas'));

// DB conexión
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(' Conectado a MySQL');
    conn.release();
  } catch (err) {
    console.error(' Error de conexión:', err.message);
  }
})();

// SPA fallback
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(` Servidor corriendo en: http://localhost:${PORT}`);
});