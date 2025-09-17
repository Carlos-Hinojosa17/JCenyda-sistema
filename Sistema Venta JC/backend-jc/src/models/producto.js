const supabase = require('../config/database');

const TABLE_NAME = 'productos';

const getAllProductos = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('descripcion', { ascending: true });

  if (error) {
    throw new Error('Error al obtener los productos');
  }
  return data;
};

const searchProductos = async (q) => {
  if (!q || q.trim() === '') return getAllProductos();
  const term = `%${q.trim()}%`;
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .or(`descripcion.ilike.${term},codigo.ilike.${term}`)
    .order('descripcion', { ascending: true })
    .limit(50);

  if (error) {
    throw new Error('Error al buscar productos');
  }
  return data;
};

const getProductoById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error('Error al obtener el producto');
  }
  return data;
};

const getProductoByCodigo = async (codigo) => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('codigo', codigo)
      .single();
  
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error('Error al buscar el producto por código');
    }
    return data;
  };

const createProducto = async (productoData) => {
  const { codigo, descripcion, stock, pre_compra, pre_especial, pre_por_mayor, pre_general } = productoData;

  if (!codigo || !descripcion) {
    throw new Error('El código y la descripción son requeridos.');
  }

  // Validar que el stock sea un número válido
  const stockNumerico = parseInt(stock) || 0;
  if (stockNumerico < 0) {
    throw new Error('El stock debe ser mayor o igual a 0.');
  }

  // Convertir precios a números o null si están vacíos
  const precioCompra = pre_compra ? parseFloat(pre_compra) : null;
  const precioEspecial = pre_especial ? parseFloat(pre_especial) : null;
  const precioPorMayor = pre_por_mayor ? parseFloat(pre_por_mayor) : null;
  const precioGeneral = pre_general ? parseFloat(pre_general) : null;

  const existente = await getProductoByCodigo(codigo);
  if (existente) {
      throw new Error(`Ya existe un producto con el código ${codigo}.`);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ 
      codigo, 
      descripcion, 
      stock: stockNumerico, 
      pre_compra: precioCompra, 
      pre_especial: precioEspecial, 
      pre_por_mayor: precioPorMayor, 
      pre_general: precioGeneral 
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
        throw new Error(`Ya existe un producto con el código ${codigo}.`);
    }
    throw new Error('Error al crear el producto');
  }
  return data;
};

const updateProducto = async (id, updates) => {
  const { codigo, descripcion, stock, pre_compra, pre_especial, pre_por_mayor, pre_general, estado } = updates;

  // Validar que el stock sea un número válido si se proporciona
  let stockNumerico = stock;
  if (stock !== undefined) {
    stockNumerico = parseInt(stock) || 0;
    if (stockNumerico < 0) {
      throw new Error('El stock debe ser mayor o igual a 0.');
    }
  }

  // Convertir precios a números o null si están vacíos
  const precioCompra = pre_compra ? parseFloat(pre_compra) : null;
  const precioEspecial = pre_especial ? parseFloat(pre_especial) : null;
  const precioPorMayor = pre_por_mayor ? parseFloat(pre_por_mayor) : null;
  const precioGeneral = pre_general ? parseFloat(pre_general) : null;

  // Optimización: Usar una sola consulta que incluya la verificación
  try {
    // Primero intentamos la actualización directamente
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ 
        codigo, 
        descripcion, 
        stock: stockNumerico, 
        pre_compra: precioCompra, 
        pre_especial: precioEspecial, 
        pre_por_mayor: precioPorMayor, 
        pre_general: precioGeneral, 
        estado 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Si hay error de constraint (código duplicado)
      if (error.code === '23505') {
        throw new Error(`El código ${codigo} ya está en uso por otro producto.`);
      }
      // Si no encuentra el registro
      if (error.code === 'PGRST116') {
        throw new Error(`No se encontró un producto con el ID ${id}.`);
      }
      throw new Error('Error al actualizar el producto');
    }
    
    return data;
  } catch (error) {
    // Re-lanzar errores personalizados
    throw error;
  }
};

const deleteProducto = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ estado: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Error al eliminar el producto');
  }
  return data;
};

module.exports = {
  getAllProductos,
  getProductoById,
  getProductoByCodigo,
  searchProductos,
  createProducto,
  updateProducto,
  deleteProducto,
};
