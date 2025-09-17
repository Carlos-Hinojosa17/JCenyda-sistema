const supabase = require('../config/database');

const TABLE_NAME = 'ventas';

const getAllVentas = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      id,
      fecha,
      cliente_id,
      usuarios_id,
      agencia_encomienda,
      destino,
      total,
      adelanto,
      diferencia,
      estado,
      clientes (
        nombre,
        documento
      ),
      usuarios (
        nombre,
        usuario
      )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    throw new Error('Error al obtener las ventas');
  }
  return data;
};

const getVentaById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      id,
      fecha,
      cliente_id,
      usuarios_id,
      agencia_encomienda,
      destino,
      contrasena,
      total,
      adelanto,
      diferencia,
      estado,
      clientes (
        nombre,
        documento
      ),
      usuarios (
        nombre,
        usuario
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error('Error al obtener la venta');
  }
  return data;
};

const createVenta = async (ventaData) => {
  let { cliente_id, usuarios_id, agencia_encomienda, destino, contrasena, total, adelanto, diferencia, estado } = ventaData;

  if (cliente_id === undefined || usuarios_id === undefined || total === undefined || adelanto === undefined) {
    throw new Error('Los campos cliente_id, usuarios_id, total y adelanto son requeridos.');
  }

  if (diferencia === undefined) {
    diferencia = parseFloat(total) - parseFloat(adelanto);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ cliente_id, usuarios_id, agencia_encomienda, destino, contrasena, total, adelanto, diferencia, estado }])
    .select()
    .single();

  if (error) {
    throw new Error('Error al registrar la venta.');
  }
  
  return data;
};

const updateVenta = async (id, updates) => {
    let { cliente_id, usuarios_id, agencia_encomienda, destino, contrasena, total, adelanto, diferencia, estado } = updates;

    const ventaExistente = await getVentaById(id);
    if (!ventaExistente) {
        throw new Error(`No se encontró una venta con el ID ${id}.`);
    }

    const newTotal = total !== undefined ? total : ventaExistente.total;
    const newAdelanto = adelanto !== undefined ? adelanto : ventaExistente.adelanto;
    if (total !== undefined || adelanto !== undefined) {
        diferencia = parseFloat(newTotal) - parseFloat(newAdelanto);
    }

    const dataToUpdate = { cliente_id, usuarios_id, agencia_encomienda, destino, contrasena, total, adelanto, diferencia, estado };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();
  
    if (error) {
      throw new Error('Error al actualizar la venta');
    }
    return data;
  };

module.exports = {
  getAllVentas,
  getVentaById,
  createVenta,
  updateVenta,
};
