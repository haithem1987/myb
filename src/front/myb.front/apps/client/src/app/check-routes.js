/**
 * Manual Verification Script for Admin Coproperty Routes
 * 
 * This script validates the routing configuration without Jest dependencies.
 * Run with: node check-routes.js
 */

// Simple route validation
const routes = [
  {
    name: 'Admin Route Exists',
    test: () => {
      const fs = require('fs');
      const path = require('path');
      const routesFile = fs.readFileSync(
        path.join(__dirname, 'app.routes.ts'),
        'utf-8'
      );
      return routesFile.includes("path: 'admin'");
    },
  },
  {
    name: 'Admin Has Auth Guard',
    test: () => {
      const fs = require('fs');
      const path = require('path');
      const routesFile = fs.readFileSync(
        path.join(__dirname, 'app.routes.ts'),
        'utf-8'
      );
      const adminSection = routesFile.match(/path:\s*'admin'[\s\S]*?children:/);
      return adminSection && adminSection[0].includes('canActivate');
    },
  },
  {
    name: 'Admin Has Coproperties Child',
    test: () => {
      const fs = require('fs');
      const path = require('path');
      const routesFile = fs.readFileSync(
        path.join(__dirname, 'app.routes.ts'),
        'utf-8'
      );
      return routesFile.includes("path: 'coproperties'");
    },
  },
  {
    name: 'Coproperties Child Lazy Loads Module',
    test: () => {
      const fs = require('fs');
      const path = require('path');
      const routesFile = fs.readFileSync(
        path.join(__dirname, 'app.routes.ts'),
        'utf-8'
      );
      // Look for the admin section with coproperties child
      const adminMatch = routesFile.match(/path:\s*'admin'[\s\S]*?children:\s*\[[\s\S]*?\]/);
      if (!adminMatch) return false;
      const adminSection = adminMatch[0];
      return (
        adminSection.includes("path: 'coproperties'") &&
        adminSection.includes('loadChildren') &&
        adminSection.includes('COPROPERTY_ROUTES')
      );
    },
  },
  {
    name: 'Standalone Coproperty Route Exists',
    test: () => {
      const fs = require('fs');
      const path = require('path');
      const routesFile = fs.readFileSync(
        path.join(__dirname, 'app.routes.ts'),
        'utf-8'
      );
      return routesFile.includes("path: 'coproperty'");
    },
  },
  {
    name: 'No Nested Objects in Route Array',
    test: () => {
      const fs = require('fs');
      const path = require('path');
      const routesFile = fs.readFileSync(
        path.join(__dirname, 'app.routes.ts'),
        'utf-8'
      );
      // Check that subscriptions route is not malformed with nested admin
      const subscriptionsSection = routesFile.match(
        /path:\s*'subscriptions'[\s\S]*?},/
      );
      if (!subscriptionsSection) return false;
      // Should not have children or nested path within the same object
      const hasNestedAdmin = subscriptionsSection[0].includes("path: 'admin'");
      return !hasNestedAdmin; // Should be false (no nested admin in subscriptions)
    },
  },
];

console.log('\n🔍 Admin Coproperty Routes Validation\n');

let passed = 0;
let failed = 0;

routes.forEach((route, index) => {
  try {
    const result = route.test();
    if (result) {
      console.log(`✅ ${index + 1}. ${route.name}`);
      passed++;
    } else {
      console.log(`❌ ${index + 1}. ${route.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${route.name} - Error: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✨ All route validations passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some validations failed. Check the configuration.\n');
  process.exit(1);
}
