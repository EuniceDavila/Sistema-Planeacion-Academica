const db = require("../config/db");

exports.reportar = async (req, res) => {
    const { id_horario, descripcion } = req.body;
    const id_docente = req.session.usuario.id_docente;

    try {
        await db.query(
            "INSERT INTO incidencias (id_horario, id_docente, descripcion) VALUES (?, ?, ?)",
            [id_horario, id_docente, descripcion]
        );
        res.send("<script>alert('Reporte enviado con éxito'); window.location='/visualizar';</script>");
    } catch (error) {
        res.status(500).send("Error al reportar");
    }
};

exports.panelAdmin = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT i.*, d.nombre AS docente, m.nombre AS materia, h.dia, h.hora_inicio
            FROM incidencias i
            JOIN docentes d ON i.id_docente = d.id_docente
            JOIN horarios h ON i.id_horario = h.id_horario
            JOIN materias m ON h.id_materia = m.id_materia
            WHERE i.estado = 'pendiente'
            ORDER BY i.fecha_reporte DESC
        `);
        res.render("admin_incidencias", { incidencias: rows });
    } catch (error) {
        res.status(500).send("Error al cargar el panel");
    }
};

exports.resolverIncidencia = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            "UPDATE incidencias SET estado = 'resuelto' WHERE id_incidencia = ?",
            [id]
        );
        
        res.send(`
            <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
            <script>
                window.onload = function() {
                    Swal.fire({
                        title: '¡Completado!',
                        text: 'La incidencia ha sido marcada como resuelta.',
                        icon: 'success',
                        confirmButtonColor: '#2ecc71'
                    }).then(() => {
                        window.location = '/incidencias';
                    });
                }
            </script>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al resolver la incidencia");
    }
};

exports.rechazarIncidencia = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            "UPDATE incidencias SET estado = 'rechazado' WHERE id_incidencia = ?",
            [id]
        );
        
        res.send(`
            <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
            <script>
                window.onload = function() {
                    Swal.fire({
                        title: 'Reporte Declinado',
                        text: 'El horario original se mantendrá activo en el sistema.',
                        icon: 'info',
                        confirmButtonColor: '#e74c3c'
                    }).then(() => {
                        window.location = '/incidencias';
                    });
                }
            </script>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al registrar el rechazo");
    }
};