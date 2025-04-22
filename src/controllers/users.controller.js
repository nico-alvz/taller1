const { User, AuthUser } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { sequelize: usersDB } = require('../config/dbUsers');
const { sequelize: authDB } = require('../config/dbAuth');
const { 
  NotFoundError, 
  BadRequestError, 
  ConflictError,
  formatErrorResponse,
  handleSequelizeError
} = require('../utils/errorHandler');

/**
 * Create a new user
 * POST /usuarios
 */
const createUser = async (req, res) => {
  // Start transactions in both databases
  const usersTx = await usersDB.transaction();
  const authTx = await authDB.transaction();
  
  try {
    const { firstName, lastName, email, password, confirmPassword, role = 'Cliente' } = req.body;
    
    console.log(`[Create User] Request to create user with role: ${role}`);
    console.log(`[Create User] Authenticated user:`, req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'No authenticated user');
    
    // Note: Role validation for admin users is now handled by the conditionalAdminAuth middleware
    // If we reach this point and the role is 'Administrador', it means the user is authenticated as an admin
    if (role === 'Administrador') {
      console.log(`[Create User] Creating admin user. Authentication already verified by middleware.`);
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestError('Las contraseñas no coinciden.');
    }

    // Check if email already exists in users database
    const existingUser = await User.findOne({ 
      where: { email },
      transaction: usersTx
    });
    
    if (existingUser) {
      throw new ConflictError('El correo electrónico ya está registrado.');
    }

    // Check if email already exists in auth database
    const existingAuthUser = await AuthUser.findOne({ 
      where: { email },
      transaction: authTx
    });
    
    if (existingAuthUser) {
      throw new ConflictError('El correo electrónico ya está registrado en el sistema de autenticación.');
    }

    // Generate a single UUID for both user records
    const userId = uuidv4();
    
    console.log(`Creating user in both databases with ID: ${userId}`);

    // Create user in MySQL database
    console.log(`[User Debug] Creating user with plain password`);
    
    // Hash the password manually to ensure consistency
    const bcrypt = require('bcrypt');
    const SALT_ROUNDS = 10;
    console.log(`[Create User] Hashing password...`);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log(`[Create User] Password hashed successfully (length: ${hashedPassword.length})`);
    
    // Create user in MySQL database
    console.log(`[Create User] Creating user in MySQL with hashed password`);
    const user = await User.create({
      id: userId,
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword, // Use already hashed password
      role
    }, { 
      transaction: usersTx,
      hooks: false // Skip hooks since we already hashed the password
    });

    // Create user in PostgreSQL auth database
    console.log(`[Create User] Creating user in PostgreSQL with hashed password`);
    const authUser = await AuthUser.create({
      id: userId,
      email,
      passwordHash: hashedPassword, // Use already hashed password
      role,
      isActive: true
    }, { 
      transaction: authTx,
      hooks: false // Skip hooks since we already hashed the password
    });
    // Commit both transactions
    await usersTx.commit();
    await authTx.commit();

    console.log(`User created successfully in both databases with ID: ${userId}`);

    // Remove passwordHash from response
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      user: userResponse
    });
  } catch (error) {
    // Rollback both transactions
    await usersTx.rollback();
    await authTx.rollback();
    
    console.error('Error creating user:', error);
    
    // Handle Sequelize-specific errors
    const handledError = handleSequelizeError(error);
    const formattedError = formatErrorResponse(handledError);
    return res.status(formattedError.status).json(formattedError);
  }
};

