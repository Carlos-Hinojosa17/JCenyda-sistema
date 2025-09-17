const almacenModel = require('../models/almacen');

const getMovimientos = async (req, res, next) => {
  try {
    const movimientos = await almacenModel.getAllMovimientos();
    res.json({
      success: true,
      count: movimientos.length,
      data: movimientos,
    });
  } catch (error) {
    next(error);
  }
};

const getMovimiento = async (req, res, next) => {
  try {
    const movimiento = await almacenModel.getMovimientoById(req.params.id);
    if (!movimiento) {
      return res.status(404).json({
        success: false,
        message: `No se encontró movimiento con el id ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: movimiento,
    });
  } catch (error) {
    next(error);
  }
};

const createMovimiento = async (req, res, next) => {
  try {
    const nuevoMovimiento = await almacenModel.createMovimiento(req.body);
    res.status(201).json({
      success: true,
      message: `Movimiento de '${req.body.tipo_movimiento}' registrado correctamente.`,
      data: nuevoMovimiento,
    });
  } catch (error) {
    if (error.message.includes('requeridos') || error.message.includes('insuficiente') || error.message.includes('no válido')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getMovimientos,
  getMovimiento,
  createMovimiento,
};
