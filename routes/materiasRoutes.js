const express = require("express");
const router = express.Router();
const materiaController = require("../controllers/materiaController");

router.get("/materias", materiaController.listarMaterias);

router.post("/guardar-materia", materiaController.guardarMateria);

router.get("/eliminar-materia/:id", materiaController.eliminarMateria);

router.post("/actualizar-materia", materiaController.actualizarMateria);

module.exports = router;