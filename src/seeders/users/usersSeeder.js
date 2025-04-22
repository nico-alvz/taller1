const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const { sequelize } = require('../../config/dbUsers');

/**
 * Create admin user in users database
 */
const createAdminUser = async (adminId) => {
  try {
    console.log('Creating admin user in users database...');
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if admin already exists
    const adminCheck = await sequelize.query(
      "SELECT * FROM users WHERE email = 'admin@streamflow.com'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (adminCheck && adminCheck.length > 0) {
      console.log('Admin user already exists in users database, skipping creation');
      return;
    }
    
    // Create admin user with same ID as in auth database
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    
    await queryInterface.bulkInsert('users', [{
      id: adminId,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@streamflow.com',
      passwordHash,
      role: 'Administrador',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    console.log('✅ Admin user created successfully in users database');
  } catch (error) {
    console.error('Failed to create admin user in users database:', error);
    throw error;
  }
};

/**
 * Generate users in users database matching auth database IDs
 */
const generateUsers = async (userIds) => {
  try {
    console.log(`Generating ${userIds.length} users in users database...`);
    const queryInterface = sequelize.getQueryInterface();
    const users = [];
    
    // Generate user data with matching IDs from auth database
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      
      // Simple password for testing
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      users.push({
        id: userId,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        passwordHash,
        role: Math.random() > 0.9 ? 'Administrador' : 'Cliente',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`Generated ${i + 1}/${userIds.length} users`);
      }
    }
    
    // Insert users in batches to avoid performance issues
    const chunkSize = 20;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      await queryInterface.bulkInsert('users', chunk);
    }
    
    console.log(`✅ Successfully generated ${users.length} users in users database`);
  } catch (error) {
    console.error('Failed to generate users in users database:', error);
    throw error;
  }
};

/**
 * Run all users seeders
 */
const seedUsersDatabase = async (adminId, userIds) => {
  try {
    // Create tables if they don't exist
    await sequelize.sync();
    
    // Create admin user with matching ID from auth database
    await createAdminUser(adminId);
    
    // Generate random users with matching IDs from auth database
    await generateUsers(userIds);
  } catch (error) {
    console.error('Failed to seed users database:', error);
    throw error;
  }
};

module.exports = {
  seedUsersDatabase,
  createAdminUser,
  generateUsers
};

