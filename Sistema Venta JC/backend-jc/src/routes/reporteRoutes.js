const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

router.get('/productos-mas-vendidos', reporteController.getProductosMasVendidos);
router.get('/ventas-por-vendedor', reporteController.getVentasPorVendedor);
router.get('/clientes-mas-compras', reporteController.getClientesMasCompras);
router.get('/ganancias-diarias', reporteController.getGananciasDiarias);
router.get('/ganancias-mensuales', reporteController.getGananciasMensuales);

module.exports = router;
