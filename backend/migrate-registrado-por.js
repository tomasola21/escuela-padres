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
    console.log('Ejecutando migración...');

    const [cols] = await pool.query("SHOW COLUMNS FROM asistencias LIKE 'registrado_por'");
    if (cols.length === 0) {
      console.log('Agregando registrado_por a asistencias...');
      await pool.query("ALTER TABLE asistencias ADD COLUMN registrado_por VARCHAR(50) DEFAULT NULL AFTER navegador");
      console.log('Columna registrado_por agregada.');
    } else {
      console.log('Columna registrado_por ya existe.');
    }

    console.log('Migración completada exitosamente.');
  } catch (error) {
    console.error('Error en migración:', error);
  }

  await pool.end();
  process.exit(0);
}

run();
