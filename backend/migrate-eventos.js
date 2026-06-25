const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function run() {
  const sslConfig = process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {};

  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 1,
    ...sslConfig, multipleStatements: true
  });

  try {
    console.log('Creando tablas eventos y formulario_grados...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS eventos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        logo LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS formulario_grados (
        formulario_id INT NOT NULL,
        grado_id INT NOT NULL,
        PRIMARY KEY (formulario_id, grado_id),
        FOREIGN KEY (formulario_id) REFERENCES formularios(id) ON DELETE CASCADE,
        FOREIGN KEY (grado_id) REFERENCES grados(id) ON DELETE CASCADE
      );
    `);
    console.log('Tablas creadas.');

    // Check if columna evento_id exists
    const [cols] = await pool.query("SHOW COLUMNS FROM formularios LIKE 'evento_id'");
    if (cols.length === 0) {
      console.log('Agregando columna evento_id a formularios...');
      await pool.query('ALTER TABLE formularios ADD COLUMN evento_id INT DEFAULT NULL');
      await pool.query('ALTER TABLE formularios ADD FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL');
      console.log('Columna evento_id agregada.');
    } else {
      console.log('Columna evento_id ya existe.');
    }

    console.log('Migración completada exitosamente.');
  } catch (error) {
    console.error('Error en migración:', error);
  }

  await pool.end();
  process.exit(0);
}

run();
