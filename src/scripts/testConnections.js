/**
 * Test database connections
 * 
 * This script verifies connections to both the Authentication (PostgreSQL)
 * and Users (MySQL) databases to ensure proper configuration.
 */
const { sequelize: authDb } = require('../config/dbAuth');
const { sequelize: usersDb } = require('../config/dbUsers');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Check if Docker is available
 */
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Suggest Docker setup if databases are not available
 */
function suggestDockerSetup() {
  console.log(`\n${colors.yellow}💡 Databases not available! You have two options:${colors.reset}`);
  
  if (checkDocker()) {
    console.log(`\n${colors.green}Option 1: Use Docker (Recommended)${colors.reset}`);
    console.log(`Run the following commands:
    1. ${colors.cyan}docker-compose up -d${colors.reset}
    2. Wait a few seconds for the databases to initialize
    3. Run ${colors.cyan}npm run test:db${colors.reset} again\n`);
  } else {
    console.log(`\n${colors.yellow}Option 1: Install Docker${colors.reset}`);
    console.log('1. Install Docker from https://docs.docker.com/get-docker/');
    console.log('2. Install Docker Compose');
    console.log(`3. Run ${colors.cyan}docker-compose up -d${colors.reset}`);
  }

  console.log(`\n${colors.yellow}Option 2: Install Databases Locally${colors.reset}`);
  console.log('Follow the instructions in SETUP_DATABASES.md\n');
}

/**
 * Test connection to Auth database (PostgreSQL)
 */
async function testAuthConnection() {
  console.log(`${colors.blue}Testing Authentication database connection (PostgreSQL)...${colors.reset}`);
  try {
    await authDb.authenticate();
    console.log(`${colors.green}✅ SUCCESS: Connected to Auth database${colors.reset}`);
    console.log(`${colors.cyan}Host: ${process.env.AUTH_DB_HOST || 'localhost'}${colors.reset}`);
    console.log(`${colors.cyan}Database: ${process.env.AUTH_DB_NAME || 'authentication'}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ ERROR: Could not connect to Auth database${colors.reset}`);
    console.error(`${colors.yellow}Reason: ${error.message}${colors.reset}`);
    if (error.original) {
      console.error(`${colors.yellow}Details: ${error.original.message}${colors.reset}`);
    }
    return false;
  }
}

/**
 * Test connection to Users database (MySQL)
 */
async function testUsersConnection() {
  console.log(`${colors.blue}Testing Users database connection (MySQL)...${colors.reset}`);
  try {
    await usersDb.authenticate();
    console.log(`${colors.green}✅ SUCCESS: Connected to Users database${colors.reset}`);
    console.log(`${colors.cyan}Host: ${process.env.USERS_DB_HOST || 'localhost'}${colors.reset}`);
    console.log(`${colors.cyan}Database: ${process.env.USERS_DB_NAME || 'users'}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ ERROR: Could not connect to Users database${colors.reset}`);
    console.error(`${colors.yellow}Reason: ${error.message}${colors.reset}`);
    if (error.original) {
      console.error(`${colors.yellow}Details: ${error.original.message}${colors.reset}`);
    }
    return false;
  }
}

/**
 * Run tests for both databases
 */
async function testConnections() {
  console.log(`${colors.cyan}=== StreamFlow Database Connection Tests ===${colors.reset}`);
  console.log(`${colors.cyan}Time: ${new Date().toISOString()}${colors.reset}`);
  console.log(`${colors.cyan}Environment: ${process.env.NODE_ENV || 'development'}${colors.reset}`);
  console.log('-'.repeat(50));
  
  // Test Auth database
  const authResult = await testAuthConnection();
  
  console.log('-'.repeat(50));
  
  // Test Users database
  const usersResult = await testUsersConnection();
  
  console.log('-'.repeat(50));
  
  // Summary
  if (authResult && usersResult) {
    console.log(`${colors.green}✨ All database connections successful! ✨${colors.reset}`);
    return true;
  } else {
    console.error(`${colors.red}⚠️ One or more database connections failed!${colors.reset}`);
    
    // Check if docker-compose.yml exists
    const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
    if (fs.existsSync(dockerComposePath)) {
      suggestDockerSetup();
    } else {
      console.log(`${colors.yellow}Please check SETUP_DATABASES.md for installation instructions.${colors.reset}`);
    }
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  testConnections()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`${colors.red}💥 Unhandled error during connection testing:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = {
  testConnections,
  testAuthConnection,
  testUsersConnection
};
