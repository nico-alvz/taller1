const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');
const { sequelize } = require('../../config/dbAuth');

/**
 * Generate random users for Authentication database
 */
const seedUsers = async (count = 100) => {
  const queryInterface = sequelize.getQueryInterface();
  const users = [];
  const userIds = [];
  
  try {
    console.log(`Generating ${count} random users for Auth database...`);
    
    // Generate random users
    for (let i = 0; i < count; i++) {
      const userId = uuidv4();
      userIds.push(userId);
      
      // Create a password hash - using a simple password for testing
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      users.push({
        id: userId,
        email: faker.internet.email().toLowerCase(),
        passwordHash,
        role: Math.random() > 0.9 ? 'Administrador' : 'Cliente', // 10% admins, 90% clients
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Log progress for large datasets
      if ((i + 1) % 20 === 0) {
        console.log(`Generated ${i + 1} / ${count} Auth users`);
      }
    }
    
    // Insert users in chunks to avoid connection timeouts
    const chunkSize = 50;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      await queryInterface.bulkInsert('auth_users', chunk);
      console.log(`Inserted Auth users chunk ${i / chunkSize + 1}`);
    }
    
    console.log(`✅ ${users.length} Auth users seeded successfully`);
    return userIds;
  } catch (error) {
    console.error('Error seeding Auth users:', error);
    throw error;
  }
};

module.exports = seedUsers;

