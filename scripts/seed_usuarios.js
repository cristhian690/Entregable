require('dotenv').config();
const bcrypt = require('bcrypt');
const pool   = require('../config/db');

async function hashPasswords() {
  const [usuarios] = await pool.query('SELECT id_usuario, password FROM usuarios');

  for (const u of usuarios) {
    if (!u.password.startsWith('$2b$')) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [hash, u.id_usuario]);
      console.log(`✅ Usuario ${u.id_usuario} hasheado`);
    } else {
      console.log(`⏩ Usuario ${u.id_usuario} ya está hasheado`);
    }
  }

  console.log('✅ Todos los passwords procesados');
  process.exit(0);
}

hashPasswords().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});