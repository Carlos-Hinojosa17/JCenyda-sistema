const usuarioModel = require('../models/usuario');

const getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await usuarioModel.getAllUsuarios();
    res.json({
      success: true,
      count: usuarios.length,
      data: usuarios,
    });
  } catch (error) {
    next(error);
  }
};

const getUsuario = async (req, res, next) => {
  try {
    const usuario = await usuarioModel.getUsuarioById(req.params.id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: `No se encontró usuario con el id ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    next(error);
  }
};

const createUsuario = async (req, res, next) => {
  try {
    const nuevoUsuario = await usuarioModel.createUsuario(req.body);
    res.status(201).json({
      success: true,
      data: nuevoUsuario,
    });
  } catch (error) {
    if (error.message.includes('ya está en uso') || error.message.includes('debe ser uno de los siguientes')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateUsuario = async (req, res, next) => {
  try {
    const usuarioActualizado = await usuarioModel.updateUsuario(req.params.id, req.body);
    res.json({
      success: true,
      data: usuarioActualizado,
    });
  } catch (error) {
    if (error.message.includes('No se encontró un usuario') || error.message.includes('ya está en uso') || error.message.includes('debe ser uno de los siguientes')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deleteUsuario = async (req, res, next) => {
  try {
    const usuarioEliminado = await usuarioModel.deleteUsuario(req.params.id);
    res.json({
      success: true,
      message: `Usuario con ID ${req.params.id} eliminado correctamente.`,
      data: usuarioEliminado
    });
  } catch (error) {
    if (error.message.includes('No se encontró un usuario')) {
        return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
};
