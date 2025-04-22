const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelizeUsers = new Sequelize({
  dialect: 'mysql',
  host: process.env.USERS_DB_HOST,
  port: process.env.USERS_DB_PORT,
  database: process.env.USERS_DB_NAME,
  username: process.env.USERS_DB_USER,
  password: process.env.USERS_DB_PASSWORD,
  dialectOptions: {
    ssl: false,
    connectTimeout: 60000,
    // Add timeout to avoid query hanging
    queryTimeout: 30000,
    // Ensure proper cleanup
    typeCast: true,
    // Additional options to improve stability
    flags: [
      // These are MySQL specific connection flags
      'FOUND_ROWS',
      'IGNORE_SPACE',
      'LOCAL_FILES',
      'MULTI_RESULTS',
      'LONG_PASSWORD'
    ]
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,         
    min: 0,
    acquire: 60000,  
    idle: 20000,     
    evict: 30000     
  },
  retry: {
    max: 3,          
    match: [
      /ConnectionError/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /TimeoutError/
    ]
  },
  query: {
    raw: false
  }
});

const testUsersConnection = async () => {
  try {
    await sequelizeUsers.authenticate();
    console.log('✅ Users DB connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the Users database:', error);
    throw error;
  }
};

module.exports = {
  sequelize: sequelizeUsers,
  testConnection: testUsersConnection
};
