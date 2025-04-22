const { DataTypes, Model, Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/dbUsers');

class User extends Model {
  // Static method to search users by name or email
  static async searchByNameOrEmail(query) {
    return this.findAll({
      where: {
        [Op.and]: [
          { isDeleted: false },
          {
            [Op.or]: [
              { email: { [Op.like]: `%${query}%` } },
              { firstName: { [Op.like]: `%${query}%` } },
              { lastName: { [Op.like]: `%${query}%` } },
            ],
          },
        ],
      },
    });
  }
  
  // Instance method to check if password matches (for consistency with AuthUser)
  async comparePassword(candidatePassword) {
    console.log(`[User Debug] Comparing passwords for user: ${this.email}`);
    console.log(`[User Debug] Stored hash length: ${this.passwordHash.length}`);
    console.log(`[User Debug] Candidate password length: ${candidatePassword.length}`);
    
    try {
      const result = await bcrypt.compare(candidatePassword, this.passwordHash);
      console.log(`[User Debug] Password comparison result: ${result}`);
      return result;
    } catch (error) {
      console.error(`[User Debug] Error comparing passwords:`, error);
      return false;
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre no puede estar vacío',
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El apellido no puede estar vacío',
        },
      },
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
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      // Hash password before saving
      beforeCreate: async (user) => {
        // If password virtual field is set, hash it and store in passwordHash
        if (user.password) {
          console.log('[User Model] Hashing password for new user');
          user.passwordHash = await bcrypt.hash(user.password, 10);
        }
      },
      // Hash password before updating if it changed
      beforeUpdate: async (user) => {
        // If password virtual field is set, hash it and store in passwordHash
        if (user.password) {
          console.log('[User Model] Hashing password for update');
          user.passwordHash = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

module.exports = User;

