const express = require("express");
const router = express.Router();
const incidenciaController = require("../controllers/incidenciaController");

router.post("/incidencias/reportar", incidenciaController.reportar);

router.get("/incidencias", incidenciaController.panelAdmin);

// Ruta para resolver
router.post("/incidencias/:id/resolver", incidenciaController.resolverIncidencia);

// Ruta para rechazar/declinar
router.post("/incidencias/:id/rechazar", incidenciaController.rechazarIncidencia);

module.exports = router;