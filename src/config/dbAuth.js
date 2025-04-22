const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelizeAuth = new Sequelize({
  dialect: 'postgres',
  host: process.env.AUTH_DB_HOST,
  port: process.env.AUTH_DB_PORT,
  database: process.env.AUTH_DB_NAME,
  username: process.env.AUTH_DB_USER,
  password: process.env.AUTH_DB_PASSWORD,
  dialectOptions: {
    ssl: false,
    connectTimeout: 60000,
    statement_timeout: 30000
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

const testAuthConnection = async () => {
  try {
    await sequelizeAuth.authenticate();
    console.log('✅ Authentication DB connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the Authentication database:', error);
  }
};

module.exports = {
  sequelize: sequelizeAuth,
  testConnection: testAuthConnection
};
