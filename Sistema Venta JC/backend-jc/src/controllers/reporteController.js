const reporteModel = require('../models/reporteModel');

const getProductosMasVendidos = async (req, res) => {
  try {
    const reporte = await reporteModel.getProductosMasVendidos();
    res.status(200).json({
      success: true,
      count: reporte.length,
      data: reporte,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor al generar el reporte',
    });
  }
};

const getVentasPorVendedor = async (req, res) => {
  try {
    const reporte = await reporteModel.getVentasPorVendedor();
    res.status(200).json({
      success: true,
      count: reporte.length,
      data: reporte,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor al generar el reporte',
    });
  }
};

const getClientesMasCompras = async (req, res) => {
  try {
    const reporte = await reporteModel.getClientesMasCompras();
    res.status(200).json({
      success: true,
      count: reporte.length,
      data: reporte,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor al generar el reporte',
    });
  }
};

const getGananciasDiarias = async (req, res) => {
  try {
    const reporte = await reporteModel.getGananciasDiarias();
    res.status(200).json({
      success: true,
      count: reporte.length,
      data: reporte,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor al generar el reporte',
    });
  }
};

const getGananciasMensuales = async (req, res) => {
  try {
    const reporte = await reporteModel.getGananciasMensuales();
    res.status(200).json({
      success: true,
      count: reporte.length,
      data: reporte,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor al generar el reporte',
    });
  }
};

module.exports = {
  getProductosMasVendidos,
  getVentasPorVendedor,
  getClientesMasCompras,
  getGananciasDiarias,
  getGananciasMensuales,
};
