const express = require('express');
const router = express.Router();
const {
  getUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} = require('../controllers/usuarioController');

router.get('/', getUsuarios);
router.get('/:id', getUsuario);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

// Endpoint temporal para crear usuarios de prueba
router.post('/init-test-users', async (req, res) => {
  try {
    const usuarioModel = require('../models/usuario');
    
    // Verificar si ya existen usuarios
    const usuarios = await usuarioModel.getAllUsuarios();
    
    if (usuarios.length > 0) {
      return res.json({
        success: true,
        message: 'Ya existen usuarios en la base de datos',
        usuarios: usuarios.map(u => ({ id: u.id, nombre: u.nombre, usuario: u.usuario, tipo: u.tipo }))
      });
    }
    
    // Crear usuarios de prueba
    const usersToCreate = [
      {
        nombre: 'Administrador Principal',
        usuario: 'admin',
        contrasena: 'admin123',
        tipo: 'admin'
      },
      {
        nombre: 'Vendedor Principal',
        usuario: 'vendedor',
        contrasena: 'vendedor123',
        tipo: 'vendedor'
      }
    ];
    
    const createdUsers = [];
    for (const userData of usersToCreate) {
      try {
        const newUser = await usuarioModel.createUsuario(userData);
        createdUsers.push(newUser);
      } catch (error) {
        console.log(`Error creando usuario ${userData.usuario}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Usuarios de prueba creados exitosamente',
      usuarios: createdUsers
    });
    
  } catch (error) {
    console.error('Error en init-test-users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inicializar usuarios de prueba',
      error: error.message
    });
  }
});

module.exports = router;
