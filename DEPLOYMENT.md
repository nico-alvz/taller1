# StreamFlow API - Deployment Guide

## Prerequisites

- Node.js v18 or later
- PostgreSQL database (Supabase)
- MySQL database
- Git

## Environment Variables

The following environment variables must be set in your deployment environment:

### Application Settings
- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

### JWT Configuration
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRATION`: Token expiration time (e.g., "1h")

### Authentication Database (PostgreSQL)
- `AUTH_DB_HOST`: PostgreSQL host
- `AUTH_DB_PORT`: PostgreSQL port (default: 5432)
- `AUTH_DB_NAME`: Database name
- `AUTH_DB_USER`: Database user
- `AUTH_DB_PASSWORD`: Database password

### Users Database (MySQL)
- `USERS_DB_HOST`: MySQL host
- `USERS_DB_PORT`: MySQL port (default: 3306)
- `USERS_DB_NAME`: Database name
- `USERS_DB_USER`: Database user
- `USERS_DB_PASSWORD`: Database password

## Deployment Steps

1. **Database Setup**
   - Create PostgreSQL database in Supabase
   - Create MySQL database in your preferred provider
   - Save connection credentials

2. **Environment Configuration**
   - Copy .env.example to .env
   - Update with production credentials
   - Set secure JWT_SECRET

3. **Application Deployment**

   ### Using Render
   1. Connect your GitHub repository
   2. Create a new Web Service
   3. Select the repository
   4. Configure environment variables
   5. Deploy

   ### Manual Deployment
   ```bash
   # Install dependencies
   npm install

   # Run migrations
   npm run migrate

   # Start application
   npm start
   ```

## Post-Deployment Verification

1. Check Application Status
   ```bash
   curl https://your-api-url/health
   ```

2. Test Authentication
   ```bash
   # Login with default admin
   curl -X POST https://your-api-url/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@streamflow.com","password":"Admin123!"}'
   ```

## Monitoring & Maintenance

- Monitor application logs in Render dashboard
- Set up alerts for error rates and response times
- Regularly backup databases
- Update dependencies periodically

## Troubleshooting

Common issues and solutions:

1. **Database Connection Errors**
   - Verify connection strings
   - Check network access/firewall rules
   - Validate database credentials

2. **Application Errors**
   - Check application logs
   - Verify environment variables
   - Validate database migrations

3. **Performance Issues**
   - Monitor database connections
   - Check resource utilization
   - Review query performance

## Support

For deployment issues:
1. Check the logs in Render dashboard
2. Review environment variables
3. Verify database connectivity
4. Contact support team if issues persist

