const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

const generarReporte = async (req, res) => {
  try {
    const { formato, formulario_id, grado_id, seccion_id, estudiante_id, fecha_desde, fecha_hasta } = req.query;

    let query = `
      SELECT a.id, f.nombre as formulario, f.evento, g.nombre as grado, s.nombre as seccion,
             e.nombre_completo as estudiante, e.codigo, a.latitud, a.longitud, a.navegador,
             a.fecha_registro, a.device_id
      FROM asistencias a
      JOIN formularios f ON a.formulario_id = f.id
      JOIN grados g ON a.grado_id = g.id
      JOIN secciones s ON a.seccion_id = s.id
      JOIN estudiantes e ON a.estudiante_id = e.id
    `;
    const params = [];
    const condiciones = [];

    if (formulario_id) { condiciones.push('a.formulario_id = ?'); params.push(formulario_id); }
    if (grado_id) { condiciones.push('a.grado_id = ?'); params.push(grado_id); }
    if (seccion_id) { condiciones.push('a.seccion_id = ?'); params.push(seccion_id); }
    if (estudiante_id) { condiciones.push('a.estudiante_id = ?'); params.push(estudiante_id); }
    if (fecha_desde) { condiciones.push('a.fecha_registro >= ?'); params.push(fecha_desde); }
    if (fecha_hasta) { condiciones.push('a.fecha_registro <= ?'); params.push(fecha_hasta + ' 23:59:59'); }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY a.fecha_registro DESC';

    const [asistencias] = await pool.query(query, params);

    if (formato === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_asistencias.pdf');
      doc.pipe(res);

      doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Asistencias', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, { align: 'center' });
      doc.moveDown(1.5);

      const headers = ['#', 'Formulario', 'Evento', 'Grado', 'Sección', 'Estudiante', 'Fecha', 'Navegador'];
      const widths = [20, 60, 50, 40, 30, 80, 60, 50];
      const tableTop = doc.y;

      doc.fontSize(7).font('Helvetica-Bold');
      let x = 30;
      headers.forEach((h, i) => {
        doc.text(h, x, tableTop, { width: widths[i], align: 'left' });
        x += widths[i];
      });

      doc.moveDown(0.3);
      doc.fontSize(6).font('Helvetica');

      asistencias.forEach((a, idx) => {
        const y = doc.y;
        if (y > 750) {
          doc.addPage();
        }
        x = 30;
        const row = [
          (idx + 1).toString(),
          a.formulario || '',
          a.evento || '',
          a.grado || '',
          a.seccion || '',
          a.estudiante || '',
          new Date(a.fecha_registro).toLocaleString('es-PE'),
          a.navegador || ''
        ];
        row.forEach((val, i) => {
          doc.text(val, x, doc.y, { width: widths[i], align: 'left' });
          x += widths[i];
        });
        doc.moveDown(0.2);
      });

      doc.end();
    } else if (formato === 'xlsx' || formato === 'excel') {
      const data = asistencias.map(a => ({
        ID: a.id,
        Formulario: a.formulario,
        Evento: a.evento,
        Grado: a.grado,
        Sección: a.seccion,
        Estudiante: a.estudiante,
        Código: a.codigo,
        Latitud: a.latitud,
        Longitud: a.longitud,
        Navegador: a.navegador,
        'Fecha Registro': new Date(a.fecha_registro).toLocaleString('es-PE'),
        'Device ID': a.device_id
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_asistencias.xlsx');
      res.send(buffer);
    } else {
      res.json(asistencias);
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

const dashboard = async (req, res) => {
  try {
    const [totalFormularios] = await pool.query('SELECT COUNT(*) as total FROM formularios');
    const [totalRegistros] = await pool.query('SELECT COUNT(*) as total FROM asistencias');
    const [totalGrados] = await pool.query('SELECT COUNT(*) as total FROM grados');
    const [totalSecciones] = await pool.query('SELECT COUNT(*) as total FROM secciones');
    const [totalEstudiantes] = await pool.query('SELECT COUNT(*) as total FROM estudiantes');
    const [formulariosActivos] = await pool.query("SELECT COUNT(*) as total FROM formularios WHERE estado = 'activo'");
    const [formulariosInactivos] = await pool.query("SELECT COUNT(*) as total FROM formularios WHERE estado = 'inactivo'");

    const [asistenciasPorGrado] = await pool.query(
      `SELECT g.nombre, COUNT(*) as total 
       FROM asistencias a 
       JOIN grados g ON a.grado_id = g.id 
       GROUP BY g.id, g.nombre 
       ORDER BY total DESC`
    );

    const [asistenciasPorFormulario] = await pool.query(
      `SELECT f.nombre, COUNT(*) as total 
       FROM asistencias a 
       JOIN formularios f ON a.formulario_id = f.id 
       GROUP BY f.id, f.nombre 
       ORDER BY total DESC`
    );

    const [asistenciasPorFecha] = await pool.query(
      `SELECT DATE(fecha_registro) as fecha, COUNT(*) as total 
       FROM asistencias 
       GROUP BY DATE(fecha_registro) 
       ORDER BY fecha ASC 
       LIMIT 30`
    );

    res.json({
      totalFormularios: totalFormularios[0].total,
      totalRegistros: totalRegistros[0].total,
      totalGrados: totalGrados[0].total,
      totalSecciones: totalSecciones[0].total,
      totalEstudiantes: totalEstudiantes[0].total,
      formulariosActivos: formulariosActivos[0].total,
      formulariosInactivos: formulariosInactivos[0].total,
      asistenciasPorGrado,
      asistenciasPorFormulario,
      asistenciasPorFecha
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { generarReporte, dashboard };
