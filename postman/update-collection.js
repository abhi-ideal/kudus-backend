
#!/usr/bin/env node

/**
 * Script to automatically update Postman collection URLs for microservices
 * Usage: node update-collection.js [--update-urls]
 */

const fs = require('fs');
const path = require('path');

// Service URL mappings
const serviceUrlMappings = {
  '/api/auth': '{{authServiceUrl}}',
  '/api/users': '{{userServiceUrl}}', 
  '/api/content': '{{contentServiceUrl}}',
  '/api/streaming': '{{streamingServiceUrl}}',
  '/api/recommendations': '{{recommendationServiceUrl}}',
  '/api/admin': '{{adminServiceUrl}}',
  '/api/common': '{{commonServiceUrl}}'
};

// Update URLs in collection items
const updateItemUrls = (items) => {
  let updatedCount = 0;
  
  items.forEach(item => {
    if (item.item) {
      // Recursively update folder items
      updatedCount += updateItemUrls(item.item);
    } else if (item.request && item.request.url) {
      // Update individual request URLs
      let url = item.request.url;
      
      if (typeof url === 'object' && url.raw) {
        const oldUrl = url.raw;
        
        // Find matching service path and update
        for (const [servicePath, serviceVar] of Object.entries(serviceUrlMappings)) {
          if (oldUrl.includes(servicePath)) {
            // Update raw URL
            url.raw = url.raw.replace(/\{\{baseUrl\}\}|http:\/\/localhost:\d+/, serviceVar);
            
            // Update host array
            if (url.host && Array.isArray(url.host)) {
              url.host = [serviceVar];
            }
            
            updatedCount++;
            console.log(`✅ Updated: ${item.name} -> ${serviceVar}${servicePath}`);
            break;
          }
        }
      }
    }
  });
  
  return updatedCount;
};

// Main update function
const updateCollection = () => {
  console.log('🔄 Updating Postman collection for microservices...');
  
  try {
    // Read current collection
    const collectionPath = path.join(__dirname, 'OTT-Platform-API.postman_collection.json');
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    
    // Update URLs if requested
    if (process.argv.includes('--update-urls')) {
      const updatedCount = updateItemUrls(collection.item);
      console.log(`📡 Updated ${updatedCount} API endpoints with service-specific URLs`);
    }
    
    // Update metadata
    collection.info.version = `1.0.${Date.now()}`;
    collection.info._postman_updated = new Date().toISOString();
    collection.info.description = 'OTT Platform API Collection for Microservices Architecture\n\n' +
      'This collection is organized by service and uses service-specific URLs:\n' +
      '- Auth Service: http://localhost:3001\n' +
      '- User Service: http://localhost:3002\n' +
      '- Content Service: http://localhost:3003\n' +
      '- Streaming Service: http://localhost:3004\n' +
      '- Recommendation Service: http://localhost:3005\n' +
      '- Admin Service: http://localhost:3006\n' +
      '- Common Service: http://localhost:3007\n' +
      `\nLast updated: ${new Date().toLocaleString()}`;
    
    // Write updated collection
    fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
    
    console.log('✅ Postman collection updated successfully!');
    console.log(`📁 Location: ${collectionPath}`);
    console.log(`🕒 Version: ${collection.info.version}`);
    
  } catch (error) {
    console.error('❌ Error updating collection:', error.message);
    process.exit(1);
  }
};

// Auto-discovery of endpoints from route files
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
            fullPath: `/api/${service}${path}`,
            serviceUrl: serviceUrlMappings[`/api/${service}`] || '{{gatewayUrl}}'
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
        header: [
          {
            key: "Authorization",
            value: "Bearer {{authToken}}",
            type: "text"
          }
        ],
        url: {
          raw: `${endpoint.serviceUrl}${endpoint.fullPath}`,
          host: [endpoint.serviceUrl],
          path: endpoint.fullPath.split('/').filter(p => p)
        }
      }
    };
    
    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      item.request.body = {
        mode: 'raw',
        raw: '{\n    // Add request body here\n}',
        options: {
          raw: {
            language: 'json'
          }
        }
      };
      item.request.header.push({
        key: "Content-Type",
        value: "application/json",
        type: "text"
      });
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
