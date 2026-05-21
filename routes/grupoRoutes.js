const express = require("express");
const router = express.Router();
const grupoController = require("../controllers/grupoController");

router.get("/grupos", grupoController.listarGrupos);
router.post("/guardar-grupo", grupoController.guardarGrupo);
router.post("/actualizar-grupo", grupoController.actualizarGrupo);
router.get("/eliminar-grupo/:id", grupoController.eliminarGrupo);

module.exports = router;