const express = require('express');
const router = express.Router();
const {
  getMovimientos,
  getMovimiento,
  createMovimiento,
} = require('../controllers/almacenController');

router.get('/', getMovimientos);
router.get('/:id', getMovimiento);
router.post('/', createMovimiento);

module.exports = router;
