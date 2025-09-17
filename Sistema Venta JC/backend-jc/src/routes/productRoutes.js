const express = require('express');
const router = express.Router();
const {
  getProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
} = require('../controllers/productoController');

router.get('/', getProductos);
router.get('/:id', getProducto);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

module.exports = router;
