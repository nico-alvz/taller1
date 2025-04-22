const bcrypt = require('bcrypt');
const { sequelize } = require('../../config/dbUsers');

/**
 * Create admin user for Users database
 */
const seedAdminUser = async (adminId) => {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Check if admin user already exists
    const existingAdmin = await sequelize.query(
      `SELECT * FROM users WHERE email = 'admin@streamflow.com'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('Admin user already exists in Users database, skipping');
      return;
    }
    
    // Create admin user with the same ID as in Auth database
    const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
    
    await queryInterface.bulkInsert('users', [{
      id: adminId,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@streamflow.com',
      passwordHash: adminPasswordHash,
      role: 'Administrador',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    console.log('✅ Admin user seeded successfully in Users database');
  } catch (error) {
    console.error('Error seeding admin user in Users database:', error);
    throw error;
  }
};

module.exports = seedAdminUser;

