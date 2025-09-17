const express = require('express');
const router = express.Router();
const {
  getVentas,
  getVenta,
  createVenta,
  updateVenta,
} = require('../controllers/ventaController');

router.get('/', getVentas);
router.get('/:id', getVenta);
router.post('/', createVenta);
router.put('/:id', updateVenta);

module.exports = router;
