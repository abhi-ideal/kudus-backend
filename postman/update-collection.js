
#!/usr/bin/env node

/**
 * Script to automatically update Postman collection when APIs change
 * Usage: node update-collection.js
 */

const fs = require('fs');
const path = require('path');

// Collection template with dynamic API discovery
const updateCollection = () => {
  console.log('🔄 Updating Postman collection...');
  
  // Read current collection
  const collectionPath = path.join(__dirname, 'OTT-Platform-API.postman_collection.json');
  const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
  
  // Update timestamp
  collection.info.version = `1.0.${Date.now()}`;
  collection.info._postman_updated = new Date().toISOString();
  
  // Add update metadata
  collection.info.description += `\n\nLast updated: ${new Date().toLocaleString()}`;
  
  // Write updated collection
  fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
  
  console.log('✅ Postman collection updated successfully!');
  console.log(`📁 Location: ${collectionPath}`);
  console.log(`🕒 Version: ${collection.info.version}`);
};

// Auto-discovery of new endpoints from route files
const discoverEndpoints = () => {
  console.log('🔍 Discovering API endpoints...');
  
  const servicesDir = path.join(__dirname, '..', 'services');
  const services = fs.readdirSync(servicesDir).filter(dir => {
    return fs.statSync(path.join(servicesDir, dir)).isDirectory();
  });
  
  const discoveredEndpoints = [];
  
  services.forEach(service => {
    const routesFile = path.join(servicesDir, service, 'routes.js');
    if (fs.existsSync(routesFile)) {
      const routesContent = fs.readFileSync(routesFile, 'utf8');
      
      // Extract route definitions (basic regex matching)
      const routeMatches = routesContent.match(/router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g);
      
      if (routeMatches) {
        routeMatches.forEach(match => {
          const [, method, path] = match.match(/router\.(\w+)\(['"`]([^'"`]+)['"`]/);
          discoveredEndpoints.push({
            service,
            method: method.toUpperCase(),
            path: path,
            fullPath: `/api/${service}${path}`
          });
        });
      }
    }
  });
  
  console.log(`📡 Discovered ${discoveredEndpoints.length} endpoints across ${services.length} services`);
  return discoveredEndpoints;
};

// Generate collection items from discovered endpoints
const generateCollectionItems = (endpoints) => {
  const serviceGroups = {};
  
  endpoints.forEach(endpoint => {
    if (!serviceGroups[endpoint.service]) {
      serviceGroups[endpoint.service] = [];
    }
    
    const item = {
      name: `${endpoint.method} ${endpoint.path}`,
      request: {
        method: endpoint.method,
        header: [],
        url: {
          raw: `{{baseUrl}}${endpoint.fullPath}`,
          host: ['{{baseUrl}}'],
          path: endpoint.fullPath.split('/').filter(p => p)
        }
      }
    };
    
    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      item.request.body = {
        mode: 'raw',
        raw: '{\n    // Add request body here\n}'
      };
    }
    
    serviceGroups[endpoint.service].push(item);
  });
  
  return serviceGroups;
};

// Main execution
if (require.main === module) {
  try {
    updateCollection();
    
    // Optional: Auto-discover new endpoints
    if (process.argv.includes('--discover')) {
      const endpoints = discoverEndpoints();
      const serviceGroups = generateCollectionItems(endpoints);
      
      console.log('📋 Discovered service groups:');
      Object.keys(serviceGroups).forEach(service => {
        console.log(`  📁 ${service}: ${serviceGroups[service].length} endpoints`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating collection:', error.message);
    process.exit(1);
  }
}

module.exports = { updateCollection, discoverEndpoints, generateCollectionItems };
