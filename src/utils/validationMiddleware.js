const Joi = require('joi');

/**
 * Validation schemas for all modules
 */
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'El correo electrónico debe tener un formato válido',
      'string.empty': 'El correo electrónico es requerido',
      'any.required': 'El correo electrónico es requerido'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'La contraseña es requerida',
      'any.required': 'La contraseña es requerida'
    })
  }),
  
  // Update password schema
  updatePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.empty': 'La contraseña actual es requerida',
      'any.required': 'La contraseña actual es requerida'
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
        'string.pattern.base': 'La nueva contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial',
        'string.empty': 'La nueva contraseña es requerida',
        'any.required': 'La nueva contraseña es requerida'
      }),
    confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Las contraseñas no coinciden',
      'string.empty': 'La confirmación de la nueva contraseña es requerida',
      'any.required': 'La confirmación de la nueva contraseña es requerida'
    })
  }),
  
  // User creation schema
  registerUser: Joi.object({
    firstName: Joi.string().required().messages({
      'string.empty': 'El nombre es requerido',
      'any.required': 'El nombre es requerido'
    }),
    lastName: Joi.string().required().messages({
      'string.empty': 'El apellido es requerido',
      'any.required': 'El apellido es requerido'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'El correo electrónico debe tener un formato válido',
      'string.empty': 'El correo electrónico es requerido',
      'any.required': 'El correo electrónico es requerido'
    }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.pattern.base': 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial',
        'string.empty': 'La contraseña es requerida',
        'any.required': 'La contraseña es requerida'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Las contraseñas no coinciden',
      'string.empty': 'La confirmación de contraseña es requerida',
      'any.required': 'La confirmación de contraseña es requerida'
    }),
    role: Joi.string().valid('Cliente', 'Administrador').default('Cliente').messages({
      'any.only': 'El rol debe ser Cliente o Administrador'
    })
  }),

  // User update schema
  updateUser: Joi.object({
    firstName: Joi.string().messages({
      'string.empty': 'El nombre no puede estar vacío'
    }),
    lastName: Joi.string().messages({
      'string.empty': 'El apellido no puede estar vacío'
    }),
    email: Joi.string().email().messages({
      'string.email': 'El correo electrónico debe tener un formato válido',
      'string.empty': 'El correo electrónico no puede estar vacío'
    })
  }),

  // ID param schema
  idParam: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'El ID debe ser un UUID válido',
      'string.empty': 'El ID es requerido',
      'any.required': 'El ID es requerido'
    })
  }),

  // Video schemas
  getVideos: Joi.object({
    titulo: Joi.string().allow(''),
    genero: Joi.string().allow('')
  }),

  getVideoById: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'El ID del video es requerido',
      'any.required': 'El ID del video es requerido'
    })
  }),

  // Factura schemas
  getFacturas: Joi.object({
    estado: Joi.string().valid('Pendiente', 'Pagado', 'Vencido').optional()
  }),

  getFacturaById: Joi.object({
    id: Joi.string().required().messages({
      'string.empty': 'El ID de la factura es requerido',
      'any.required': 'El ID de la factura es requerido'
    })
  }),

  updateFacturaEstado: Joi.object({
    estado: Joi.string().valid('Pendiente', 'Pagado', 'Vencido').required().messages({
      'any.only': 'El estado debe ser Pendiente, Pagado o Vencido',
      'string.empty': 'El estado es requerido',
      'any.required': 'El estado es requerido'
    })
  })
};

/**
 * Middleware to validate request body against a schema
 * @param {Object} schema - Joi schema to validate against
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Datos de entrada inválidos',
        errors: errorMessages
      });
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate request query parameters against a schema
 * @param {Object} schema - Joi schema to validate against
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Parámetros de consulta inválidos',
        errors: errorMessages
      });
    }

    // Replace request query with validated value
    req.query = value;
    next();
  };
};

/**
 * Middleware to validate request parameters against a schema
 * @param {Object} schema - Joi schema to validate against
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Parámetros de ruta inválidos',
        errors: errorMessages
      });
    }

    // Replace request params with validated value
    req.params = value;
    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateQuery,
  validateParams
};


// Añadir esquema para consulta de usuarios
schemas.getUsersQuery = Joi.object({
    email: Joi.string().email().allow(''),
    q: Joi.string().allow(''),
    role: Joi.string().valid('Cliente', 'Administrador').allow('')
});

module.exports = {
    schemas,
    validate,
    validateQuery,
    validateParams
};
