const supabase = require('../config/database');
const bcrypt = require('bcryptjs');

const TABLE_NAME = 'usuarios';

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const getAllUsuarios = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, nombre, usuario, tipo');

  if (error) {
    throw new Error('Error al obtener los usuarios');
  }
  return data;
};

const getUsuarioById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, nombre, usuario, tipo')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error('Error al obtener el usuario');
  }
  return data;
};

const getUsuarioByUsername = async (usuario) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('usuario', usuario)
      .single();
    
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error('Error al buscar el usuario');
    }
    return data;
};

const createUsuario = async (usuarioData) => {
  const { nombre, usuario, contrasena, tipo } = usuarioData;

  if (!nombre || !usuario || !contrasena || !tipo) {
    throw new Error('Todos los campos son requeridos: nombre, usuario, contraseña y tipo.');
  }

  // --- ✅ NUEVA VALIDACIÓN ---
  const tiposValidos = ['admin', 'vendedor'];
  if (!tiposValidos.includes(tipo)) {
    throw new Error(`El tipo de usuario debe ser uno de los siguientes: ${tiposValidos.join(', ')}.`);
  }
  // --- FIN DE LA VALIDACIÓN ---

  const existente = await getUsuarioByUsername(usuario);
  if (existente) {
      throw new Error(`El nombre de usuario '${usuario}' ya está en uso.`);
  }

  const contrasenaEncriptada = await hashPassword(contrasena);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ nombre, usuario, contrasena: contrasenaEncriptada, tipo }])
    .select('id, nombre, usuario, tipo')
    .single();

  if (error) {
    if (error.code === '23505') {
        throw new Error(`El nombre de usuario '${usuario}' ya está en uso.`);
    }
    throw new Error('Error al crear el usuario');
  }
  return data;
};

const updateUsuario = async (id, updates) => {
  const { nombre, usuario, contrasena, tipo } = updates;

  // --- ✅ NUEVA VALIDACIÓN ---
  if (tipo) {
    const tiposValidos = ['admin', 'vendedor'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error(`El tipo de usuario debe ser uno de los siguientes: ${tiposValidos.join(', ')}.`);
    }
  }
  // --- FIN DE LA VALIDACIÓN ---

  const usuarioExistente = await getUsuarioById(id);
  if (!usuarioExistente) {
      throw new Error(`No se encontró un usuario con el ID ${id}.`);
  }

  if (usuario && usuario !== usuarioExistente.usuario) {
    const otroUsuario = await getUsuarioByUsername(usuario);
    if (otroUsuario) {
        throw new Error(`El nombre de usuario '${usuario}' ya está en uso.`);
    }
  }
  
  const dataToUpdate = { nombre, usuario, tipo };

  if (contrasena) {
    dataToUpdate.contrasena = await hashPassword(contrasena);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(dataToUpdate)
    .eq('id', id)
    .select('id, nombre, usuario, tipo')
    .single();

  if (error) {
    throw new Error('Error al actualizar el usuario');
  }
  return data;
};

const deleteUsuario = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)
    .select('id, nombre, usuario, tipo')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
        throw new Error(`No se encontró un usuario con el ID ${id}.`);
    }
    throw new Error('Error al eliminar el usuario');
  }
  return data;
};

module.exports = {
  getAllUsuarios,
  getUsuarioById,
  getUsuarioByUsername,
  createUsuario,
  updateUsuario,
  deleteUsuario,
};
