const supabase = require('../config/database');
const detalleVentaModel = require('./detalleVenta');

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
    diferencia = parseFloat(total) - parseFloat(adelanto || 0);
  }

  // Asignar estado por defecto si no viene, teniendo en cuenta si es adelanto y el monto de adelanto
  if (!estado) {
    try {
      const esAd = ventaData.es_adelanto === true || ventaData.es_adelanto === 'true' || ventaData.es_adelanto === 1;
      const adel = parseFloat(ventaData.adelanto || ventaData.monto_adelanto || 0);
      if (esAd) {
        // Si está marcado el checkbox de adelanto pero el monto es 0 => pendiente
        if (!adel || Number(adel) === 0) {
          estado = 'pendiente';
        } else {
          estado = 'parcial';
        }
      } else {
        estado = 'pagada';
      }
    } catch (e) {
      estado = 'pagada';
    }
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ cliente_id, usuarios_id, agencia_encomienda, destino, contrasena, total, adelanto, diferencia, estado }])
    .select()
    .single();

  if (error) {
    throw new Error('Error al registrar la venta.');
  }

  // Si vienen items en la petición, intentamos guardarlos en detalle_venta
  if (ventaData.items && Array.isArray(ventaData.items) && ventaData.items.length > 0) {
    for (const item of ventaData.items) {
      try {
        await detalleVentaModel.createDetalleVenta({
          venta_id: data.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        });
      } catch (err) {
        // Log del error pero no abortamos la creación de la venta; en producción considerar rollback/transaction
        console.error('Error al crear detalle de venta para producto', item.producto_id, err.message || err);
      }
    }

    // Recuperar detalles guardados y adjuntarlos a la venta
    try {
      const detallesGuardados = await detalleVentaModel.getDetallesByVentaId(data.id);
      data.detalle = detallesGuardados || [];
    } catch (err) {
      data.detalle = [];
    }
  } else {
    data.detalle = [];
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

const marcarVentaPagada = async (id, payload = {}) => {
  const venta = await getVentaById(id);
  if (!venta) throw new Error('No se encontró una venta con ese ID');

  // Solo permitir si la venta está en estado parcial o pendiente
  if (!['parcial', 'pendiente'].includes((venta.estado || '').toString().toLowerCase())) {
    throw new Error('Solo se pueden marcar como pagadas ventas en estado parcial o pendiente');
  }

  const monto = parseFloat(payload.monto || 0);
  if (isNaN(monto) || monto <= 0) {
    throw new Error('El monto debe ser un número mayor a 0');
  }

  const currentAdelanto = parseFloat(venta.adelanto || 0);
  const total = parseFloat(venta.total || 0);
  let newAdelanto = currentAdelanto + monto;
  if (newAdelanto > total) newAdelanto = total;
  const newDiferencia = Math.max(0, total - newAdelanto);

  // Según la regla solicitada: si el monto ingresado es menor al restante => estado sigue 'pendiente'
  // si el monto completa el restante => 'pagada'
  const newEstado = (newAdelanto >= total) ? 'pagada' : 'pendiente';

  // Construir objeto de update, permitiendo incluir datos de pago opcionales
  const updateObj = {
    adelanto: newAdelanto,
    diferencia: newDiferencia,
    estado: newEstado,
  };
  // Nota: no intentamos escribir campos de pago directamente en la tabla `ventas`
  // porque el esquema actual puede no contener esas columnas. Si se desea
  // persistir datos de pago, crear una tabla 'pagos' o extender el esquema.

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updateObj)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Supabase error en marcarVentaPagada:', error);
    // Intenta devolver el mensaje original del error si está disponible
    const msg = error.message || error.details || JSON.stringify(error);
    throw new Error(msg || 'Error al marcar la venta como pagada');
  }
  return data;
};

module.exports.marcarVentaPagada = marcarVentaPagada;
