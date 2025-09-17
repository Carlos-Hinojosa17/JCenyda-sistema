const express = require('express');
const router = express.Router();
const {
  getDetallesDeVenta,
  createDetalleDeVenta,
} = require('../controllers/detalleVentaController');

router.get('/:ventaId', getDetallesDeVenta);
router.post('/', createDetalleDeVenta);

module.exports = router;
