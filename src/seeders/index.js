const { faker } = require('@faker-js/faker');
const { AuthUser } = require('../models');
const { User } = require('../models');
const bcrypt = require('bcrypt');
const authDB = require('../config/dbAuth').sequelize;
const usersDB = require('../config/dbUsers').sequelize;

/**
 * Find or create admin user in both databases, with transaction support for consistency
 */
const findOrCreateAdmin = async () => {
  // Start transactions for both databases
  const authTx = await authDB.transaction();
  const usersTx = await usersDB.transaction();
  
  try {
    console.log('Checking for existing admin user...');
    
    // Check if admin exists in Auth DB
    let authAdmin = await AuthUser.findOne({ 
      where: { email: 'admin@streamflow.com' },
      transaction: authTx
    });
    
    // Check if admin exists in Users DB
    let userAdmin = await User.findOne({ 
      where: { email: 'admin@streamflow.com' },
      transaction: usersTx
    });
    
    const adminId = userAdmin?.id || authAdmin?.id || faker.string.uuid();
    console.log(`Admin user ID: ${adminId}`);
    
    // Generate password hash manually
    const plainPassword = 'Admin123!';
    console.log(`Hashing admin password: ${plainPassword}`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log(`Generated hash: ${hashedPassword} (length: ${hashedPassword.length})`);
    
    // If admin doesn't exist in Auth DB, create it
    if (!authAdmin) {
      console.log('Creating admin user in AuthUser database...');
      authAdmin = await AuthUser.create({
        id: adminId,
        email: 'admin@streamflow.com',
        passwordHash: hashedPassword, // Use the hash directly
        role: 'Administrador',
        isActive: true
      }, { 
        transaction: authTx,
        hooks: false // Skip hooks to avoid double hashing
      });
      console.log('✅ Admin user created in AuthUser database');
    } else {
      console.log('Admin user already exists in AuthUser database');
    }
    
    // If admin doesn't exist in Users DB, create it
    if (!userAdmin) {
      console.log('Creating admin user in User database...');
      userAdmin = await User.create({
        id: adminId,
        firstName: 'Admin',
        lastName: 'StreamFlow',
        email: 'admin@streamflow.com',
        passwordHash: hashedPassword, // Use the hash directly
        role: 'Administrador'
      }, { 
        transaction: usersTx,
        hooks: false // Skip hooks to avoid double hashing
      });
      console.log('✅ Admin user created in User database');
    } else {
      console.log('Admin user already exists in User database');
    }
    
    // Commit transactions if all operations were successful
    await authTx.commit();
    await usersTx.commit();
    
    console.log('✅ Admin user setup completed successfully');
    return adminId;
  } catch (error) {
    // Rollback transactions if any operation fails
    console.error('❌ Failed to setup admin user:', error);
    
    try {
      await authTx.rollback();
      await usersTx.rollback();
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    throw error;
  }
};

/**
 * Create regular users in both databases with transaction support
 */
const createUsers = async (count) => {
  const users = [];
  console.log(`\nGenerating ${count} regular users...`);
  
  // We'll create just a few users for testing purposes
  const actualCount = Math.min(count, 5); // Limit to 5 for testing
  
  for (let i = 0; i < actualCount; i++) {
    // Start transactions for both databases
    const authTx = await authDB.transaction();
    const usersTx = await usersDB.transaction();
    
    try {
      const userId = faker.string.uuid();
      const email = faker.internet.email();
      const plainPassword = 'User123!';
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      console.log(`Creating user ${i+1}/${actualCount}: ${email}`);
      
      // Generate password hash manually
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      console.log(`Generated hash for user: ${hashedPassword.substring(0, 10)}...`);
      
      // Create in Auth DB
      await AuthUser.create({
        id: userId,
        email,
        passwordHash: hashedPassword, // Use the hash directly
        role: 'Cliente',
        isActive: true
      }, { 
        transaction: authTx,
        hooks: false // Skip hooks to avoid double hashing
      });
      
      // Create in Users DB
      await User.create({
        id: userId,
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword, // Use the hash directly
        role: 'Cliente'
      }, { 
        transaction: usersTx,
        hooks: false // Skip hooks to avoid double hashing
      });
      
      // Commit transactions
      await authTx.commit();
      await usersTx.commit();
      
      users.push(userId);
      
      if ((i + 1) % 10 === 0 || i === actualCount - 1) {
        console.log(`✅ Created ${i + 1}/${actualCount} users`);
      }
    } catch (error) {
      // Rollback transactions
      console.error(`❌ Failed to create user ${i + 1}:`, error);
      
      try {
        await authTx.rollback();
        await usersTx.rollback();
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      
      // Continue with the next user instead of failing
      console.log(`⚠️ Skipping user ${i + 1} and continuing...`);
      continue;
    }
  }
  
  return users;
};

/**
 * Main seeder function
 */
const runSeeders = async () => {
  try {
    console.log('🌱 Starting database seeding process...\n');

    // Create or find admin user
    await findOrCreateAdmin();

    // Generate regular users (limited to a few for testing)
    const userCount = 5; // Just create a few for testing
    const userIds = await createUsers(userCount);

    console.log('\n✨ Database seeding completed successfully');
    console.log(`📊 Total users created: ${userIds.length + 1} (${userIds.length} regular users + 1 admin)`);
    console.log(`\n🔑 Admin credentials:\n  Email: admin@streamflow.com\n  Password: Admin123!`);

    return true;
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    return false;
  }
};

// Run seeders if this file is executed directly
if (require.main === module) {
  runSeeders()
    .then(success => {
      if (success) {
        console.log('\n👋 Seeding process completed successfully');
        process.exit(0);
      } else {
        console.error('\n❌ Seeding process failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unhandled error during seeding:', error);
      process.exit(1);
    });
}

module.exports = {
  runSeeders
};
