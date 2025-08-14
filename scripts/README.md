
# Scripts Directory

This directory contains utility scripts for the OTT Platform.

## Available Scripts

### setup-databases.js
Creates all required MySQL databases for the microservices.

```bash
npm run setup-dbs
```

### setup-env.js
Generates `.env` files for each service with their respective environment variables.

```bash
npm run setup-env
```

## Usage

1. **First-time setup:**
   ```bash
   # Copy the environment template
   cp .env.template .env
   
   # Edit .env with your actual values
   nano .env
   
   # Generate service-specific .env files
   npm run setup-env
   
   # Setup databases
   npm run setup-dbs
   ```

2. **Development:**
   ```bash
   npm run dev
   ```

## Environment Variables

Each service gets its own `.env` file with:

- **Common variables**: Database connection, frontend URL, etc.
- **Service-specific variables**: Port, service name, specific dependencies
- **Reference variables**: Variables that reference the main `.env` file using `${}` syntax

### Service Ports

- Gateway: 5000
- Auth Service: 3001
- User Service: 3002
- Content Service: 3003
- Streaming Service: 3004
- Recommendation Service: 3005
- Admin Service: 3006
- Common Service: 3007
