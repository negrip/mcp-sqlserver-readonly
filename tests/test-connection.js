import 'dotenv/config';
import sql from 'mssql';

// Load environment variables from env.local if it exists
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), 'env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      const value = valueParts.join('=').trim();
      if (value) {
        process.env[key.trim()] = value;
      }
    }
  });
}

// SQL Server config
const sqlConfig = {
  server: process.env.SQL_SERVER || 'localhost',
  database: process.env.SQL_DATABASE || 'master',
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: (process.env.SQL_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate: (process.env.SQL_TRUST_SERVER_CERT || 'true').toLowerCase() === 'true',
    instanceName: process.env.SQL_INSTANCE || undefined
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

console.log('🔧 SQL Server configuration:');
console.log('  Server:', sqlConfig.server);
console.log('  Database:', sqlConfig.database);
console.log('  User:', sqlConfig.user);
console.log('  Instance:', sqlConfig.options.instanceName);
console.log('  Encrypt:', sqlConfig.options.encrypt);
console.log('  Trust Certificate:', sqlConfig.options.trustServerCertificate);
console.log('');

async function testConnection() {
  try {
    console.log('🚀 Connecting to SQL Server...');

    const pool = await sql.connect(sqlConfig);
    console.log('✅ Connection successful!');

    // Test simple query
    console.log('📝 Testing simple query...');
    const result = await pool.request().query('SELECT 1 as test, GETDATE() as current_datetime, @@VERSION as version');
    console.log('✅ Query executed successfully:');
    console.log(JSON.stringify(result.recordset[0], null, 2));

    // Test schema
    console.log('\n🏗️ Testing schema description...');
    const schemaResult = await pool.request().query(`
      SELECT TABLE_SCHEMA AS [schema], TABLE_NAME AS [table]
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME;
    `);
    console.log(`✅ Tables found in ${sqlConfig.database}: ${schemaResult.recordset.length}`);
    schemaResult.recordset.slice(0, 5).forEach(table => {
      console.log(`  - ${table.schema}.${table.table}`);
    });
    if (schemaResult.recordset.length > 5) {
      console.log(`  ... and ${schemaResult.recordset.length - 5} more`);
    }

    await pool.close();
    console.log('\n🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Stack trace:', error.stack);

    console.log('\n🔍 Troubleshooting suggestions:');
    console.log('1. Check that SQL Server is running and reachable');
    console.log('2. Verify the username and password are correct');
    console.log('3. If using a named instance, make sure SQL_INSTANCE is set');
    console.log('4. Confirm that TCP/IP connections are enabled on SQL Server');
    console.log('5. Check that port 1433 is open and accessible');

    process.exit(1);
  }
}

testConnection();
