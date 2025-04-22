const express = require('express');
const router = express.Router();
const { 
  createUser, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getAllUsers 
} = require('../controllers/users.controller');
const { validate, validateParams, validateQuery, schemas } = require('../utils/validationMiddleware');
const { authenticate, isAdmin, isSelfOrAdmin } = require('../utils/authMiddleware');

/**
 * Custom middleware para verificar si se requiere rol de admin
 */
const checkAdminForAdminCreation = (req, res, next) => {
  if (!req.body || req.body.role !== 'Administrador') {
    return next();
  }
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Autenticación requerida para crear usuarios administradores.'
    });
  }
  
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Solo los administradores pueden crear usuarios con rol de Administrador.'
    });
  }
  
  next();
};

// Crear usuario (público para clientes, requiere admin para crear admins)
router.post('/', 
  (req, res, next) => {
    if (req.body && req.body.role === 'Administrador') {
      authenticate(req, res, next);
    } else {
      next();
    }
  },
  checkAdminForAdminCreation,
  validate(schemas.registerUser), 
  createUser
);

// Obtener usuario por ID
router.get('/:id', 
  authenticate,
  validateParams(schemas.idParam),
  isSelfOrAdmin, 
  getUserById
);

// Actualizar usuario
router.patch('/:id', 
  authenticate,
  validateParams(schemas.idParam),
  isSelfOrAdmin, 
  validate(schemas.updateUser), 
  updateUser
);

// Eliminar usuario (soft delete)
router.delete('/:id', 
  authenticate,
  validateParams(schemas.idParam),
  isAdmin, 
  deleteUser
);

// Listar todos los usuarios
router.get('/', 
  authenticate,
  isAdmin,
  validateQuery(schemas.getUsersQuery),
  getAllUsers
);

module.exports = router;
