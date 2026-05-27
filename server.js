const express = require("express");
const path = require("path");
const session = require("express-session");
require('dotenv').config();
const db = require("./config/db");

const authRoutes = require("./routes/autenticacionRoutes");
const docenteRoutes = require("./routes/docentesRoutes");
const materiaRoutes = require("./routes/materiasRoutes");
const grupoRoutes = require("./routes/grupoRoutes");
const horarioRoutes = require("./routes/horarioRoutes");
const asignacionRoutes = require("./routes/asignacionRoutes");
const aulaRoutes = require("./routes/aulaRoutes");
const incidenciaRoutes = require("./routes/incidenciaRoutes");

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(session({
    secret: process.env.SESSION_SECRET || "secreto_por_defecto",
    resave: false,
    saveUninitialized: true
}));

app.use("/", authRoutes); 

app.use((req, res, next) => {
    if (req.session.usuario) {
        return next();
    }
    return res.redirect("/");
});

app.use("/", docenteRoutes);
app.use("/", materiaRoutes);
app.use("/", grupoRoutes);
app.use("/", horarioRoutes);
app.use("/", asignacionRoutes);
app.use("/", aulaRoutes);
app.use("/", incidenciaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});