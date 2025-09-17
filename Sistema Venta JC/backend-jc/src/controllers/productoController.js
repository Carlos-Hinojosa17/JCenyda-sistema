const productoModel = require('../models/producto');

const getProductos = async (req, res, next) => {
  try {
    const productos = await productoModel.getAllProductos();
    res.json({
      success: true,
      count: productos.length,
      data: productos,
    });
  } catch (error) {
    next(error);
  }
};

const getProducto = async (req, res, next) => {
  try {
    const producto = await productoModel.getProductoById(req.params.id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `No se encontró producto con el id ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

const createProducto = async (req, res, next) => {
  try {
    const nuevoProducto = await productoModel.createProducto(req.body);
    res.status(201).json({
      success: true,
      data: nuevoProducto,
    });
  } catch (error) {
    if (error.message.includes('Ya existe un producto')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateProducto = async (req, res, next) => {
  try {
    const productoActualizado = await productoModel.updateProducto(req.params.id, req.body);
    if (!productoActualizado) {
        return res.status(404).json({
          success: false,
          message: `No se encontró producto con el id ${req.params.id}`,
        });
      }
    res.json({
      success: true,
      data: productoActualizado,
    });
  } catch (error) {
    if (error.message.includes('No se encontró un producto') || error.message.includes('ya está en uso')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deleteProducto = async (req, res, next) => {
  try {
    const productoEliminado = await productoModel.deleteProducto(req.params.id);
    if (!productoEliminado) {
        return res.status(404).json({
          success: false,
          message: `No se encontró producto con el id ${req.params.id}`,
        });
      }
    res.json({
      success: true,
      message: `Producto con ID ${req.params.id} desactivado correctamente.`,
      data: productoEliminado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
};
