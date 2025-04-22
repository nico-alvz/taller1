const { Sequelize } = require('sequelize');
const { sequelize: sequelizeAuth } = require('../config/dbAuth');
const { sequelize: sequelizeUsers } = require('../config/dbUsers');

const runMigrations = async () => {
  try {
    console.log('🚀 Running database migrations...\n');

    // Auth Users table migration
    console.log('Creating Auth Users table...');
    await sequelizeAuth.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        "passwordHash" VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'Cliente')),
        "lastLogin" TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
      CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
    `);
    console.log('✅ Auth Users table created successfully\n');

    // Users table migration
    console.log('Creating Users table...');
    await sequelizeUsers.query(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'Cliente')),
        isDeleted BOOLEAN DEFAULT false,
        createdAt TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP NOT NULL,
        INDEX idx_users_email (email),
        INDEX idx_users_name (firstName, lastName),
        INDEX idx_users_role (role),
        INDEX idx_users_deleted (isDeleted)
      );
    `);
    console.log('✅ Users table created successfully\n');

    console.log('✨ All migrations completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('👋 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigrations
};
