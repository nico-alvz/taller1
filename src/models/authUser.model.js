const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/dbAuth');

class AuthUser extends Model {
  // Instance method to check if password matches
  async comparePassword(candidatePassword) {
    console.log(`[Auth Debug] Comparing passwords for user: ${this.email}`);
    console.log(`[Auth Debug] Stored hash length: ${this.passwordHash.length}`);
    console.log(`[Auth Debug] Candidate password length: ${candidatePassword.length}`);
    
    try {
      const result = await bcrypt.compare(candidatePassword, this.passwordHash);
      console.log(`[Auth Debug] Password comparison result: ${result}`);
      return result;
    } catch (error) {
      console.error(`[Auth Debug] Error comparing passwords:`, error);
      return false;
    }
  }
}

AuthUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Debe ser un correo electrónico válido',
        },
      },
    },
    // Virtual field for password that's not stored in DB
    password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        // Remember the password for later use in hooks
        this.setDataValue('password', value);
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Administrador', 'Cliente']],
          msg: 'El rol debe ser Administrador o Cliente',
        },
      },
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'AuthUser',
    tableName: 'auth_users',
    timestamps: true,
    hooks: {
      // Hash password before saving
      beforeCreate: async (user) => {
        // If password virtual field is set, hash it and store in passwordHash
        if (user.password) {
          console.log('[AuthUser Model] Hashing password for new user');
          user.passwordHash = await bcrypt.hash(user.password, 10);
        }
      },
      // Hash password before updating if it changed
      beforeUpdate: async (user) => {
        // If password virtual field is set, hash it and store in passwordHash
        if (user.password) {
          console.log('[AuthUser Model] Hashing password for update');
          user.passwordHash = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

module.exports = AuthUser;

