const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const { peruInicioDia, peruFinDia } = require('../utils/helpers');

const cacheDirecciones = {};

const obtenerDireccion = async (lat, lng) => {
  if (!lat || !lng) return null;
  const key = `${lat},${lng}`;
  if (cacheDirecciones[key]) return cacheDirecciones[key];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json();
    cacheDirecciones[key] = data.display_name || null;
    return cacheDirecciones[key];
  } catch {
    return null;
  }
};

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
    if (fecha_desde) { condiciones.push('a.fecha_registro >= ?'); params.push(peruInicioDia(fecha_desde)); }
    if (fecha_hasta) { condiciones.push('a.fecha_registro <= ?'); params.push(peruFinDia(fecha_hasta)); }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ' ORDER BY a.fecha_registro DESC';

    const [asistencias] = await pool.query(query, params);

    const direcciones = await Promise.all(
      asistencias.map(a => obtenerDireccion(a.latitud, a.longitud))
    );
    asistencias.forEach((a, i) => {
      a.direccion = direcciones[i] || null;
    });

    if (formato === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_asistencias.pdf');
      doc.pipe(res);

      doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Asistencias', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, { align: 'center' });
      doc.moveDown(1.5);

      const headers = ['#', 'Estudiante', 'Código', 'Taller', 'Evento', 'Grado', 'Sección', 'Quien asiste', 'Navegador', 'Fecha'];
      const widths = [18, 80, 45, 55, 40, 30, 25, 40, 40, 55];
      const tableTop = doc.y;

      doc.fontSize(6.5).font('Helvetica-Bold');
      let x = 30;
      headers.forEach((h, i) => {
        doc.text(h, x, tableTop, { width: widths[i], align: 'left' });
        x += widths[i];
      });

      doc.moveDown(0.2);
      doc.fontSize(6).font('Helvetica');

      asistencias.forEach((a, idx) => {
        const y = doc.y;
        if (y > 745) {
          doc.addPage();
        }
        x = 30;
        const row = [
          (idx + 1).toString(),
          a.estudiante || '',
          a.codigo || '',
          a.formulario || '',
          a.evento || '',
          a.grado || '',
          a.seccion || '',
          a.registrado_por || '',
          a.navegador || '',
          new Date(a.fecha_registro).toLocaleString('es-PE')
        ];
        row.forEach((val, i) => {
          doc.text(val, x, doc.y, { width: widths[i], align: 'left' });
          x += widths[i];
        });
        doc.moveDown(0.15);
      });

      doc.end();
    } else if (formato === 'xlsx' || formato === 'excel') {
      const data = asistencias.map(a => ({
        '#': a.id,
        Estudiante: a.estudiante,
        Código: a.codigo,
        Taller: a.formulario,
        Evento: a.evento,
        Grado: a.grado,
        Sección: a.seccion,
        'Quien asiste': a.registrado_por,
        Navegador: a.navegador,
        'Fecha Registro': new Date(a.fecha_registro).toLocaleString('es-PE'),
        'Device ID': a.device_id,
        Dirección: a.direccion || 'No disponible'
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
          <td>${a.estudiante || ''}</td>
          <td>${a.codigo || ''}</td>
          <td>${a.formulario || ''}</td>
          <td>${a.evento || ''}</td>
          <td>${a.grado || ''}</td>
          <td>${a.seccion || ''}</td>
          <td>${a.registrado_por || ''}</td>
          <td>${a.navegador || ''}</td>
          <td>${new Date(a.fecha_registro).toLocaleString('es-PE')}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Reporte de Asistencias</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:10pt;margin:30px}
h1{text-align:center;color:#1a365d;font-size:16pt}
.sub{text-align:center;color:#666;font-size:9pt;margin-bottom:16px}
table{width:100%;border-collapse:collapse;margin-top:12px}
th{background:#1a365d;color:#fff;padding:6px 5px;font-size:8pt;text-align:left;white-space:nowrap}
td{border:1px solid #bbb;padding:4px 5px;font-size:8pt}
tr:nth-child(even){background:#f5f7fa}
</style></head><body>
<h1>Reporte de Asistencias</h1>
<p class="sub">Generado: ${new Date().toLocaleDateString('es-PE')} | Total: ${asistencias.length} registros</p>
<table><thead><tr>
<th>#</th><th>Estudiante</th><th>Código</th><th>Taller</th><th>Evento</th><th>Grado</th><th>Sección</th><th>Quien asiste</th><th>Navegador</th><th>Fecha</th>
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
    if (fecha_desde) { where.push('a.fecha_registro >= ?'); params.push(peruInicioDia(fecha_desde)); }
    if (fecha_hasta) { where.push('a.fecha_registro <= ?'); params.push(peruFinDia(fecha_hasta)); }
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
      `SELECT DATE(a.fecha_registro - INTERVAL 5 HOUR) as fecha, COUNT(*) as total FROM asistencias a${whereStr} GROUP BY DATE(a.fecha_registro - INTERVAL 5 HOUR) ORDER BY fecha ASC`,
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
