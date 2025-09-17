const express = require('express');
const router = express.Router();
const {
  getVentas,
  getVenta,
  createVenta,
  updateVenta,
  anularVenta,
  marcarPagada,
} = require('../controllers/ventaController');

router.get('/', getVentas);
router.get('/:id', getVenta);
router.post('/', createVenta);
router.put('/:id', updateVenta);
router.post('/:id/anular', anularVenta);
router.post('/:id/marcar-pagada', marcarPagada);

module.exports = router;
