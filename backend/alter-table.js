const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.execute("ALTER TABLE qrs ADD COLUMN config TEXT DEFAULT NULL AFTER activo");
    console.log('Column config added successfully');
  } catch(e) {
    if (e.message.includes('Duplicate column')) {
      console.log('Column already exists');
    } else {
      console.error('Error:', e.message);
    }
  }

  await pool.end();
}
run();
