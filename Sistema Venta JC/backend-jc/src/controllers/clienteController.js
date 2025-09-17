const clienteModel = require('../models/cliente');

const getClientes = async (req, res, next) => {
  try {
    const clientes = await clienteModel.getAllClientes();
    res.json({
      success: true,
      count: clientes.length,
      data: clientes,
    });
  } catch (error) {
    next(error);
  }
};

const getCliente = async (req, res, next) => {
  try {
    const cliente = await clienteModel.getClienteById(req.params.id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: `No se encontró cliente con el id ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
};

const createCliente = async (req, res, next) => {
  try {
    const nuevoCliente = await clienteModel.createCliente(req.body);
    res.status(201).json({
      success: true,
      data: nuevoCliente,
    });
  } catch (error) {
    if (error.message.includes('Ya existe un cliente')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateCliente = async (req, res, next) => {
  try {
    const clienteActualizado = await clienteModel.updateCliente(req.params.id, req.body);
    if (!clienteActualizado) {
        return res.status(404).json({
          success: false,
          message: `No se encontró cliente con el id ${req.params.id}`,
        });
      }
    res.json({
      success: true,
      data: clienteActualizado,
    });
  } catch (error) {
    if (error.message.includes('No se encontró un cliente') || error.message.includes('ya está en uso')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deleteCliente = async (req, res, next) => {
  try {
    const clienteEliminado = await clienteModel.deleteCliente(req.params.id);
    if (!clienteEliminado) {
        return res.status(404).json({
          success: false,
          message: `No se encontró cliente con el id ${req.params.id}`,
        });
      }
    res.json({
      success: true,
      message: `Cliente con ID ${req.params.id} desactivado correctamente.`,
      data: clienteEliminado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
};
