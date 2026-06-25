const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const EXCEL_PATH = 'C:\\Users\\Hp Core i7\\Downloads\\LISTAS 2026.xlsx';

const sheetGradeMap = {
  '1': { grado: '1° Primaria', seccion: 'A' },
  '2': { grado: '2° Primaria', seccion: 'A' },
  '3': { grado: '3° Primaria', seccion: 'A' },
  '4': { grado: '4° Primaria', seccion: 'A' },
  '5': { grado: '5° Primaria', seccion: 'A' },
  '6': { grado: '6° Primaria', seccion: 'A' },
  '1ro': { grado: '1° Secundaria', seccion: 'A' },
  '2do': { grado: '2° Secundaria', seccion: 'A' },
  '3ro': { grado: '3° Secundaria', seccion: 'A' },
  '4to': { grado: '4° Secundaria', seccion: 'A' },
  '5to': { grado: '5° Secundaria', seccion: 'A' },
};

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

    const [gradosExistentes] = await pool.query('SELECT id, nombre FROM grados');
    const [seccionesExistentes] = await pool.query('SELECT id, nombre FROM secciones');
    const [existentes] = await pool.query('SELECT codigo FROM estudiantes');
    const codigosExistentes = new Set(existentes.map(e => e.codigo));
    console.log('Estudiantes existentes en BD antes de importar:', existentes.length);

    const gradoMap = Object.fromEntries(gradosExistentes.map(g => [g.nombre, g.id]));
    const seccionMap = Object.fromEntries(seccionesExistentes.map(s => [s.nombre, s.id]));

    let totalImportados = 0;
    let totalOmitidos = 0;
    let totalErrores = 0;

    for (const [sheetName, info] of Object.entries(sheetGradeMap)) {
      if (!wb.SheetNames.includes(sheetName)) continue;

      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const gradoId = gradoMap[info.grado];
      const seccionId = seccionMap[info.seccion];
      if (!gradoId || !seccionId) continue;

      let importados = 0;
      let omitidos = 0;
      let errores = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[1]) continue;
        const nombre = String(row[1]).trim().replace(/\s+/g, ' ');
        if (!nombre) continue;
        const codigo = `2026-${sheetName}-${String(i).padStart(3, '0')}`;

        if (codigosExistentes.has(codigo)) {
          omitidos++;
          continue;
        }

        try {
          await pool.query(
            'INSERT INTO estudiantes (codigo, nombre_completo, grado_id, seccion_id) VALUES (?, ?, ?, ?)',
            [codigo, nombre, gradoId, seccionId]
          );
          importados++;
          codigosExistentes.add(codigo);
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            omitidos++;
          } else {
            errores++;
            if (errores <= 5) console.error(`  Error ${nombre}:`, err.message);
          }
        }
      }
      console.log(`${sheetName} (${info.grado}): importados=${importados}, omitidos=${omitidos}, errores=${errores}`);
      totalImportados += importados;
      totalOmitidos += omitidos;
      totalErrores += errores;
    }

    const [total] = await pool.query('SELECT COUNT(*) as c FROM estudiantes');
    console.log(`\nTotal: importados=${totalImportados}, omitidos=${totalOmitidos}, errores=${totalErrores}`);
    console.log(`Total estudiantes en BD: ${total[0].c}`);
  } catch (error) {
    console.error('Error:', error);
  }

  await pool.end();
  process.exit(0);
}

run();
