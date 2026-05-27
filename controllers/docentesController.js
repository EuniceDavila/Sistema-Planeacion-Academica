const db = require("../config/db");

exports.listarDocentes = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM docentes");
        res.render("docentes", { docentes: results });
    } catch (err) {
        console.error("Error en listarDocentes:", err);
        res.status(500).send("Error al obtener la lista de docentes");
    }
};

exports.guardarDocente = async (req, res) => {
    const { nombre, area, usuario, contrasena } = req.body;

    try {
        const sqlDocente = "INSERT INTO docentes (nombre, area) VALUES (?, ?)";
        const [result] = await db.query(sqlDocente, [nombre, area]);

        const id_docente = result.insertId;

        const sqlUsuario = "INSERT INTO usuarios (nombre, contrasena, rol, id_docente) VALUES (?, ?, 'docente', ?)";
        await db.query(sqlUsuario, [usuario, contrasena, id_docente]);

        res.redirect("/docentes?mensaje=guardado");

    } catch (err) {
        console.error("Error en guardarDocente:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.redirect("/docentes?error=duplicado");
        }
        res.status(500).send("Error al registrar el docente y su usuario");
    }
};

exports.verDisponibilidad = async (req, res) => {
    const id = req.params.id;
    const bloques = ["07:00-07:50", "07:50-08:40", "08:40-09:30", "09:30-10:20", "10:50-11:40", "11:40-12:30", "12:30-13:20","13:20-14:10"];
    
    try {
        // Aqui ejecuto consultas en paralelo
        const [promesaDocente, promesaHorarios] = await Promise.all([
            db.query("SELECT nombre FROM docentes WHERE id_docente = ?", [id]),
            db.query("SELECT dia, hora_inicio, hora_fin FROM disponibilidad_docente WHERE id_docente = ?", [id])
        ]);

        const docente = promesaDocente[0];
        const horariosGuardados = promesaHorarios[0];

        if (docente.length === 0) return res.redirect("/docentes");

        res.render("disponibilidad", { 
            id, 
            nombre: docente[0].nombre, 
            bloques,
            horariosGuardados 
        });

    } catch (err) {
        console.error("Error en verDisponibilidad:", err);
        res.status(500).send("Error al cargar la disponibilidad del docente");
    }
};

exports.guardarDisponibilidad = async (req, res) => {
    const { id_docente, disponibilidad } = req.body; 
    
    try {
        await db.query("DELETE FROM disponibilidad_docente WHERE id_docente = ?", [id_docente]);

        if (!disponibilidad) {
            return res.redirect("/docentes?mensaje=disponibilidad_guardada");
        }

        const arrayDisponibilidad = Array.isArray(disponibilidad) ? disponibilidad : [disponibilidad];
        
        const values = arrayDisponibilidad.map(item => {
            const [dia, horas] = item.split('|');
            const [inicio, fin] = horas.split('-'); 
            return [id_docente, dia, inicio, fin];
        });

        const sql = "INSERT INTO disponibilidad_docente (id_docente, dia, hora_inicio, hora_fin) VALUES ?";
        await db.query(sql, [values]);

        res.redirect("/docentes?mensaje=disponibilidad_guardada");

    } catch (err) {
        console.error("Error en guardarDisponibilidad:", err);
        res.status(500).send("Error al guardar la configuración de disponibilidad");
    }
};

exports.getDocenteInfo = async (req, res) => {
    const id_docente = req.params.id;

    const sqlMaterias = `SELECT m.id_materia, m.nombre FROM materias m 
                         JOIN docente_materia dm ON m.id_materia = dm.id_materia 
                         WHERE dm.id_docente = ?`;
                         
    const sqlDisponibilidad = `SELECT dia, hora_inicio, hora_fin FROM disponibilidad_docente 
                               WHERE id_docente = ?`;

    try {
        const [materiasRes, disponibilidadRes] = await Promise.all([
            db.query(sqlMaterias, [id_docente]),
            db.query(sqlDisponibilidad, [id_docente])
        ]);

        res.json({ 
            materias: materiasRes[0], 
            disponibilidad: disponibilidadRes[0] 
        });

    } catch (err) {
        console.error("Error en getDocenteInfo:", err);
        res.status(500).json({ error: "Error al obtener información del docente" });
    }
};