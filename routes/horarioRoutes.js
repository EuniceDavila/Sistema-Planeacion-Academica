const express = require("express");
const router = express.Router();
const horarioController = require("../controllers/horarioController");

router.get("/horarios", horarioController.verTodosLosHorarios);
router.get("/eliminar-horario/:id", horarioController.eliminarHorario);
router.get("/imprimir-horario", horarioController.imprimirPDF);

router.get("/propuesta-automatica", horarioController.obtenerPropuesta);
router.post("/confirmar-horarios", horarioController.confirmarHorarios);

router.get("/crear-horario", horarioController.verFormularioCrear);
router.post("/guardar-horario-manual", horarioController.guardarHorarioManual);

router.get("/horarios/editar/:id", horarioController.verFormularioEditar);
router.post("/horarios/actualizar", horarioController.actualizarHorario);

module.exports = router;
