const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuario');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await usuarioModel.getUsuarioById(decoded.id);

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'No autorizado, token inválido.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No autorizado, no se encontró token.' });
  }
};

const authorize = (...tipos) => {
  return (req, res, next) => {
    if (!req.user || !tipos.includes(req.user.tipo)) {
      return res.status(403).json({ 
        success: false, 
        message: `El rol '${req.user ? req.user.tipo : 'invitado'}' no tiene permiso para acceder a este recurso.` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
