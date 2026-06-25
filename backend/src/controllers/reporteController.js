const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

const generarReporte = async (req, res) => {
  try {
    const { formato, formulario_id, grado_id, seccion_id, estudiante_id, fecha_desde, fecha_hasta } = req.query;

    let query = `
      SELECT a.id, f.nombre as formulario, ev.nombre as evento, g.nombre as grado, s.nombre as seccion,
             e.nombre_completo as estudiante, e.codigo, a.latitud, a.longitud, a.navegador,
             a.fecha_registro, a.device_id, a.registrado_por
      FROM asistencias a
      JOIN formularios f ON a.formulario_id = f.id
      LEFT JOIN eventos ev ON f.evento_id = ev.id
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

      const headers = ['#', 'Taller', 'Evento', 'Grado', 'Sección', 'Estudiante', 'Fecha', 'Navegador'];
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
        Taller: a.formulario,
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
    } else if (formato === 'doc' || formato === 'word') {
      const rows = asistencias.map((a, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${a.formulario || ''}</td>
          <td>${a.evento || ''}</td>
          <td>${a.grado || ''}</td>
          <td>${a.seccion || ''}</td>
          <td>${a.estudiante || ''}</td>
          <td>${a.codigo || ''}</td>
          <td>${a.registrado_por || ''}</td>
          <td>${new Date(a.fecha_registro).toLocaleString('es-PE')}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Reporte de Asistencias</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;margin:40px}
h1{text-align:center;color:#1a365d;font-size:18pt}
.sub{text-align:center;color:#666;font-size:10pt;margin-bottom:20px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th{background:#1a365d;color:#fff;padding:8px 6px;font-size:9pt;text-align:left}
td{border:1px solid #ccc;padding:6px;font-size:9pt}
tr:nth-child(even){background:#f5f7fa}
</style></head><body>
<h1>Reporte de Asistencias</h1>
<p class="sub">Generado: ${new Date().toLocaleDateString('es-PE')} | Total: ${asistencias.length} registros</p>
<table><thead><tr>
<th>#</th><th>Taller</th><th>Evento</th><th>Grado</th><th>Sección</th><th>Estudiante</th><th>Código</th><th>Registrado por</th><th>Fecha</th>
</tr></thead><tbody>${rows}</tbody></table></body></html>`;

      res.setHeader('Content-Type', 'application/msword');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_asistencias.doc');
      res.send(html);
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
    const { formulario_id, grado_id, seccion_id, fecha_desde, fecha_hasta } = req.query;

    const where = [];
    const params = [];
    if (formulario_id) { where.push('a.formulario_id = ?'); params.push(formulario_id); }
    if (grado_id) { where.push('a.grado_id = ?'); params.push(grado_id); }
    if (seccion_id) { where.push('a.seccion_id = ?'); params.push(seccion_id); }
    if (fecha_desde) { where.push('a.fecha_registro >= ?'); params.push(fecha_desde); }
    if (fecha_hasta) { where.push('a.fecha_registro <= ?'); params.push(fecha_hasta + ' 23:59:59'); }
    const whereStr = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';

    const [totalFormularios] = await pool.query('SELECT COUNT(*) as total FROM formularios');
    const [totalGrados] = await pool.query('SELECT COUNT(*) as total FROM grados');
    const [totalSecciones] = await pool.query('SELECT COUNT(*) as total FROM secciones');
    const [totalEstudiantes] = await pool.query('SELECT COUNT(*) as total FROM estudiantes');

    const [totalRegistros] = await pool.query('SELECT COUNT(*) as total FROM asistencias a' + whereStr, params);
    const [formulariosActivos] = await pool.query("SELECT COUNT(*) as total FROM formularios WHERE estado = 'activo'");
    const [formulariosInactivos] = await pool.query("SELECT COUNT(*) as total FROM formularios WHERE estado = 'inactivo'");

    const [asistenciasPorGrado] = await pool.query(
      `SELECT g.nombre, COUNT(*) as total FROM asistencias a JOIN grados g ON a.grado_id = g.id${whereStr} GROUP BY g.id, g.nombre ORDER BY total DESC`,
      params
    );

    const [asistenciasPorSeccion] = await pool.query(
      `SELECT s.nombre, COUNT(*) as total FROM asistencias a JOIN secciones s ON a.seccion_id = s.id${whereStr} GROUP BY s.id, s.nombre ORDER BY total DESC`,
      params
    );

    const [asistenciasPorFormulario] = await pool.query(
      `SELECT f.nombre, COUNT(*) as total FROM asistencias a JOIN formularios f ON a.formulario_id = f.id${whereStr} GROUP BY f.id, f.nombre ORDER BY total DESC`,
      params
    );

    const [asistenciasPorFecha] = await pool.query(
      `SELECT DATE(a.fecha_registro) as fecha, COUNT(*) as total FROM asistencias a${whereStr} GROUP BY DATE(a.fecha_registro) ORDER BY fecha ASC`,
      params
    );

    const [recientes] = await pool.query(
      `SELECT a.*, f.nombre as formulario_nombre, ev.nombre as evento_nombre, g.nombre as grado_nombre, s.nombre as seccion_nombre, e.nombre_completo as estudiante_nombre
       FROM asistencias a
       JOIN formularios f ON a.formulario_id = f.id
       LEFT JOIN eventos ev ON f.evento_id = ev.id
       JOIN grados g ON a.grado_id = g.id
       JOIN secciones s ON a.seccion_id = s.id
       JOIN estudiantes e ON a.estudiante_id = e.id
       ${whereStr}
       ORDER BY a.fecha_registro DESC
       LIMIT 10`,
      params
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
      asistenciasPorSeccion,
      asistenciasPorFormulario,
      asistenciasPorFecha,
      recientes
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
};

module.exports = { generarReporte, dashboard };
