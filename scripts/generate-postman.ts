import fs from 'fs';
import path from 'path';
import Converter from 'openapi-to-postmanv2';

const openapiPath = path.join(process.cwd(), 'src', 'docs', 'openapi.json');
const outputPath = path.join(process.cwd(), 'postman_collection.json');

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
    collection.variable = [
      { key: 'baseUrl', value: 'http://localhost:3000', type: 'string' },
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

    // Inject automated token saving test scripts
    if (collection.item) {
      injectAutoAuthScripts(collection.item);
    }

    // Write local postman_collection.json
    fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf8');
    console.log(`\n🎉 Success! Postman collection generated at:\n   ${outputPath}`);

    // If Postman Cloud API credentials exist, sync automatically to Postman workspace
    const apiKey = process.env.POSTMAN_API_KEY;
    const collectionUid = process.env.POSTMAN_COLLECTION_UID;

    if (apiKey && collectionUid) {
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
