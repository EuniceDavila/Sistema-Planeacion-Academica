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
//const generadorRoutes = require("./routes/generadorRoutes");
const incidenciaRoutes = require("./routes/incidenciaRoutes");

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(session({
    secret: "sistema_planeacion",
    resave: false,
    saveUninitialized: true
}));

app.use("/", authRoutes); 
app.use("/", docenteRoutes);
app.use("/", materiaRoutes);
app.use("/", grupoRoutes);
app.use("/", horarioRoutes);
app.use("/", asignacionRoutes);
app.use("/", aulaRoutes);
//app.use("/", generadorRoutes);
app.use("/", incidenciaRoutes);

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});

