const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');
const { sequelize } = require('../../config/dbAuth');

/**
 * Create admin user in auth database
 */
const createAdminUser = async () => {
  try {
    console.log('Creating admin user in auth database...');
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if admin already exists
    const adminCheck = await sequelize.query(
      "SELECT * FROM auth_users WHERE email = 'admin@streamflow.com'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (adminCheck && adminCheck.length > 0) {
      console.log('Admin user already exists in auth database, skipping creation');
      return adminCheck[0].id;
    }
    
    // Create admin user
    const adminId = uuidv4();
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    
    await queryInterface.bulkInsert('auth_users', [{
      id: adminId,
      email: 'admin@streamflow.com',
      passwordHash: passwordHash,
      role: 'Administrador',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    console.log('✅ Admin user created successfully in auth database');
    return adminId;
  } catch (error) {
    console.error('Failed to create admin user in auth database:', error);
    throw error;
  }
};

/**
 * Generate random users in auth database
 */
const generateUsers = async (count = 100) => {
  try {
    console.log(`Generating ${count} random users in auth database...`);
    const queryInterface = sequelize.getQueryInterface();
    const users = [];
    const userIds = [];
    
    // Generate user data
    for (let i = 0; i < count; i++) {
      const userId = uuidv4();
      userIds.push(userId);
      
      // Simple password for testing
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      users.push({
        id: userId,
        email: faker.internet.email().toLowerCase(),
        passwordHash,
        role: Math.random() > 0.9 ? 'Administrador' : 'Cliente',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`Generated ${i + 1}/${count} users`);
      }
    }
    
    // Insert users in batches to avoid performance issues
    const chunkSize = 20;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      await queryInterface.bulkInsert('auth_users', chunk);
    }
    
    console.log(`✅ Successfully generated ${users.length} users in auth database`);
    return userIds;
  } catch (error) {
    console.error('Failed to generate users in auth database:', error);
    throw error;
  }
};

/**
 * Run all auth seeders
 */
const seedAuthDatabase = async (userCount = 100) => {
  try {
    // Create tables if they don't exist
    await sequelize.sync();
    
    // Create admin user
    const adminId = await createAdminUser();
    
    // Generate random users
    const userIds = await generateUsers(userCount);
    
    // Return all IDs including admin
    return [adminId, ...userIds];
  } catch (error) {
    console.error('Failed to seed auth database:', error);
    throw error;
  }
};

module.exports = {
  seedAuthDatabase,
  createAdminUser,
  generateUsers
};

