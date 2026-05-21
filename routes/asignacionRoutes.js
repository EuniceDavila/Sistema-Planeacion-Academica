const express = require("express");
const router = express.Router();
const asignacionController = require("../controllers/asignacionController");

router.get("/asignar-materias", asignacionController.verAsignarMaterias);

router.post("/guardar-asignacion", asignacionController.guardarAsignacion);

module.exports = router;