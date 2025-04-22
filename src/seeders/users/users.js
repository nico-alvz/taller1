const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const { sequelize } = require('../../config/dbUsers');

/**
 * Generate corresponding users for Users database
 */
const seedUsers = async (userIds) => {
  const queryInterface = sequelize.getQueryInterface();
  const users = [];
  
  try {
    console.log(`Generating ${userIds.length} users for Users database...`);
    
    // Generate users with same IDs as Auth database
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      
      // Create a password hash - using a simple password for testing
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      users.push({
        id: userId,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        passwordHash,
        role: Math.random() > 0.9 ? 'Administrador' : 'Cliente', // Same proportion as Auth
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Log progress for large datasets
      if ((i + 1) % 20 === 0) {
        console.log(`Generated ${i + 1} / ${userIds.length} Users database records`);
      }
    }
    
    // Insert users in chunks to avoid connection timeouts
    const chunkSize = 50;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      await queryInterface.bulkInsert('users', chunk);
      console.log(`Inserted Users database chunk ${i / chunkSize + 1}`);
    }
    
    console.log(`✅ ${users.length} Users database records seeded successfully`);
  } catch (error) {
    console.error('Error seeding Users database:', error);
    throw error;
  }
};

module.exports = seedUsers;

