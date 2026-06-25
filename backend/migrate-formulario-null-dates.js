const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function run() {
  const sslConfig = process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {};
  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 1,
    ...sslConfig
  });

  try {
    console.log('Verificando columnas fecha_inicio/fecha_cierre en formularios...');
    const [c] = await pool.query("SHOW COLUMNS FROM formularios WHERE Field IN ('fecha_inicio','fecha_cierre')");
    for (const col of c) {
      if (col.Null === 'NO') {
        console.log(`Haciendo ${col.Field} nullable...`);
        await pool.query(`ALTER TABLE formularios MODIFY COLUMN ${col.Field} DATE NULL`);
        console.log(`  ${col.Field} ahora es NULL`);
      } else {
        console.log(`  ${col.Field} ya es nullable`);
      }
    }
    console.log('Migración completada.');
  } catch (error) {
    console.error('Error:', error);
  }
  await pool.end();
  process.exit(0);
}
run();
