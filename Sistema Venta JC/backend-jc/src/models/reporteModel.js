const supabase = require('../config/database');

const getProductosMasVendidos = async () => {
  const { data, error } = await supabase
    .from('reporte_productos_vendidos')
    .select('*')
    .order('total_vendido', { ascending: false });

  if (error) {
    throw new Error(`Error de base de datos: ${error.message}`);
  }
  return data;
};

const getVentasPorVendedor = async () => {
  const { data, error } = await supabase
    .from('reporte_vendedores_ventas')
    .select('*')
    .order('total_vendido', { ascending: false });

  if (error) {
    throw new Error(`Error de base de datos: ${error.message}`);
  }
  return data;
};

const getClientesMasCompras = async () => {
  const { data, error } = await supabase
    .from('reporte_clientes_compras')
    .select('*')
    .order('total_gastado', { ascending: false });

  if (error) {
    throw new Error(`Error de base de datos: ${error.message}`);
  }
  return data;
};

const getGananciasDiarias = async () => {
  const { data, error } = await supabase
    .from('reporte_ganancias_diarias')
    .select('*')
    .order('dia', { ascending: false });

  if (error) {
    throw new Error(`Error de base de datos: ${error.message}`);
  }
  return data;
};

const getGananciasMensuales = async () => {
  const { data, error } = await supabase
    .from('reporte_ganancias_mensuales')
    .select('*')
    .order('mes', { ascending: false });

  if (error) {
    throw new Error(`Error de base de datos: ${error.message}`);
  }
  return data;
};

module.exports = {
  getProductosMasVendidos,
  getVentasPorVendedor,
  getClientesMasCompras,
  getGananciasDiarias,
  getGananciasMensuales,
};
