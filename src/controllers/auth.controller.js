const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { AuthUser, User } = require('../models');
const { sequelize: authDB } = require('../config/dbAuth');
const { sequelize: usersDB } = require('../config/dbUsers');
const { 
  UnauthorizedError, 
  BadRequestError, 
  NotFoundError, 
  formatErrorResponse 
} = require('../utils/errorHandler');

/**
 * Generate JWT token for a user
 */
const generateToken = (user) => {
  console.log(`[Token Debug] Generating token for user: ${user.id}, role: ${user.role}`);
  try {
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1h' }
    );
    console.log(`[Token Debug] Token generated successfully, length: ${token.length}`);
    return token;
  } catch (error) {
    console.error(`[Token Debug] Error generating token:`, error);
    throw error;
  }
};

/**
 * Login a user
 * POST /auth/login
 */
const login = async (req, res) => {
  console.log(`[Auth] ====== LOGIN ATTEMPT STARTED ======`);
  console.log(`[Auth] Request received at: ${new Date().toISOString()}`);
  
  try {
    console.log(`[Auth] Extracting credentials from request body`);
    const { email, password } = req.body;
    
    console.log(`[Auth] Login attempt for email: ${email}`);
    console.log(`[Auth] Password length: ${password ? password.length : 'undefined'}`);
    
    console.log(`[Auth] About to query database for user`);
    console.time('[Auth] Database query time');
    
    // Find user by email
    const user = await AuthUser.findOne({ where: { email } });
    
    console.timeEnd('[Auth] Database query time');
    console.log(`[Auth] Database query completed`);
    
    // Check if user exists and is active
    if (!user) {
      console.log(`[Auth] User not found: ${email}`);
      throw new UnauthorizedError('Credenciales inválidas o usuario inactivo.');
    }
    
    console.log(`[Auth] User found: ${user.id}`);
    console.log(`[Auth] User active status: ${user.isActive}`);
    console.log(`[Auth] User role: ${user.role}`);
    console.log(`[Auth] Password hash length: ${user.passwordHash ? user.passwordHash.length : 'undefined'}`);
    
    if (!user.isActive) {
      console.log(`[Auth] User is inactive: ${email}`);
      throw new UnauthorizedError('Credenciales inválidas o usuario inactivo.');
    }
    
    // Check if password is correct
    console.log(`[Auth] About to check password`);
    console.time('[Auth] Password comparison time');
    
    const isPasswordValid = await user.comparePassword(password);
    
    console.timeEnd('[Auth] Password comparison time');
    console.log(`[Auth] Password validation result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`[Auth] Password validation failed for user: ${email}`);
      throw new UnauthorizedError('Credenciales inválidas.');
    }
    
    console.log(`[Auth] Password validation successful for user: ${email}`);
    
    // Update last login timestamp
    console.log(`[Auth] Updating last login timestamp`);
    user.lastLogin = new Date();
    
    console.log(`[Auth] About to save user with updated timestamp`);
    await user.save();
    console.log(`[Auth] User saved successfully`);
    
    // Generate token
    console.log(`[Auth] About to generate token`);
    console.time('[Auth] Token generation time');
    
    const token = generateToken(user);
    
    console.timeEnd('[Auth] Token generation time');
    console.log(`[Auth] Token generated successfully, length: ${token.length}`);
    
    // Prepare response
    console.log(`[Auth] Preparing success response`);
    const response = {
      success: true,
      message: 'Inicio de sesión exitoso.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token
    };
    
    console.log(`[Auth] About to send response`);
    console.log(`[Auth] ====== LOGIN ATTEMPT COMPLETED SUCCESSFULLY ======`);
    
    // Return user info and token
    return res.status(200).json(response);
  } catch (error) {
    console.error(`[Auth] Error during login:`, error);
    console.log(`[Auth] ====== LOGIN ATTEMPT FAILED ======`);
    
    const formattedError = formatErrorResponse(error);
    return res.status(formattedError.status).json(formattedError);
  }
};

/**
 * Update user password
 * PATCH /auth/usuarios/:id
 */
const updatePassword = async (req, res) => {
  // Start transactions for both databases
  const authTx = await authDB.transaction();
  const usersTx = await usersDB.transaction();
  
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    console.log(`[Password Update] Updating password for user ID: ${id}`);

    // Check if the user making the request is the same as the user being updated
    // or is an administrator (this should be handled by middleware)
    if (req.user.id !== id && req.user.role !== 'Administrador') {
      throw new UnauthorizedError('No tiene permiso para actualizar esta contraseña.');
    }

    // Find user in AuthUser database
    const authUser = await AuthUser.findByPk(id, { transaction: authTx });
    if (!authUser) {
      throw new NotFoundError('Usuario no encontrado en sistema de autenticación.');
    }
    
    // Find user in Users database
    const user = await User.findByPk(id, { transaction: usersTx });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado en sistema de usuarios.');
    }
    
    console.log(`[Password Update] Found both users with email: ${authUser.email}`);

    // Verify current password
    const isPasswordValid = await authUser.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestError('La contraseña actual es incorrecta.');
    }
    
    // Generate hash directly (not using model hooks to ensure consistency)
    console.log(`[Password Update] Generating hash for new password`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`[Password Update] Hash length: ${hashedPassword.length}`);
    
    if (hashedPassword.length < 20) {
      throw new Error('Error al generar el hash de la contraseña');
    }
    
    // Update password in AuthUser
    await authUser.update({ 
      passwordHash: hashedPassword
    }, { 
      transaction: authTx,
      hooks: false // Skip hooks since we're handling hashing ourselves
    });
    
    // Update password in User
    await user.update({ 
      passwordHash: hashedPassword
    }, { 
      transaction: usersTx,
      hooks: false // Skip hooks since we're handling hashing ourselves
    });
    
    // Commit transactions if everything succeeded
    await authTx.commit();
    await usersTx.commit();
    
    console.log(`[Password Update] Successfully updated password for: ${authUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente.',
      user: {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        lastLogin: authUser.lastLogin
      }
    });
  } catch (error) {
    // Rollback transactions if anything failed
    console.error(`[Password Update] Error: ${error.message}`);
    console.error(error.stack);
    
    try {
      await authTx.rollback();
      await usersTx.rollback();
    } catch (rollbackError) {
      console.error(`[Password Update] Error during rollback: ${rollbackError.message}`);
    }
    
    const formattedError = formatErrorResponse(error);
    return res.status(formattedError.status).json(formattedError);
  }
};

/**
 * Debug endpoint to check if a user exists in both databases
 * GET /auth/debug/check-user
 */
const checkUserExistence = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un correo electrónico'
      });
    }
    
    console.log(`[Debug] Checking existence for email: ${email}`);
    
    // Find user in auth database
    const authUser = await AuthUser.findOne({ where: { email } });
    
    // Find user in users database
    const user = await User.findOne({ where: { email } });
    
    return res.status(200).json({
      success: true,
      email,
      existsInAuth: !!authUser,
      existsInUsers: !!user,
      authUser: authUser ? {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        isActive: authUser.isActive,
        hashLength: authUser.passwordHash ? authUser.passwordHash.length : 0,
        lastLogin: authUser.lastLogin
      } : null,
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hashLength: user.passwordHash ? user.passwordHash.length : 0,
        isDeleted: user.isDeleted
      } : null
    });
  } catch (error) {
    console.error(`[Debug] Error checking user existence:`, error);
    const formattedError = formatErrorResponse(error);
    return res.status(formattedError.status).json(formattedError);
  }
};

// Export controller functions
module.exports = {
  login,
  updatePassword,
  checkUserExistence
};
