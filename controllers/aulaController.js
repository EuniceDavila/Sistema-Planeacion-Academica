const db = require("../config/db");

exports.listarAulas = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM aulas ORDER BY nombre ASC");
        res.render("aulas", { aulas: results, usuario: req.session.usuario });
    } catch (err) {
        res.status(500).send("Error al cargar aulas");
    }
};

exports.guardarAula = async (req, res) => {
    const { nombre, capacidad } = req.body;
    try {
        await db.query("INSERT INTO aulas (nombre, capacidad) VALUES (?, ?)", [nombre.trim(), capacidad]);
        res.redirect("/aulas?mensaje=registrado");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.redirect("/aulas?mensaje=duplicado");
        res.status(500).send("Error al guardar");
    }
};

exports.actualizarAula = async (req, res) => {
    const { id, nombre, capacidad } = req.body;
    try {
        await db.query("UPDATE aulas SET nombre = ?, capacidad = ? WHERE id_aula = ?", [nombre.trim(), capacidad, id]);
        res.redirect("/aulas?mensaje=actualizado");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.redirect("/aulas?mensaje=duplicado");
        res.status(500).send("Error al actualizar");
    }
};

exports.eliminarAula = async (req, res) => {
    try {
        await db.query("DELETE FROM aulas WHERE id_aula = ?", [req.params.id]);
        res.redirect("/aulas?mensaje=eliminado");
    } catch (err) {
        res.redirect("/aulas?mensaje=error_vinculo");
    }
};