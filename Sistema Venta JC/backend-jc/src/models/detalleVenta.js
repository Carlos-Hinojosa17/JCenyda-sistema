const supabase = require('../config/database');
const almacenModel = require('./almacen');

const TABLE_NAME = 'detalle_venta';

const getDetallesByVentaId = async (ventaId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      id,
      venta_id,
      producto_id,
      cantidad,
      precio_unitario,
      subtotal,
      productos (
        codigo,
        descripcion
      )
    `)
    .eq('venta_id', ventaId);

  if (error) {
    throw new Error('Error al obtener los detalles de la venta');
  }
  return data;
};

const createDetalleVenta = async (detalleData) => {
  let { venta_id, producto_id, cantidad, precio_unitario, subtotal } = detalleData;

  if (!venta_id || !producto_id || !cantidad || !precio_unitario) {
    throw new Error('Los campos venta_id, producto_id, cantidad y precio_unitario son requeridos.');
  }

  if (subtotal === undefined) {
    subtotal = parseFloat(cantidad) * parseFloat(precio_unitario);
  }

  try {
    await almacenModel.createMovimiento({
      producto_id,
      tipo_movimiento: 'egreso',
      cantidad,
    });
  } catch (error) {
    throw error;
  }

  const { data, error: detalleError } = await supabase
    .from(TABLE_NAME)
    .insert([{ venta_id, producto_id, cantidad, precio_unitario, subtotal }])
    .select()
    .single();

  if (detalleError) {
    throw new Error('Error al registrar el detalle de la venta después de actualizar el stock.');
  }
  
  return data;
};

module.exports = {
  getDetallesByVentaId,
  createDetalleVenta,
};
