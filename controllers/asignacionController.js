const db = require("../config/db");

exports.verAsignarMaterias = async (req, res) => {
    const sqlDocentes = "SELECT id_docente, nombre FROM docentes ORDER BY nombre ASC";
    const sqlMaterias = "SELECT id_materia, nombre, horas_semana FROM materias ORDER BY nombre ASC";

    try {
        const [promesaDocentes, promesaMaterias] = await Promise.all([
            db.query(sqlDocentes),
            db.query(sqlMaterias)
        ]);

        const docentes = promesaDocentes[0];
        const materias = promesaMaterias[0];

        res.render("asignar-materias", { 
            docentes: docentes, 
            materias: materias,
            usuario: req.session.usuario 
        });

    } catch (err) {
        console.error("Error en verAsignarMaterias:", err);
        res.status(500).send("Error al cargar la página de asignación");
    }
};

exports.guardarAsignacion = async (req, res) => {
    const { id_docente, materias } = req.body;

    if (!id_docente) return res.redirect("/asignar-materias?error=no_docente");

    try {
        const sqlDelete = "DELETE FROM docente_materia WHERE id_docente = ?";
        await db.query(sqlDelete, [id_docente]);

        if (materias) {
            const lista = Array.isArray(materias) ? materias : [materias];
            
            const valores = lista.map(id_materia => [id_docente, id_materia]);
            const sqlInsert = "INSERT INTO docente_materia (id_docente, id_materia) VALUES ?";
            
            await db.query(sqlInsert, [valores]);
            
            return res.redirect("/asignar-materias?mensaje=guardado");
        } else {
            return res.redirect("/asignar-materias?mensaje=limpiado");
        }

    } catch (err) {
        console.error("Error en guardarAsignacion:", err);
        res.status(500).send("Error al procesar la asignación de materias");
    }
};