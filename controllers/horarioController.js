const db = require("../config/db");
const PDFDocument = require('pdfkit');

function calcularHoraFin(horaInicio) {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    let fecha = new Date();
    fecha.setHours(horas, minutos + 50); 
    return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

exports.verTodosLosHorarios = async (req, res) => {
    const sql = `
        SELECT h.*, d.nombre as docente, m.nombre as materia, g.nombre as grupo, a.nombre as aula
        FROM horarios h
        JOIN docentes d ON h.id_docente = d.id_docente
        JOIN materias m ON h.id_materia = m.id_materia
        JOIN grupos g ON h.id_grupo = g.id_grupo
        JOIN aulas a ON h.id_aula = a.id_aula
        WHERE h.estado = 'activo'
        ORDER BY h.dia, h.hora_inicio ASC
    `;
    try {
        const [results] = await db.query(sql);
        res.render("horarios", { horario: results, usuario: req.session.usuario });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar los horarios");
    }
};

exports.eliminarHorario = async (req, res) => {
    try {
        await db.query("UPDATE horarios SET estado = 'inactivo' WHERE id_horario = ?", [req.params.id]);
        res.redirect("/horarios?mensaje=eliminado");
    } catch (err) {
        res.status(500).send("Error al eliminar");
    }
};

exports.confirmarHorarios = async (req, res) => {
    const { horarios } = req.body;
    
    try {
        
        for (const h of horarios) {
            const [conflictos] = await db.query(
                `SELECT * FROM horarios 
                 WHERE dia = ? AND estado = 'activo' AND (
                    (hora_inicio < ? AND hora_fin > ?)
                 ) AND (id_docente = ? OR id_aula = ? OR id_grupo = ?)`,
                [h.dia, h.hora_fin, h.hora_inicio, h.id_docente, h.id_aula, h.id_grupo]
            );

            if (conflictos.length > 0) {
                return res.status(400).json({ 
                    error: `Conflicto detectado en la clase de ${h.docente}. Alguien más ocupó el espacio.` 
                });
            }
        }

        const sqlInsert = `
            INSERT INTO horarios (id_docente, id_materia, id_grupo, id_aula, dia, hora_inicio, hora_fin) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        for (const h of horarios) {
            await db.query(sqlInsert, [
                h.id_docente, 
                h.id_materia, 
                h.id_grupo, 
                h.id_aula, 
                h.dia, 
                h.hora_inicio, 
                h.hora_fin
            ]);
        }

        res.sendStatus(200);

    } catch (e) { 
        console.error("Error al guardar:", e);
        res.status(500).send("Error en el servidor: " + e.message); 
    }
};


exports.imprimirPDF = async (req, res) => {
    const id_docente = req.session.usuario.id_docente;
    const nombreDocente = req.session.usuario.nombre;

    const sql = `
        SELECT h.dia, 
               TIME_FORMAT(h.hora_inicio, '%H:%i') as hora_inicio, 
               TIME_FORMAT(h.hora_fin, '%H:%i') as hora_fin, 
               m.nombre as materia, g.nombre as grupo, a.nombre as aula 
        FROM horarios h 
        JOIN materias m ON h.id_materia = m.id_materia 
        JOIN grupos g ON h.id_grupo = g.id_grupo 
        JOIN aulas a ON h.id_aula = a.id_aula
        WHERE h.id_docente = ? AND h.estado = 'activo' 
        ORDER BY FIELD(h.dia, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'), h.hora_inicio`;

    try {
        const [results] = await db.query(sql, [id_docente]);
        const doc = new PDFDocument({ 
            margin: 50, 
            size: 'A4',
            bufferPages: true 
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Horario_${nombreDocente.replace(/\s+/g, '_')}.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, 612, 100).fill('#003366'); // Franja azul superior (CBTis)
        doc.fillColor('white').fontSize(22).text('CBTis 234', 50, 40, { weight: 'bold' });
        doc.fontSize(12).text('Sistema de Planeación Académica', 50, 65);
        doc.moveDown(4);

        doc.fillColor('black').fontSize(14).font('Helvetica-Bold').text('REPORTE DE HORARIO SEMANAL', { align: 'center' });
        doc.moveDown(0.5);
        doc.rect(50, doc.y, 495, 2).fill('#eeeeee'); // Línea divisoria
        doc.moveDown(1);

        doc.fillColor('#333333').fontSize(11).font('Helvetica');
        doc.text(`DOCENTE: `, { continued: true }).font('Helvetica-Bold').text(nombreDocente.toUpperCase());
        doc.font('Helvetica').text(`FECHA DE EMISIÓN: ${new Date().toLocaleDateString()}`);
        doc.moveDown(1.5);

        const tableTop = doc.y;
        const itemHeight = 30;
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#003366');
        doc.text('DÍA', 50, tableTop);
        doc.text('HORARIO', 120, tableTop);
        doc.text('MATERIA / GRUPO', 230, tableTop);
        doc.text('AULA', 480, tableTop);
        
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#003366').stroke();
        doc.moveDown(0.8);

        doc.fillColor('#000000').font('Helvetica').fontSize(9);
        
        results.forEach((h, i) => {
            const y = doc.y;
            
            if (i % 2 === 0) {
                doc.rect(50, y - 5, 495, 25).fill('#f9f9f9').fillColor('black');
            }

            doc.text(h.dia, 50, y);
            doc.text(`${h.hora_inicio} - ${h.hora_fin}`, 120, y);
            doc.text(`${h.materia.substring(0, 40)} (${h.grupo})`, 230, y);
            doc.text(h.aula, 480, y);
            
            doc.moveDown(1.8);

            if (doc.y > 700) doc.addPage();
        });

        doc.moveDown(5);
        const footerY = doc.y > 650 ? doc.y : 700; 

        doc.moveTo(150, footerY).lineTo(450, footerY).strokeColor('#333333').stroke();
        doc.fontSize(10).font('Helvetica-Bold').text('FIRMA DE CONFORMIDAD DEL DOCENTE', 50, footerY + 10, { align: 'center' });
        doc.fontSize(8).font('Helvetica').fillColor('gray').text('La presente firma valida la aceptación de la carga académica asignada.', { align: 'center' });

        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).text(`Página ${i + 1} de ${range.count}`, 50, 780, { align: 'right' });
        }

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al generar el PDF");
    }
};


exports.visualizarPropioHorario = async (req, res) => {
    const id_docente = req.session.usuario.id_docente;

    const sqlHorario = `
        SELECT h.id_horario, h.dia, 
               TIME_FORMAT(h.hora_inicio, '%H:%i') as hora_inicio, 
               TIME_FORMAT(h.hora_fin, '%H:%i') as hora_fin,
               m.nombre as materia, g.nombre as grupo, a.nombre as aula
        FROM horarios h
        JOIN materias m ON h.id_materia = m.id_materia
        JOIN grupos g ON h.id_grupo = g.id_grupo
        JOIN aulas a ON h.id_aula = a.id_aula
        WHERE h.id_docente = ? AND h.estado = 'activo'
        ORDER BY FIELD(h.dia, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'), h.hora_inicio ASC`;

    const sqlIncidencias = `SELECT * FROM incidencias WHERE id_docente = ? ORDER BY fecha_reporte DESC`;

    try {
        const [resHorario, resIncidencias] = await Promise.all([
            db.query(sqlHorario, [id_docente]),
            db.query(sqlIncidencias, [id_docente])
        ]);

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.render("visualizar", { 
            horario: resHorario[0], 
            misIncidencias: resIncidencias[0], 
            usuario: req.session.usuario 
        });
    } catch (err) {
        console.error("Error al visualizar horario:", err);
        res.status(500).send("Error al cargar el panel");
    }
};

exports.verFormularioCrear = async (req, res) => {
    const queries = [
        db.query("SELECT * FROM docentes"),
        db.query("SELECT * FROM materias"),
        db.query("SELECT * FROM grupos"),
        db.query("SELECT * FROM aulas")
    ];
    
    try {
        const [resDocentes, resMaterias, resGrupos, resAulas] = await Promise.all(queries);
        
        res.render("crear-horario", {
            docentes: resDocentes[0],
            materias: resMaterias[0],
            grupos: resGrupos[0],
            aulas: resAulas[0],
            usuario: req.session.usuario,
            error: req.query.error
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar el formulario");
    }
};

exports.guardarHorarioManual = async (req, res) => {
    const { id_docente, id_materia, id_grupo, id_aula, disponibilidad_seleccionada } = req.body;
    
    const [hora_inicio, hora_fin, dia] = disponibilidad_seleccionada.split('|');

    const sqlCheck = `
        SELECT h.*, d.nombre as docente, a.nombre as aula, g.nombre as grupo
        FROM horarios h
        JOIN docentes d ON h.id_docente = d.id_docente
        JOIN aulas a ON h.id_aula = a.id_aula
        JOIN grupos g ON h.id_grupo = g.id_grupo
        WHERE h.dia = ? 
        AND h.estado = 'activo'
        AND (
            (h.id_docente = ? ) OR
            (h.id_aula = ? ) OR    
            (h.id_grupo = ? )     
        )
        AND (
            (h.hora_inicio < ? AND h.hora_fin > ?) 
        )
    `;

    try {
        const [choques] = await db.query(sqlCheck, [dia, id_docente, id_aula, id_grupo, hora_fin, hora_inicio]);

        if (choques.length > 0) {
            const c = choques[0];
            let motivo = "";
            if (c.id_docente == id_docente) {
                motivo = `El docente ${c.docente} ya tiene clase de ${c.hora_inicio} a ${c.hora_fin}.`;
            } else if (c.id_aula == id_aula) {
                motivo = `El aula ${c.aula} ya está ocupada por el grupo ${c.grupo}.`;
            } else if (c.id_grupo == id_grupo) {
                motivo = `El grupo ${c.grupo} ya tiene materia asignada a esa hora.`;
            }
            return res.redirect(`/crear-horario?error=choque&mensaje=${encodeURIComponent(motivo)}`);
        }

        const sqlInsert = `
            INSERT INTO horarios (id_docente, id_materia, id_grupo, id_aula, dia, hora_inicio, hora_fin) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(sqlInsert, [id_docente, id_materia, id_grupo, id_aula, dia, hora_inicio, hora_fin]);
        res.redirect("/horarios?success=true");

    } catch (err) {
        console.error("Error en proceso de guardado:", err);
        res.status(500).send("Error interno al guardar");
    }
};

exports.obtenerPropuesta = async (req, res) => {
    try {
        const [cargasActuales] = await db.query(`
            SELECT id_docente, SUM(1) as total_horas 
            FROM horarios 
            WHERE estado = 'activo' 
            GROUP BY id_docente
        `);

        const [configuracion] = await db.query(`
            SELECT dm.id_docente, dm.id_materia, d.nombre as docente, 
                   m.nombre as materia, m.horas_semana, g.nombre as grupo, g.id_grupo
            FROM docente_materia dm
            JOIN docentes d ON dm.id_docente = d.id_docente
            JOIN materias m ON dm.id_materia = m.id_materia
            CROSS JOIN grupos g
        `);

        const [yaAsignadas] = await db.query(`
            SELECT id_materia, id_grupo, COUNT(*) as total 
            FROM horarios 
            WHERE estado = 'activo' 
            GROUP BY id_materia, id_grupo
        `);

        const pendientes = configuracion.map(c => {
            const horasEnDB = yaAsignadas.find(a => a.id_materia === c.id_materia && a.id_grupo === c.id_grupo)?.total || 0;
            return { ...c, horas_faltantes: c.horas_semana - horasEnDB };
        }).filter(p => p.horas_faltantes > 0);

        const [disponibilidad] = await db.query("SELECT * FROM disponibilidad_docente");
        const [ocupados] = await db.query("SELECT id_docente, id_grupo, id_aula, dia, hora_inicio FROM horarios WHERE estado = 'activo'");
        const [aulas] = await db.query("SELECT * FROM aulas");

        const propuestaFinal = [];
        const bloquesHorarios = ["07:00", "07:50", "08:40", "09:30", "10:50", "11:40", "12:30"];
        const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

        for (let p of pendientes) {
            const cargaDocenteDB = cargasActuales.find(c => c.id_docente === p.id_docente)?.total_horas || 0;
            let horasAsignadasEnEstaVuelta = 0;

            for (let dia of dias) {
                if (horasAsignadasEnEstaVuelta >= p.horas_faltantes) break;

                for (let i = 0; i < bloquesHorarios.length; i++) {
                    let hora = bloquesHorarios[i];
                    if (horasAsignadasEnEstaVuelta >= p.horas_faltantes) break;

                    if (cargaDocenteDB + horasAsignadasEnEstaVuelta >= 40) break;

                    const hFin = calcularHoraFin(hora);
                    const horaSQL = hora + ":00";
                    const hFinSQL = hFin + ":00";

                    const estaDisponibleDocente = disponibilidad.some(d => 
                        d.id_docente === p.id_docente && d.dia === dia && 
                        d.hora_inicio <= horaSQL && d.hora_fin >= hFinSQL
                    );
                    if (!estaDisponibleDocente) continue;

                    const horasHoy = ocupados.filter(h => h.id_docente === p.id_docente && h.dia === dia);
                    if (horasHoy.length > 0) {
                        const esContigua = horasHoy.some(h => {
                            const idxActual = bloquesHorarios.indexOf(hora);
                            const hAnt = bloquesHorarios[idxActual - 1] ? bloquesHorarios[idxActual - 1] + ":00" : null;
                            const hSig = bloquesHorarios[idxActual + 1] ? bloquesHorarios[idxActual + 1] + ":00" : null;
                            return h.hora_inicio === hAnt || h.hora_inicio === hSig;
                        });
                        if (!esContigua) continue; 
                    }

                    let aulaEncontrada = aulas.find(aula => !ocupados.some(h => 
                        h.dia === dia && h.hora_inicio === horaSQL && 
                        (h.id_docente === p.id_docente || h.id_grupo === p.id_grupo || h.id_aula === aula.id_aula)
                    ));

                    if (aulaEncontrada) {
                        const nuevoHorario = {
                            id_docente: p.id_docente,
                            id_materia: p.id_materia,
                            id_grupo: p.id_grupo,
                            id_aula: aulaEncontrada.id_aula,
                            docente: p.docente,
                            materia: p.materia,
                            grupo: p.grupo,
                            nombre_aula: aulaEncontrada.nombre,
                            dia: dia,
                            hora_inicio: hora,
                            hora_fin: hFin
                        };

                        propuestaFinal.push(nuevoHorario);

                        ocupados.push({ 
                            id_docente: p.id_docente, 
                            id_grupo: p.id_grupo, 
                            id_aula: aulaEncontrada.id_aula, 
                            dia, 
                            hora_inicio: horaSQL 
                        });

                        horasAsignadasEnEstaVuelta++;
                    }
                }
            }
        }

        res.json({ pendientes: propuestaFinal, aulas });

    } catch (err) {
        console.error("Error en motor:", err);
        res.status(500).json({ error: "Error en motor de propuesta" });
    }
};
exports.actualizarHorario = async (req, res) => {
    const { id_horario, id_incidencia, nueva_disponibilidad } = req.body;

    try {
        if (!nueva_disponibilidad) return res.status(400).send("Dato faltante");

        const [dia, inicio, fin] = nueva_disponibilidad.split('|').map(s => s.trim());

        await db.query(
            "UPDATE horarios SET dia = ?, hora_inicio = ?, hora_fin = ?, estado = 'activo' WHERE id_horario = ?",
            [dia, inicio, fin, id_horario]
        );
        if (id_incidencia) {
            await db.query(
                "UPDATE incidencias SET estado = 'resuelto' WHERE id_incidencia = ?", 
                [id_incidencia]
            );
        }

        res.redirect("/incidencias?refresh=" + Date.now());

    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(500).send("Error: Ese espacio (aula/grupo) ya se ocupó en otro registro.");
        }
        res.status(500).send("Error interno del servidor");
    }
};
exports.verFormularioEditar = async (req, res) => {
    const id = req.params.id;
    const id_incidencia = req.query.incidencia;

    try {
        const [horario] = await db.query(`
            SELECT h.*, d.nombre as docente, m.nombre as materia, g.nombre as grupo 
            FROM horarios h
            JOIN docentes d ON h.id_docente = d.id_docente
            JOIN materias m ON h.id_materia = m.id_materia
            JOIN grupos g ON h.id_grupo = g.id_grupo
            WHERE h.id_horario = ?`, [id]);

        const [disponibilidad] = await db.query(
            "SELECT * FROM disponibilidad_docente WHERE id_docente = ?", 
            [horario[0].id_docente]
        );

        res.render("editar_horario", { 
            horario: horario[0], 
            disponibilidad: disponibilidad, 
            id_incidencia_url: id_incidencia || "",
            usuario: req.session.usuario 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar datos");
    }
};