const supabase = require('../config/database');

const TABLE_NAME = 'almacen';

const getAllMovimientos = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      id,
      producto_id,
      tipo_movimiento,
      cantidad,
      fecha,
      productos (
        codigo,
        descripcion
      )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    throw new Error('Error al obtener los movimientos del almacén');
  }
  return data;
};

const getMovimientoById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      id,
      producto_id,
      tipo_movimiento,
      cantidad,
      fecha,
      productos (
        codigo,
        descripcion
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error('Error al obtener el movimiento');
  }
  return data;
};

const createMovimiento = async (movimientoData) => {
  const { producto_id, tipo_movimiento, cantidad } = movimientoData;

  if (!producto_id || !tipo_movimiento || !cantidad) {
    throw new Error('Los campos producto_id, tipo_movimiento y cantidad son requeridos.');
  }
  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser un número positivo.');
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ producto_id, tipo_movimiento, cantidad }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al registrar el movimiento de almacén: ${error.message}`);
  }
  
  return data;
};


module.exports = {
  getAllMovimientos,
  getMovimientoById,
  createMovimiento,
};
