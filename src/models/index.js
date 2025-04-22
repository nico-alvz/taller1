const AuthUser = require('./authUser.model');
const User = require('./user.model');

// Start database connection and authentication
const { testConnection: testAuthConnection } = require('../config/dbAuth');
const { testConnection: testUsersConnection } = require('../config/dbUsers');

// Initialize database connections
const initializeDB = async () => {
  // Test connections
  await testAuthConnection();
  await testUsersConnection();
  
  // Sync models with database
  if (process.env.NODE_ENV === 'development') {
    try {
      // In development, you might want to sync tables
      await AuthUser.sync({ alter: true });
      await User.sync({ alter: true });
      console.log('✅ Database models synchronized successfully');
    } catch (error) {
      console.error('❌ Error synchronizing database models:', error);
    }
  }
};

module.exports = {
  AuthUser,
  User,
  initializeDB
};

