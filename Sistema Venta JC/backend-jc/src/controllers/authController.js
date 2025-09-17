const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuario');

const comparePassword = async (submittedPassword, storedPassword) => {
  return await bcrypt.compare(submittedPassword, storedPassword);
};

const login = async (req, res, next) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ success: false, message: 'Por favor, ingrese usuario y contraseña.' });
  }

  try {
    const user = await usuarioModel.getUsuarioByUsername(usuario);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const isMatch = await comparePassword(contrasena, user.contrasena);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const payload = {
      id: user.id,
      nombre: user.nombre,
      tipo: user.tipo,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token: `Bearer ${token}`,
      usuario: payload
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

module.exports = {
  login,
};
