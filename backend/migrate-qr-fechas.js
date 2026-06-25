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

    const [cols] = await pool.query("SHOW COLUMNS FROM qrs LIKE 'fecha_inicio'");
    if (cols.length === 0) {
      console.log('Agregando fecha_inicio/fecha_cierre a qrs...');
      await pool.query('ALTER TABLE qrs ADD COLUMN fecha_inicio DATE NULL, ADD COLUMN fecha_cierre DATE NULL');
      console.log('Columnas agregadas a qrs.');
    } else {
      console.log('Columnas fecha_inicio/fecha_cierre ya existen en qrs.');
    }

    const [fkCols] = await pool.query("SHOW COLUMNS FROM asistencias LIKE 'qr_id'");
    if (fkCols.length === 0) {
      console.log('Agregando qr_id a asistencias...');
      await pool.query('ALTER TABLE asistencias ADD COLUMN qr_id INT NULL');
      try {
        await pool.query('ALTER TABLE asistencias ADD FOREIGN KEY (qr_id) REFERENCES qrs(id) ON DELETE SET NULL');
      } catch (e) {
        console.log('Nota: FK no agregada (puede ya existir o fallar):', e.message);
      }
      console.log('Columna qr_id agregada a asistencias.');
    } else {
      console.log('Columna qr_id ya existe en asistencias.');
    }

    console.log('Migración completada exitosamente.');
  } catch (error) {
    console.error('Error en migración:', error);
  }

  await pool.end();
  process.exit(0);
}

run();
