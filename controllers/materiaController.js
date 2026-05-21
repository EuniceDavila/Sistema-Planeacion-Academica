const db = require("../config/db");

exports.listarMaterias = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM materias ORDER BY nombre ASC");
        
        const materiasMapeadas = results.map(m => ({
            id_materia: m.id_materia,
            nombre: m.nombre,
            horas: m.horas_semana 
        }));

        res.render("materias", { 
            materias: materiasMapeadas, 
            usuario: req.session.usuario 
        });
    } catch (err) {
        console.error("Error al listar materias:", err);
        res.status(500).send("Error al cargar el catálogo de materias");
    }
};

exports.guardarMateria = async (req, res) => {
    const { nombre, horas } = req.body;

    try {
        if (!nombre || !horas) {
            return res.redirect("/materias?error=faltan_datos");
        }

        const sql = "INSERT INTO materias (nombre, horas_semana) VALUES (?, ?)";
        await db.query(sql, [nombre, horas]);
        
        res.redirect("/materias?mensaje=registrado");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.redirect("/materias?mensaje=duplicado");
        }
        
        console.error("Error al guardar materia:", err);
        res.status(500).send("Error interno del servidor");
    }
};

exports.eliminarMateria = async (req, res) => {
    const id = req.params.id;
    try {
        await db.query("DELETE FROM materias WHERE id_materia = ?", [id]);
        res.redirect("/materias?mensaje=eliminado");
    } catch (err) {
        console.error("Error al eliminar materia:", err);
        res.status(500).send("No se puede eliminar la materia porque ya está asignada a un grupo o docente.");
    }
};

exports.actualizarMateria = async (req, res) => {
    const { id, nombre, horas } = req.body;
    try {
        const sql = "UPDATE materias SET nombre = ?, horas_semana = ? WHERE id_materia = ?";
        await db.query(sql, [nombre, horas, id]); 
        res.redirect("/materias?mensaje=actualizado");
    } catch (err) {
        console.error("Error al actualizar materia:", err);
        res.status(500).send("Error al actualizar la materia");
    }
};