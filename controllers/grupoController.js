const db = require("../config/db");

exports.listarGrupos = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM grupos ORDER BY semestre ASC, nombre ASC");
        res.render("grupos", { 
            grupos: results, 
            usuario: req.session.usuario 
        });
    } catch (err) {
        console.error("Error en listarGrupos:", err);
        res.status(500).send("Error al obtener la lista de grupos");
    }
};

exports.guardarGrupo = async (req, res) => {
    const { nombre, semestre } = req.body;

    if (!nombre || !semestre) {
        return res.redirect("/grupos?mensaje=faltan_datos");
    }

    try {
        const sql = "INSERT INTO grupos (nombre, semestre) VALUES (?, ?)";
        await db.query(sql, [nombre.trim(), semestre]);
        
        res.redirect("/grupos?mensaje=registrado");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.redirect("/grupos?mensaje=duplicado");
        }
        console.error(err);
        res.status(500).send("Error interno del servidor");
    }
};

exports.actualizarGrupo = async (req, res) => {
    const { id, nombre, semestre } = req.body;

    if (!id || !nombre || !semestre) {
        return res.redirect("/grupos?mensaje=faltan_datos");
    }

    try {
        const sql = "UPDATE grupos SET nombre = ?, semestre = ? WHERE id_grupo = ?";
        await db.query(sql, [nombre.trim(), semestre, id]);
        res.redirect("/grupos?mensaje=actualizado");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.redirect("/grupos?mensaje=duplicado");
        }
        res.status(500).send("Error al actualizar");
    }
};

exports.eliminarGrupo = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM grupos WHERE id_grupo = ?", [id]);
        res.redirect("/grupos?mensaje=eliminado");
    } catch (err) {
        console.error("Error al eliminar grupo:", err);
        res.redirect("/grupos?mensaje=error_vinculo");
    }
};