/**
 * Get a user by ID
 * GET /usuarios/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the requesting user is allowed to access this user
    // This should be handled by middleware, but adding a check here for safety
    if (req.user.id !== id && req.user.role !== 'Administrador') {
      throw new BadRequestError('No tiene permiso para acceder a este usuario.');
    }

    // Find user
    const user = await User.findOne({ 
      where: { 
        id,
        isDeleted: false 
      } 
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }

    // Remove passwordHash from response
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    return res.status(200).json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    const formattedError = formatErrorResponse(error);
    return res.status(formattedError.status).json(formattedError);
  }
};

/**
 * Update a user
 * PATCH /usuarios/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ 
      where: { 
        id,
        isDeleted: false 
      } 
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }

    // Check if trying to update password
    if (req.body.password) {
      throw new BadRequestError('No se puede actualizar la contraseña aquí. Use /auth/usuarios/:id para cambiar la contraseña.');
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new ConflictError('El correo electrónico ya está registrado.');
      }
    }

    // Update user
    // Start transactions in both databases
    const usersTx = await usersDB.transaction();
    const authTx = await authDB.transaction();
    
    try {
      // Update user in users database
      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        email: email || user.email
      }, { transaction: usersTx });
      
      // If email was updated, also update in auth database
      if (email && email !== user.email) {
        const authUser = await AuthUser.findByPk(user.id, { transaction: authTx });
        if (authUser) {
          await authUser.update({ email }, { transaction: authTx });
        }
      }
      
      // Commit transactions
      await usersTx.commit();
      await authTx.commit();
      
      // Remove passwordHash from response
      const userResponse = user.toJSON();
      delete userResponse.passwordHash;
      
      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente.',
        user: userResponse
      });
    } catch (error) {
      // If transactions were started, roll them back
      if (usersTx) await usersTx.rollback();
      if (authTx) await authTx.rollback();
      
      throw error; // Rethrow to be caught by the outer catch
    }
  } catch (error) {
    // Handle Sequelize-specific errors
    const handledError = handleSequelizeError(error);
    const formattedError = formatErrorResponse(handledError);
    return res.status(formattedError.status).json(formattedError);
  }
};
/**
 * Delete a user (soft delete)
 * DELETE /usuarios/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }

    // Check if already deleted
    if (user.isDeleted) {
      throw new BadRequestError('El usuario ya ha sido eliminado.');
    }

    // Soft delete the user in both databases
    const usersTx = await usersDB.transaction();
    const authTx = await authDB.transaction();
    
    try {
      // Soft delete in users database
      await user.update({ isDeleted: true }, { transaction: usersTx });
      
      // Find and soft delete in auth database
      const authUser = await AuthUser.findByPk(id, { transaction: authTx });
      if (authUser) {
        await authUser.update({ isActive: false }, { transaction: authTx });
      }
      
      // Commit transactions
      await usersTx.commit();
      await authTx.commit();
      
      return res.status(204).send();
    } catch (deleteError) {
      // Rollback transactions
      await usersTx.rollback();
      await authTx.rollback();
      throw deleteError;
    }
  } catch (error) {
    const formattedError = formatErrorResponse(error);
    return res.status(formattedError.status).json(formattedError);
  }
};

/**
 * List all users
 * GET /usuarios
 */
const getAllUsers = async (req, res) => {
  try {
    // Check if user is an admin (should be done by middleware but added for safety)
    if (req.user.role !== 'Administrador') {
      throw new BadRequestError('Solo los administradores pueden listar todos los usuarios.');
    }

    // Get query parameters
    const { email, query } = req.query;

    let users;
    
    // Search by query (name or email)
    if (query) {
      users = await User.searchByNameOrEmail(query);
    } 
    // Search by email
    else if (email) {
      users = await User.findAll({
        where: {
          email: { [require('sequelize').Op.like]: `%${email}%` },
          isDeleted: false
        }
      });
    } 
    // Get all users
    else {
      users = await User.findAll({
        where: { isDeleted: false }
      });
    }

    // Remove passwordHash from response
    const usersResponse = users.map(user => {
      const userObj = user.toJSON();
      delete userObj.passwordHash;
      return userObj;
    });

    return res.status(200).json({
      success: true,
      count: usersResponse.length,
      users: usersResponse
    });
  } catch (error) {
    const formattedError = formatErrorResponse(error);
    return res.status(formattedError.status).json(formattedError);
  }
};

module.exports = {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers
};

