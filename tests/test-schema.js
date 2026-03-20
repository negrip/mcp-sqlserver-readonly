import 'dotenv/config';
import sql from 'mssql';   // 👈 faltaba este import
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env
dotenv.config({ path: path.join(__dirname, ".env") });
const envLocal = path.join(__dirname, "env.local");
if (fs.existsSync(envLocal)) {
  const txt = fs.readFileSync(envLocal, "utf8");
  txt.split("\n").forEach(line => {
    const [k, ...vp] = line.split("=");
    if (!k || k.trim().startsWith("#")) return;
    const v = vp.join("=").trim();
    if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
  });
}

// ⚙️ Config SQL igual que en mcp-sql-only.js
const sqlConfig = {
  server: process.env.SQL_SERVER || 'localhost',
  database: process.env.SQL_DATABASE || 'master',
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: (process.env.SQL_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate: (process.env.SQL_TRUST_SERVER_CERT || 'true').toLowerCase() === 'true',
    instanceName: process.env.SQL_INSTANCE || 'SQLEXPRESS'
  },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

// ---- Filtro ALLOWED_TABLES con prefijos ----
const ALLOWED_TABLES_RAW = (process.env.ALLOWED_TABLES || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function isTableAllowed(fullName) {
  if (ALLOWED_TABLES_RAW.length === 0) return true;
  for (const pat of ALLOWED_TABLES_RAW) {
    if (pat.endsWith('*')) {
      const prefix = pat.slice(0, -1);
      if (fullName.startsWith(prefix)) return true;
    } else if (fullName === pat) {
      return true;
    }
  }
  return false;
}

async function main() {
  try {
    console.log("Conectando a SQL Server...");
    const pool = await sql.connect(sqlConfig);

    const result = await pool.request().query(`
      SELECT TABLE_SCHEMA AS [schema], TABLE_NAME AS [table],
             (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS c
              WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA
              AND c.TABLE_NAME = t.TABLE_NAME) as ColumnCount
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME;
    `);

    const filtered = result.recordset.filter(r => {
      const full = `${r.schema}.${r.table}`.toLowerCase();
      return isTableAllowed(full) || isTableAllowed(r.table.toLowerCase());
    });

    console.log("Primeras 10 tablas filtradas:");
    filtered.slice(0, 10).forEach(r => {
      console.log(`- ${r.schema}.${r.table} (${r.ColumnCount} columnas)`);
    });

    console.log(`Total tablas filtradas: ${filtered.length}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
