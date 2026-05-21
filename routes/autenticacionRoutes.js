const express = require("express");
const router = express.Router();
const authController = require("../controllers/autenticacionController");
const db = require("../config/db");

router.get("/", (req, res) => {
    if (req.session.usuario) {
        return res.redirect(req.session.usuario.rol === "jefe" ? "/dashboard" : "/visualizar");
    }
    res.render("login"); 
});

router.post("/login", authController.login);

router.get("/dashboard", async (req, res) => {
    if (req.session.usuario && req.session.usuario.rol === "jefe") {
        try {
            const [d] = await db.query("SELECT COUNT(*) as total FROM docentes");
            const [m] = await db.query("SELECT COUNT(*) as total FROM materias");
            const [a] = await db.query("SELECT COUNT(*) as total FROM aulas");
            const [g] = await db.query("SELECT COUNT(*) as total FROM grupos");

            res.render("dashboard", { 
                usuario: req.session.usuario,
                stats: { docentes: d[0].total, materias: m[0].total, aulas: a[0].total, grupos: g[0].total } 
            }); 
        } catch (error) {
            res.render("dashboard", { usuario: req.session.usuario, stats: { docentes: 0, materias: 0, aulas: 0, grupos: 0 } });
        }
    } else {
        res.redirect("/"); 
    }
});

router.get("/visualizar", async (req, res) => {
    if (req.session.usuario && req.session.usuario.id_docente) {
        try {
            const idDocente = req.session.usuario.id_docente;

            const [horario] = await db.query(`
                SELECT h.*, m.nombre AS materia, g.nombre AS grupo 
                FROM horarios h
                JOIN materias m ON h.id_materia = m.id_materia
                JOIN grupos g ON h.id_grupo = g.id_grupo
                WHERE h.id_docente = ?
                ORDER BY FIELD(dia, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'), hora_inicio
            `, [idDocente]);

            const [incidencias] = await db.query(
                "SELECT * FROM incidencias WHERE id_docente = ? ORDER BY fecha_reporte DESC", 
                [idDocente]
            );

            res.render("visualizar", { 
                usuario: req.session.usuario,
                horario: horario,
                misIncidencias: incidencias 
            });
        } catch (error) {
            console.error("Error al cargar vista de docente:", error);
            res.status(500).send("Error al cargar el horario");
        }
    } else {
        res.redirect("/");
    }
});

router.get("/logout", authController.logout);

module.exports = router;