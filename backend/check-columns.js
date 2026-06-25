const mysql = require('mysql2/promise');
require('dotenv').config({path: require('path').resolve(__dirname, '.env')});
(async () => {
  const ssl = process.env.DB_SSL === 'true' ? {ssl: {rejectUnauthorized: false}} : {};
  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ...ssl, waitForConnections: true, connectionLimit: 1
  });
  const [c] = await pool.query("SHOW COLUMNS FROM formularios WHERE Field IN ('fecha_inicio','fecha_cierre')");
  c.forEach(r => console.log(r.Field, r.Type, r.Null));
  await pool.end();
})();
