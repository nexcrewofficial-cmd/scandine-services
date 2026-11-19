import fs from 'fs';
import path from 'path';
import Converter from 'openapi-to-postmanv2';

const openapiPath = path.join(process.cwd(), 'src', 'docs', 'openapi.json');
const localOnly = process.argv.includes("--local-only");
const outputPath = path.join(process.cwd(), 'postman_collection.json');

// Brain artifact directory for sharing with frontend developers
const artifactDir = 'C:/Users/Lenovo/.gemini/antigravity/brain/dd4a65ff-e19b-4f87-a697-eb60692a7dbf';

if (!fs.existsSync(openapiPath)) {
  console.error(`❌ OpenAPI file not found at: ${openapiPath}`);
  process.exit(1);
}

const openapiData = fs.readFileSync(openapiPath, 'utf8');

const options: Converter.Options = {
  folderStrategy: 'Tags',
  requestParametersResolution: 'Schema',
  schemaFaker: true,
};

function injectAutoAuthScripts(items: any[]) {
  for (const item of items) {
    if (item.item && Array.isArray(item.item)) {
      injectAutoAuthScripts(item.item);
    } else if (item.request) {
      const urlPath = (item.request.url?.path || []).join('/');

      // Admin Login: Auto-extract and set adminToken & bearerToken
      if (urlPath.includes('auth/admin/login')) {
        item.request.body = {
          mode: 'raw',
          raw: JSON.stringify(
            {
              email: '{{adminEmail}}',
              password: '{{adminPassword}}',
            },
            null,
            2
          ),
          options: { raw: { language: 'json' } },
        };

        item.event = [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'if (pm.response.code === 200) {',
                '    var json = pm.response.json();',
                '    var token = (json.data && json.data.accessToken) ? json.data.accessToken : (json.accessToken || "");',
                '    if (token) {',
                '        pm.collectionVariables.set("adminToken", token);',
                '        pm.collectionVariables.set("bearerToken", token);',
                '        console.log("✅ Admin token set in collection variables");',
                '    }',
                '}',
              ],
            },
          },
        ];
      }

      // Staff PIN Login: Auto-extract and set staffToken & bearerToken
      if (urlPath.includes('auth/staff/login')) {
        item.request.body = {
          mode: 'raw',
          raw: JSON.stringify(
            {
              venueId: '{{venueId}}',
              pinCode: '{{waiterPin}}',
            },
            null,
            2
          ),
          options: { raw: { language: 'json' } },
        };

        item.event = [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                'if (pm.response.code === 200) {',
                '    var json = pm.response.json();',
                '    var token = (json.data && json.data.accessToken) ? json.data.accessToken : (json.accessToken || "");',
                '    if (token) {',
                '        pm.collectionVariables.set("staffToken", token);',
                '        pm.collectionVariables.set("bearerToken", token);',
                '        console.log("✅ Staff token set in collection variables");',
                '    }',
                '}',
              ],
            },
          },
        ];
      }
    }
  }
}

function organizeCollectionByModule(tagFolders: any[]) {
  const folderMap = new Map<string, any>();
  for (const folder of tagFolders) {
    folderMap.set(folder.name, folder);
  }

  const getFolder = (name: string) => folderMap.get(name);

  // 0. Common & System APIs
  const systemFolder = getFolder('System') || { name: 'System', item: [] };
  const webhookFolder = getFolder('Webhooks') || { name: 'Webhooks', item: [] };
  const authFolder = getFolder('Authentication') || { name: 'Authentication', item: [] };

  const commonAuthRequests = (authFolder.item || []).filter((reqItem: any) => {
    const urlPath = (reqItem.request?.url?.path || []).join('/');
    return urlPath.includes('refresh') || urlPath.includes('logout');
  });

  const commonItems = [
    systemFolder,
    {
      name: 'Common Authentication',
      description: 'JWT Token Refresh and Session Revocation for all user roles',
      item: commonAuthRequests,
    },
    webhookFolder,
  ];

  const commonModuleFolder = {
    name: '0. Common & System',
    description: 'Shared platform APIs: Gateway health check, JWT session renewal, user sign-out, and Stripe webhooks.',
    item: commonItems,
  };

  // 1. Admin Module
  const adminAuthRequests = (authFolder.item || []).filter((reqItem: any) => {
    const urlPath = (reqItem.request?.url?.path || []).join('/');
    return urlPath.includes('admin/login');
  });

  const staffShiftsFolder = getFolder('Staff Shifts') || { name: 'Staff Shifts', item: [] };
  const adminShiftRequests = (staffShiftsFolder.item || []).filter((reqItem: any) => {
    return reqItem.request?.method === 'GET';
  });

  const promosFolder = getFolder('Promotions') || { name: 'Promotions', item: [] };
  const adminPromoRequests = (promosFolder.item || []).filter((reqItem: any) => {
    const urlPath = (reqItem.request?.url?.path || []).join('/');
    return !urlPath.includes('validate');
  });

  const adminItems = [
    {
      name: 'Admin Authentication',
      description: 'Admin Email & Password Login',
      item: adminAuthRequests,
    },
    getFolder('Staff Management'),
    {
      name: 'Staff Shifts & Payroll',
      description: 'Timesheets and Payroll Hours',
      item: adminShiftRequests,
    },
    getFolder('Venue Admin'),
    getFolder('Menu Management'),
    getFolder('Inventory'),
    {
      name: 'Promotions & Discounts',
      description: 'Promo code campaign configuration',
      item: adminPromoRequests,
    },
    getFolder('Finance & Transactions'),
  ].filter(Boolean);

  const adminModuleFolder = {
    name: '1. Admin Module',
    description: 'Administrative Portal: Staff management, payroll timesheets, venue profile, menu catalogs, inventory, promos, and financial audit logs.',
    item: adminItems,
  };

  // 2. Customer & User Module
  const customerPromoRequests = (promosFolder.item || []).filter((reqItem: any) => {
    const urlPath = (reqItem.request?.url?.path || []).join('/');
    return urlPath.includes('validate');
  });

  const customerItems = [
    getFolder('Customer Web'),
    {
      name: 'Cart & Checkout',
      item: getFolder('Cart & Ordering')?.item || [],
    },
    {
      name: 'Coupon Validation',
      item: customerPromoRequests,
    },
    getFolder('Orders'),
  ].filter(Boolean);

  const customerModuleFolder = {
    name: '2. Customer & User Module',
    description: 'Customer Web & QR Ordering: Device registration, favorites, public menu, cart sync, checkout (Stripe/cash), and order tracking.',
    item: customerItems,
  };

  // 3. Waiter POS Module
  const waiterAuthRequests = (authFolder.item || []).filter((reqItem: any) => {
    const urlPath = (reqItem.request?.url?.path || []).join('/');
    return urlPath.includes('staff/login');
  });

  const waiterShiftRequests = (staffShiftsFolder.item || []).filter((reqItem: any) => {
    return reqItem.request?.method === 'POST';
  });

  const waiterItems = [
    {
      name: 'Waiter Authentication',
      description: '4-Digit POS PIN Quick Login',
      item: waiterAuthRequests,
    },
    {
      name: 'Shift Clock In / Out',
      description: 'Staff shift time tracking',
      item: waiterShiftRequests,
    },
    getFolder('Waiter & Floor Staff'),
  ].filter(Boolean);

  const waiterModuleFolder = {
    name: '3. Waiter POS Module',
    description: 'Waitstaff POS & Table Operations: Floor map color status, manual order punch, food delivery, manager PIN void, and cash collection.',
    item: waiterItems,
  };

  // 4. Kitchen Display System (KDS) Module
  const kdsModuleFolder = {
    name: '4. Kitchen Display System (KDS) Module',
    description: 'Kitchen display screens, station routing, SLA timers, ticket progression, ESC/POS thermal KOT print slip, and quick stock 86-ing.',
    item: getFolder('KDS & Kitchen')?.item || [],
  };

  const moduleFolders = [
    commonModuleFolder,
    adminModuleFolder,
    customerModuleFolder,
    waiterModuleFolder,
    kdsModuleFolder,
  ];

  return {
    moduleFolders,
    commonItems,
  };
}

