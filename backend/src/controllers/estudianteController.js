const pool = require('../config/database');
const XLSX = require('xlsx');

const listar = async (req, res) => {
  try {
    const { grado_id, seccion_id } = req.query;
    let query = `
      SELECT e.*, g.nombre as grado_nombre, s.nombre as seccion_nombre
      FROM estudiantes e
      JOIN grados g ON e.grado_id = g.id
      JOIN secciones s ON e.seccion_id = s.id
    `;
    const params = [];
    const condiciones = [];

    if (grado_id) {
      condiciones.push('e.grado_id = ?');
      params.push(grado_id);
    }
    if (seccion_id) {
      condiciones.push('e.seccion_id = ?');
      params.push(seccion_id);
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }

    query += ' ORDER BY e.nombre_completo ASC';

    const [estudiantes] = await pool.query(query, params);
    res.json(estudiantes);
  } catch (error) {
    console.error('Error al listar estudiantes:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const [estudiantes] = await pool.query(
      `SELECT e.*, g.nombre as grado_nombre, s.nombre as seccion_nombre
       FROM estudiantes e
       JOIN grados g ON e.grado_id = g.id
       JOIN secciones s ON e.seccion_id = s.id
       WHERE e.id = ?`,
      [id]
    );
    if (estudiantes.length === 0) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado.' });
    }
    res.json(estudiantes[0]);
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const crear = async (req, res) => {
  try {
    const { codigo, nombre_completo, grado_id, seccion_id } = req.body;
    const [resultado] = await pool.query(
      'INSERT INTO estudiantes (codigo, nombre_completo, grado_id, seccion_id) VALUES (?, ?, ?, ?)',
      [codigo, nombre_completo, grado_id, seccion_id]
    );
    const [nuevo] = await pool.query(
      `SELECT e.*, g.nombre as grado_nombre, s.nombre as seccion_nombre
       FROM estudiantes e
       JOIN grados g ON e.grado_id = g.id
       JOIN secciones s ON e.seccion_id = s.id
       WHERE e.id = ?`,
      [resultado.insertId]
    );
    res.status(201).json(nuevo[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: 'El código del estudiante ya existe.' });
    }
    console.error('Error al crear estudiante:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre_completo, grado_id, seccion_id } = req.body;
    const [existente] = await pool.query('SELECT * FROM estudiantes WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado.' });
    }
    await pool.query(
      'UPDATE estudiantes SET codigo = ?, nombre_completo = ?, grado_id = ?, seccion_id = ? WHERE id = ?',
      [codigo, nombre_completo, grado_id, seccion_id, id]
    );
    const [actualizado] = await pool.query(
      `SELECT e.*, g.nombre as grado_nombre, s.nombre as seccion_nombre
       FROM estudiantes e
       JOIN grados g ON e.grado_id = g.id
       JOIN secciones s ON e.seccion_id = s.id
       WHERE e.id = ?`,
      [id]
    );
    res.json(actualizado[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: 'El código del estudiante ya existe.' });
    }
    console.error('Error al actualizar estudiante:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const [existente] = await pool.query('SELECT * FROM estudiantes WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado.' });
    }
    await pool.query('DELETE FROM estudiantes WHERE id = ?', [id]);
    res.json({ mensaje: 'Estudiante eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const importarExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se ha subido ningún archivo.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const datos = XLSX.utils.sheet_to_json(hoja);

    let importados = 0;
    let errores = 0;
    const erroresLista = [];

    for (const fila of datos) {
      try {
        const codigo = fila['Código'] || fila['CODIGO'] || fila['codigo'] || '';
        const nombre = fila['Nombre'] || fila['NOMBRE'] || fila['nombre_completo'] || fila['Nombre completo'] || '';
        const gradoNombre = fila['Grado'] || fila['GRADO'] || fila['grado'] || '';
        const seccionNombre = fila['Sección'] || fila['SECCION'] || fila['seccion'] || fila['Seccion'] || '';

        if (!codigo || !nombre || !gradoNombre || !seccionNombre) {
          errores++;
          erroresLista.push({ fila: importados + errores, error: 'Campos incompletos' });
          continue;
        }

        let [grados] = await pool.query('SELECT id FROM grados WHERE nombre = ?', [gradoNombre]);
        if (grados.length === 0) {
          const [r] = await pool.query('INSERT INTO grados (nombre) VALUES (?)', [gradoNombre]);
          grados = [{ id: r.insertId }];
        }

        let [secciones] = await pool.query('SELECT id FROM secciones WHERE nombre = ?', [seccionNombre]);
        if (secciones.length === 0) {
          const [r] = await pool.query('INSERT INTO secciones (nombre) VALUES (?)', [seccionNombre]);
          secciones = [{ id: r.insertId }];
        }

        await pool.query(
          'INSERT INTO estudiantes (codigo, nombre_completo, grado_id, seccion_id) VALUES (?, ?, ?, ?)',
          [codigo, nombre, grados[0].id, secciones[0].id]
        );
        importados++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          errores++;
          erroresLista.push({ fila: importados + errores, error: 'Código duplicado: ' + fila['Código'] });
        } else {
          errores++;
          erroresLista.push({ fila: importados + errores, error: error.message });
        }
      }
    }

    res.json({
      mensaje: `Importación completada. ${importados} importados, ${errores} errores.`,
      importados,
      errores,
      detalles: erroresLista
    });
  } catch (error) {
    console.error('Error al importar Excel:', error);
    res.status(500).json({ mensaje: 'Error al procesar el archivo Excel.' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, importarExcel };
