const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate, validateParams, schemas } = require('../utils/validationMiddleware');
const { authenticate } = require('../utils/authMiddleware');

/**
 * @route   POST /auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', validate(schemas.login), authController.login);

/**
 * @route   PATCH /auth/usuarios/:id
 * @desc    Update user password
 * @access  Private - User can only change their own password or Admin can change any
 */
router.patch('/usuarios/:id', 
  authenticate,
  validateParams(schemas.idParam),
  validate(schemas.updatePassword),
  authController.updatePassword
);

/**
 * @route   GET /auth/debug/check-user
 * @desc    Debug endpoint to check if a user exists in both databases
 * @access  Public (for debugging)
 */
router.get('/debug/check-user', 
  authController.checkUserExistence
);

module.exports = router;