Converter.convert(
  { type: 'string', data: openapiData },
  options,
  async (err, result) => {
    if (err) {
      console.error('❌ Error converting OpenAPI to Postman:', err);
      process.exit(1);
    }

    if (!result.result) {
      console.error('❌ Conversion failed:', result.reason);
      process.exit(1);
    }

    const collection = result.output[0].data;

    // Enhance collection with standard variables for Scan & Dine
    const standardVariables = [
      { key: 'baseUrl', value: 'http://localhost:8080', type: 'string' },
      { key: 'bearerToken', value: '', type: 'string' },
      { key: 'adminToken', value: '', type: 'string' },
      { key: 'staffToken', value: '', type: 'string' },
      { key: 'venueId', value: '6af35497ae8e876a3604381d', type: 'string' },
      { key: 'venueSlug', value: 'pizza-palace', type: 'string' },
      { key: 'adminEmail', value: 'admin@pizzapalace.com', type: 'string' },
      { key: 'adminPassword', value: 'AdminPassword123!', type: 'string' },
      { key: 'managerPin', value: '1111', type: 'string' },
      { key: 'waiterPin', value: '2222', type: 'string' },
      { key: 'kitchenPin', value: '3333', type: 'string' },
      { key: 'cashierPin', value: '4444', type: 'string' },
      { key: 'deviceUUID', value: 'device_uuid_test_123', type: 'string' },
    ];

    collection.variable = standardVariables;

    // Inject automated token saving test scripts
    if (collection.item) {
      injectAutoAuthScripts(collection.item);

      // Reorganize into clean module-wise folders
      const { moduleFolders, commonItems } = organizeCollectionByModule(collection.item);
      collection.item = moduleFolders;

      // 1. Write the full module-wise postman_collection.json
      fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf8');
      console.log(`\n🎉 Success! Module-wise Postman collection generated at:\n   ${outputPath}`);

      // 2. Mirror master collection to Antigravity brain artifact directory for frontend developer sharing
      if (!localOnly && fs.existsSync(artifactDir)) {
        fs.writeFileSync(path.join(artifactDir, 'postman_collection.json'), JSON.stringify(collection, null, 2), 'utf8');
        console.log(`🎉 Success! Mirrored collection to Antigravity artifact directory:\n   ${artifactDir}`);
      }
    }

    // If Postman Cloud API credentials exist, sync automatically to Postman workspace
    const apiKey = process.env.POSTMAN_API_KEY;
    const collectionUid = process.env.POSTMAN_COLLECTION_UID;

    if (!localOnly && apiKey && collectionUid) {
      console.log('🔄 Syncing directly to Postman Cloud...');
      try {
        const response = await fetch(`https://api.getpostman.com/collections/${collectionUid}`, {
          method: 'PUT',
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ collection }),
        });

        if (response.ok) {
          console.log('🚀 Successfully synchronized to Postman Cloud!');
        } else {
          const errData = await response.json();
          console.warn('⚠️ Postman Cloud sync returned an error:', errData);
        }
      } catch (cloudErr) {
        console.warn('⚠️ Could not connect to Postman Cloud API:', cloudErr);
      }
    } else {
      console.log('💡 Tip: Set POSTMAN_API_KEY and POSTMAN_COLLECTION_UID in your .env to enable direct cloud sync.');
    }
  }
);
