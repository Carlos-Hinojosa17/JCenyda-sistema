const ventaModel = require('../models/venta');

const getVentas = async (req, res, next) => {
  try {
    const ventas = await ventaModel.getAllVentas();
    res.json({
      success: true,
      count: ventas.length,
      data: ventas,
    });
  } catch (error) {
    next(error);
  }
};

const getVenta = async (req, res, next) => {
  try {
    const venta = await ventaModel.getVentaById(req.params.id);
    if (!venta) {
      return res.status(404).json({
        success: false,
        message: `No se encontró venta con el id ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: venta,
    });
  } catch (error) {
    next(error);
  }
};

const createVenta = async (req, res, next) => {
  try {
    const nuevaVenta = await ventaModel.createVenta(req.body);
    res.status(201).json({
      success: true,
      message: 'Venta registrada correctamente.',
      data: nuevaVenta,
    });
  } catch (error) {
    if (error.message.includes('requeridos')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateVenta = async (req, res, next) => {
    try {
      const ventaActualizada = await ventaModel.updateVenta(req.params.id, req.body);
      res.json({
        success: true,
        message: `Venta con ID ${req.params.id} actualizada.`,
        data: ventaActualizada,
      });
    } catch (error) {
      if (error.message.includes('No se encontró una venta')) {
          return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  };

module.exports = {
  getVentas,
  getVenta,
  createVenta,
  updateVenta,
};
