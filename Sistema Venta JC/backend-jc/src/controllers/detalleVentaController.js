const detalleVentaModel = require('../models/detalleVenta');

const getDetallesDeVenta = async (req, res, next) => {
  try {
    const { ventaId } = req.params;
    const detalles = await detalleVentaModel.getDetallesByVentaId(ventaId);
    
    if (!detalles) {
        return res.status(404).json({
            success: false,
            message: `No se encontraron detalles para la venta con ID ${ventaId}`,
        });
    }

    res.json({
      success: true,
      count: detalles.length,
      data: detalles,
    });
  } catch (error) {
    next(error);
  }
};

const createDetalleDeVenta = async (req, res, next) => {
  try {
    const nuevoDetalle = await detalleVentaModel.createDetalleVenta(req.body);
    res.status(201).json({
      success: true,
      message: 'Detalle de venta registrado y stock actualizado.',
      data: nuevoDetalle,
    });
  } catch (error) {
    if (error.message.includes('requeridos') || error.message.includes('insuficiente')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getDetallesDeVenta,
  createDetalleDeVenta,
};
