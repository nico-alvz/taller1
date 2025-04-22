/**
 * Custom error classes for different error types
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acceso prohibido') {
    super(message, 403);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Solicitud incorrecta') {
    super(message, 400);
  }
}

class ValidationError extends BadRequestError {
  constructor(errors, message = 'Error de validación') {
    super(message);
    this.errors = errors;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409);
  }
}

/**
 * Format error response object
 */
const formatErrorResponse = (err) => {
  const response = {
    success: false,
    status: err.statusCode || 500,
    message: err.message || 'Error interno del servidor'
  };

  // Add validation errors if available
  if (err.errors) {
    response.errors = err.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return response;
};

/**
 * Handle Sequelize-specific errors
 */
const handleSequelizeError = (err) => {
  // Handle unique constraint violations
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = Object.keys(err.fields).join(', ');
    return new ConflictError(`El valor para ${fields} ya existe en la base de datos.`);
  }

  // Handle validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return new ValidationError(errors);
  }

  // Return original error if not handled
  return err;
};

module.exports = {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ValidationError,
  ConflictError,
  formatErrorResponse,
  handleSequelizeError
};

// Utility function to hash passwords consistently
const hashPassword = async (plainPassword) => {
  const SALT_ROUNDS = 10;
  try {
    console.log(`[Password Debug] Hashing password (length: ${plainPassword.length})`);
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    console.log(`[Password Debug] Generated hash (length: ${hash.length})`);
    return hash;
  } catch (error) {
    console.error('[Password Debug] Error hashing password:', error);
    throw error;
  }
};

module.exports = {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  formatErrorResponse,
  handleSequelizeError,
  hashPassword
};
