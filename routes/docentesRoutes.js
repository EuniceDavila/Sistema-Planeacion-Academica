const express = require("express");
const router = express.Router();

const docenteController = require("../controllers/docentesController");

router.get("/docentes", docenteController.listarDocentes);
router.post("/guardar-docente", docenteController.guardarDocente);

router.get("/disponibilidad/:id", docenteController.verDisponibilidad);
router.post("/guardar-disponibilidad", docenteController.guardarDisponibilidad);

router.get('/api/docente/:id', docenteController.getDocenteInfo);

module.exports = router;