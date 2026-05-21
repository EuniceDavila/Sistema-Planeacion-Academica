const db = require("../config/db");

exports.login = async (req, res) => {
    const { usuario, contrasena } = req.body;

    try {
        const sql = "SELECT * FROM usuarios WHERE nombre = ? AND contrasena = ?";
        const [results] = await db.query(sql, [usuario, contrasena]);

        if (results.length > 0) {
            const user = results[0];

            req.session.usuario = {
                id_usuario: user.id_usuario,
                id_docente: user.id_docente, 
                nombre: user.nombre,
                rol: user.rol
            };

            if (user.rol === "jefe") {
                return res.redirect("/dashboard");
            } else {
                return res.redirect("/visualizar");
            }
        } else {
            return res.send(`
                <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
                <script>
                    window.onload = function() {
                        Swal.fire({
                            title: 'Acceso Denegado',
                            text: 'El usuario o la contraseña son incorrectos.',
                            icon: 'error',
                            confirmButtonColor: '#003366' // Azul institucional
                        }).then(() => {
                            window.location = '/';
                        });
                    }
                </script>
            `);
        }

    } catch (err) {
        console.error("Error en el proceso de login:", err);
        return res.status(500).send("Error interno del servidor al intentar iniciar sesión");
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al destruir sesión:", err);
            return res.redirect("/dashboard");
        }
        res.clearCookie('connect.sid'); 
        return res.redirect("/"); 
    });
};