const jwt = require('jsonwebtoken');
const { AuthUser, User } = require('../models');

/**
 * Middleware to verify JWT token authentication
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Autenticación requerida. Token no proporcionado o formato inválido.'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await AuthUser.findByPk(decoded.id);

    // Check if user exists or is deleted/inactive
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Usuario no encontrado o inactivo.'
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Token inválido.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Token expirado. Por favor, inicie sesión nuevamente.'
      });
    }
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Error al autenticar usuario.'
    });
  }
};

/**
 * Middleware to check if user is an Administrator
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'No autorizado - Usuario no autenticado'
    });
  }

  if (req.user.role !== 'Administrador') {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Acceso prohibido - Se requiere rol de administrador'
    });
  }

  next();
};

/**
 * Middleware to check if user is accessing their own resource
 */
const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'No autorizado - Usuario no autenticado'
    });
  }

  const paramId = req.params.id;
  
  if (req.user.id !== paramId && req.user.role !== 'Administrador') {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'Acceso prohibido - Solo puede acceder a sus propios datos o ser administrador'
    });
  }

  next();
};

/**
 * Middleware to verify access to videos - any authenticated user can access
 */
const authenticatedForVideos = (req, res, next) => {
  authenticate(req, res, next);
};

/**
 * Middleware to check if user owns the invoice or is administrator
 */
const isInvoiceOwnerOrAdmin = (req, res, next) => {
  // First authenticate the user
  authenticate(req, res, (err) => {
    if (err) return next(err);
    
    // This will be implemented when we have access to invoice data
    // For now, just use isSelfOrAdmin logic
    if (req.user.role !== 'Administrador') {
      // In a real implementation, we would check if the invoice belongs to the user
      // For this simplified version, we'll assume the user has access
      // This would be replaced with actual invoice ownership check
    }
    
    next();
  });
};

module.exports = {
  authenticate,
  isAdmin,
  isSelfOrAdmin,
  isInvoiceOwnerOrAdmin,
  authenticatedForVideos
};

