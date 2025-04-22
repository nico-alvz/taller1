const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../config/dbAuth');

/**
 * Create admin user for testing
 */
const seedAdminUser = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const adminId = uuidv4();
  
  try {
    // Check if admin user already exists
    const existingAdmin = await sequelize.query(
      `SELECT * FROM auth_users WHERE email = 'admin@streamflow.com'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('Admin user already exists, skipping admin seed');
      return adminId;
    }
    
    // Create admin user with known credentials for testing
    const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
    
    await queryInterface.bulkInsert('auth_users', [{
      id: adminId,
      email: 'admin@streamflow.com',
      passwordHash: adminPasswordHash,
      role: 'Administrador',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    console.log('✅ Admin user seeded successfully');
    return adminId;
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
};

module.exports = seedAdminUser;

