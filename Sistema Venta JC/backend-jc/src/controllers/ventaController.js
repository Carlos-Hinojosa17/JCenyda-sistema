const ventaModel = require('../models/venta');
const detalleVentaModel = require('../models/detalleVenta');

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
    // Obtener detalles asociados a la venta y adjuntarlos
    try {
      const detalles = await detalleVentaModel.getDetallesByVentaId(req.params.id);
      venta.detalle = detalles || [];
    } catch (detalleErr) {
      // Si no se pueden obtener detalles, registramos el error pero devolvemos la venta sin detalle
      console.error('Error al obtener detalles de la venta:', detalleErr);
      venta.detalle = [];
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

// Exportaciones (definidas al final para incluir todas las funciones)

const marcarPagada = async (req, res, next) => {
  try {
    const ventaId = req.params.id;
    const payload = req.body || {};
    const ventaModel = require('../models/venta');
    const updated = await ventaModel.marcarVentaPagada(ventaId, payload);
    res.json({ success: true, message: 'Venta marcada como pagada', data: updated });
  } catch (error) {
    // Si el error tiene un mensaje legible, devolvemos JSON con 400 para que el frontend lo muestre
    if (error && error.message) {
      return res.status(400).json({ success: false, message: error.message });
    }
    // En caso contrario delegamos al manejador de errores general
    next(error);
  }
};

const anularVenta = async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body;
    const ventaId = req.params.id;
    if (!usuario || !contrasena) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos para anular.' });
    }

    // Validar credenciales de administrador
    const usuarioModel = require('../models/usuario');
    const bcrypt = require('bcryptjs');
    const usuarioRecord = await usuarioModel.getUsuarioByUsername(usuario);
    if (!usuarioRecord) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    // Verificar tipo admin
    if (usuarioRecord.tipo !== 'admin') {
      return res.status(403).json({ success: false, message: 'Se requieren credenciales de administrador.' });
    }

    const match = await bcrypt.compare(contrasena, usuarioRecord.contrasena);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    // Actualizar estado de la venta a anulada
    const ventaModel = require('../models/venta');
    const ventaExistente = await ventaModel.getVentaById(ventaId);
    if (!ventaExistente) {
      return res.status(404).json({ success: false, message: `No se encontró venta con id ${ventaId}` });
    }

    const updated = await ventaModel.updateVenta(ventaId, { estado: 'anulada' });
    res.json({ success: true, message: 'Venta anulada correctamente.', data: updated });
  } catch (error) {
    next(error);
  }
};

// Exportar anularVenta adicionalmente
module.exports = {
  getVentas,
  getVenta,
  createVenta,
  updateVenta,
  marcarPagada,
  anularVenta,
};
