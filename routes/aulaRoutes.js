const express = require("express");
const router = express.Router();
const aulaController = require("../controllers/aulaController");

router.get("/aulas", aulaController.listarAulas);
router.post("/guardar-aula", aulaController.guardarAula);
router.post("/actualizar-aula", aulaController.actualizarAula);
router.get("/eliminar-aula/:id", aulaController.eliminarAula);

module.exports = router;