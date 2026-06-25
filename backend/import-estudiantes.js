const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const EXCEL_PATH = 'C:\\Users\\Hp Core i7\\Downloads\\LISTAS 2026.xlsx';

const gradeMap = {
  '1': { db: '1° Primaria' }, '2': { db: '2° Primaria' }, '3': { db: '3° Primaria' },
  '4': { db: '4° Primaria' }, '5': { db: '5° Primaria' }, '6': { db: '6° Primaria' },
  '1ro': { db: '1° Secundaria' }, '2do': { db: '2° Secundaria' }, '3ro': { db: '3° Secundaria' },
  '4to': { db: '4° Secundaria' }, '5to': { db: '5° Secundaria' },
};

function parseSection(row) {
  if (!row || !row[1]) return null;
  const txt = String(row[1]).trim();
  const m = txt.match(/(\w+)\s+\"(\w)\"\s+de\s+(Primaria|Secundaria)/i);
  if (!m) return null;
  return { seccion: m[2], gradoNombre: `${m[1]} ${m[3]}` };
}

async function run() {
  const sslConfig = process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {};
  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 5,
    ...sslConfig
  });

  try {
    const wb = XLSX.readFile(EXCEL_PATH);

    const [grados] = await pool.query('SELECT id, nombre FROM grados');
    const [secciones] = await pool.query('SELECT id, nombre FROM secciones');
    const gradoDb = Object.fromEntries(grados.map(g => [g.nombre, g.id]));
    const seccionDb = Object.fromEntries(secciones.map(s => [s.nombre, s.id]));

    let total = 0;

    for (const [sheetName, info] of Object.entries(gradeMap)) {
      if (!wb.SheetNames.includes(sheetName)) continue;

      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      let currentSeccion = null;
      let currentGradoId = null;
      let currentSeccionLetra = '';
      let values = [];
      let contador = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const header = parseSection(row);

        if (header) {
          if (values.length > 0 && currentGradoId && currentSeccion) {
            await pool.query('INSERT IGNORE INTO estudiantes (codigo, nombre_completo, grado_id, seccion_id) VALUES ?', [values]);
            total += values.length;
          }
          currentSeccionLetra = header.seccion;
          currentSeccion = seccionDb[header.seccion];
          currentGradoId = gradoDb[gradeMap[sheetName].db];
          values = [];
          contador = 0;
          continue;
        }

        if (!currentSeccion || !currentGradoId) continue;
        if (!row || !row[1]) continue;
        const nombre = String(row[1]).trim();
        if (!nombre) continue;

        contador++;
        const codigo = `${sheetName}${currentSeccionLetra}${String(contador).padStart(3, '0')}`;
        values.push([codigo, nombre, currentGradoId, currentSeccion]);
      }

      if (values.length > 0 && currentGradoId && currentSeccion) {
        await pool.query('INSERT IGNORE INTO estudiantes (codigo, nombre_completo, grado_id, seccion_id) VALUES ?', [values]);
        total += values.length;
      }

      console.log(`${sheetName} (${info.db})`);
    }

    const [r] = await pool.query('SELECT COUNT(*) as c FROM estudiantes');
    console.log(`\nTotal estudiantes importados: ${r[0].c}`);
  } catch (error) {
    console.error('Error:', error);
  }

  await pool.end();
  process.exit(0);
}

run();
