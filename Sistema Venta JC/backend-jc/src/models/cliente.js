const supabase = require('../config/database');

const TABLE_NAME = 'clientes';

const getAllClientes = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error en getAllClientes:', error);
    throw new Error('Error al obtener los clientes');
  }
  return data;
};

const getClienteById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; 
    throw new Error('Error al obtener el cliente');
  }
  return data;
};

const getClienteByDocumento = async (documento) => {
    // Asegurar que documento sea numérico
    const documentoNumerico = parseInt(documento);
    if (isNaN(documentoNumerico)) {
      return null;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('documento', documentoNumerico)
      .single();
  
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error('Error al buscar el cliente por documento');
    }
    return data;
  };

const createCliente = async (clienteData) => {
  const { nombre, documento, telefono } = clienteData;

  if (!nombre || !documento) {
    throw new Error('El nombre y el documento son requeridos.');
  }

  // Convertir documento a entero para que coincida con la BD
  const documentoNumerico = parseInt(documento);
  if (isNaN(documentoNumerico)) {
    throw new Error('El documento debe ser un número válido.');
  }

  const existente = await getClienteByDocumento(documentoNumerico);
  if (existente) {
      throw new Error(`Ya existe un cliente con el documento ${documentoNumerico}.`);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ nombre, documento: documentoNumerico, telefono }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
        throw new Error(`Ya existe un cliente con el documento ${documentoNumerico}.`);
    }
    throw new Error('Error al crear el cliente');
  }
  return data;
};

const updateCliente = async (id, updates) => {
  const { nombre, documento, telefono, estado } = updates;

  // Convertir documento a entero si se proporciona
  let documentoNumerico = documento;
  if (documento) {
    documentoNumerico = parseInt(documento);
    if (isNaN(documentoNumerico)) {
      throw new Error('El documento debe ser un número válido.');
    }
  }

  // Optimización: Solo verificar duplicados si el documento ha cambiado
  // Usar una sola consulta que incluya la verificación
  try {
    // Primero intentamos la actualización directamente
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ nombre, documento: documentoNumerico, telefono, estado })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Si hay error de constraint (documento duplicado)
      if (error.code === '23505') {
        throw new Error(`El documento ${documentoNumerico} ya está en uso por otro cliente.`);
      }
      // Si no encuentra el registro
      if (error.code === 'PGRST116') {
        throw new Error(`No se encontró un cliente con el ID ${id}.`);
      }
      throw new Error('Error al actualizar el cliente');
    }
    
    return data;
  } catch (error) {
    // Re-lanzar errores personalizados
    throw error;
  }
};

const deleteCliente = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ estado: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Error al eliminar el cliente');
  }
  return data;
};


module.exports = {
  getAllClientes,
  getClienteById,
  getClienteByDocumento,
  createCliente,
  updateCliente,
  deleteCliente,
};
