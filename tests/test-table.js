import sql from 'mssql';
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// SQL config — mirrors mcp-server.js
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

const TABLE_TO_TEST = process.argv[2];
if (!TABLE_TO_TEST) {
  console.error('Usage:   node tests/test-table.js <schema.TableName>');
  console.error('Example: node tests/test-table.js dbo.Employees');
  process.exit(1);
}

async function main() {
  try {
    console.log(`Describing columns for: ${TABLE_TO_TEST}`);
    const pool = await sql.connect(sqlConfig);

    const [schema, name] = TABLE_TO_TEST.includes(".")
      ? TABLE_TO_TEST.split(".")
      : ["dbo", TABLE_TO_TEST];

    const result = await pool.request()
      .input('ts', sql.NVarChar, schema)
      .input('tn', sql.NVarChar, name)
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA=@ts AND TABLE_NAME=@tn 
        ORDER BY ORDINAL_POSITION;
      `);

    console.log(`Total columnas: ${result.recordset.length}`);
    result.recordset.forEach(c => {
      console.log(`- ${c.COLUMN_NAME} ${c.DATA_TYPE}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
