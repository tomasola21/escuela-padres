require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '4000'),
    ssl: { rejectUnauthorized: true }
  });

  try {
    // Add grado_id column to formularios
    await pool.query(`ALTER TABLE formularios ADD COLUMN grado_id INT DEFAULT NULL AFTER descripcion`);
    console.log('Column grado_id added to formularios');

    // Add foreign key
    await pool.query(`ALTER TABLE formularios ADD FOREIGN KEY (grado_id) REFERENCES grados(id) ON DELETE SET NULL`);
    console.log('Foreign key added');

    console.log('Migration complete');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column grado_id already exists');
    } else if (err.code === 'ER_DUP_KEY') {
      console.log('Foreign key already exists');
    } else {
      console.error('Migration error:', err.message);
    }
  }

  await pool.end();
}

run();
