# SQL Query Tools — MCP Server

MCP (Model Context Protocol) server for connecting to SQL Server in readonly mode.
Allows any MCP client (Claude Desktop, GEAI, Cursor, etc.) to explore the schema and run SELECT queries against a SQL Server database.

> 📖 [Versión en español](README.es.md)

---

## Installation

### 1. Install dependencies

Open a terminal inside the project folder and run:

```bash
npm install
```

### 2. Configure the connection

The `.env` file is already included with the variables ready. Fill it in with your server details:

```env
# Connection
SQL_SERVER=my_server
SQL_DATABASE=MyDatabase
SQL_USER=my_user
SQL_PASSWORD=my_password
SQL_INSTANCE=              # leave empty if not using a named instance
SQL_ENCRYPT=false          # set to true for Azure SQL or cloud servers
SQL_TRUST_SERVER_CERT=true

# Security / filters
ALLOWED_TABLES=            # leave empty to expose all tables (supports wildcards: dbo.prefix_*)
MAX_ROWS=200               # maximum rows returned per query

# Performance
SQL_QUERY_TIMEOUT=30000    # query timeout in milliseconds (default: 30s)
SCHEMA_CACHE_TTL_MINUTES=5 # how long to cache schema results in memory (default: 5 min)

# Audit log
AUDIT_LOG=false            # set to true to enable audit logging
AUDIT_LOG_DIR=./logs       # folder where daily log files are written
```

> If `SQL_ENCRYPT` is `true` (cloud servers), make sure to also set `SQL_TRUST_SERVER_CERT=true`.

### 3. Verify the connection

```bash
npm run test-connection
```

You should see `✅ Connection successful!` along with the SQL Server version and available tables.

### 4. Verify the MCP server starts

```bash
node mcp-server.js
```

You should see `✅ MCP server connected and ready`. Close it with `Ctrl+C` — the MCP client starts it automatically when needed.

---

## Connect from your MCP client

### Claude Desktop

1. Open the Claude Desktop configuration file:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add the `sql-query-tools` block inside `mcpServers` (replace the path):

```json
{
  "mcpServers": {
    "sql-query-tools": {
      "command": "node",
      "args": ["ABSOLUTE_PATH/SQLQueryTools/mcp-server.js"]
    }
  }
}
```

3. Restart Claude Desktop from the system tray (right-click → Quit, then reopen).

4. Verify the tools icon (🔧) appears in the chat — clicking it should show the `db_*` tools.

### GEAI or other clients

Point the client to the `mcp-sql-config.json` file included in this folder, or configure it manually with the absolute path to `mcp-server.js`. Credentials are read from `.env` automatically.

### Cursor

1. Open Settings → MCP.
2. Add the same JSON block from above.
3. Restart Cursor.

---

## Available tools

| Tool | Description |
|------|-------------|
| `db_test_connection` | Tests the connection and returns server version and current datetime |
| `db_describe_schema` | Lists all tables and views with their column count (result is cached) |
| `db_describe_table` | Returns column details (name, type, nullable) for a specific table or view |
| `db_sample_data` | Returns 5 sample rows from a table — useful for the agent to understand the data |
| `db_run_readonly` | Executes a SELECT query (auto-injects TOP if no row limit is present) |
| `db_list_databases` | Returns info about the currently connected database |

---

## Configuration reference

### Security — `ALLOWED_TABLES`

Controls which tables and views are accessible. Leave empty to expose everything.

```env
ALLOWED_TABLES=dbo.Orders,dbo.Customers,dbo.Invoice_*
```

Wildcards are supported at the end of the name (`dbo.prefix_*`). The filter applies to `db_describe_schema`, `db_describe_table`, and `db_run_readonly`.

### Row limit — `MAX_ROWS`

Maximum number of rows returned by any `SELECT` query. The server automatically injects `TOP N` if the query doesn't include a limit.

```env
MAX_ROWS=200
```

### Query timeout — `SQL_QUERY_TIMEOUT`

If a query takes longer than this value (in milliseconds), it is automatically cancelled. Prevents slow or heavy queries from blocking the server.

```env
SQL_QUERY_TIMEOUT=30000   # 30 seconds
```

### Schema cache — `SCHEMA_CACHE_TTL_MINUTES`

`db_describe_schema` results are cached in memory to avoid repeated database roundtrips. After the TTL expires, the next call refreshes the cache.

```env
SCHEMA_CACHE_TTL_MINUTES=5   # cache lasts 5 minutes
```

Set to `0` to disable caching (always queries the database).

### Audit log — `AUDIT_LOG`

When enabled, every tool call is recorded in a daily log file inside `AUDIT_LOG_DIR`. Each entry includes the timestamp, tool name, query or table, result, and execution time.

```env
AUDIT_LOG=true
AUDIT_LOG_DIR=./logs
```

Log format:
```
[2026-03-27T14:32:11Z] db_run_readonly | SELECT TOP 10 * FROM dbo.Orders | rows:10 | 45ms
[2026-03-27T14:32:20Z] db_run_readonly | SELECT * FROM dbo.Users | BLOCKED: table not allowed | 0ms
```

A new file is created each day: `logs/audit-YYYY-MM-DD.log`. Blocked queries are also logged.

---

## Usage

Once the MCP is active, you can ask questions in natural language about your database. The agent will use the tools automatically to explore the schema and respond.

---

## Test scripts

```bash
npm run test-connection            # verify connectivity and list available tables
npm run test-schema                # list all tables and views with column counts
node tests/test-table.js dbo.Employees   # describe columns of a specific table
```

---

## Security

- Only `SELECT` queries are allowed. Blocked keywords: `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `CREATE`, `EXEC`, `EXECUTE`, `WAITFOR`, `XP_`, `SP_`.
- SQL comments (`--` and `/* */`) are stripped before validation.
- Tabs and newlines are normalized to prevent whitespace bypass attempts.
- Multiple statements (`;`) are not allowed.
- `SELECT TOP N` is automatically injected if no row limit is present.
- `ALLOWED_TABLES` acts as a table whitelist (supports `*` wildcards), enforced in `db_describe_schema`, `db_describe_table` and `db_run_readonly`.

### Tested attack vectors

| Category | Examples | Result |
|----------|----------|--------|
| Direct writes | `DROP`, `DELETE`, `UPDATE`, `INSERT` | ✅ Blocked |
| Multiple statements | `SELECT 1; DROP TABLE t` | ✅ Blocked |
| System procedures | `xp_cmdshell`, `EXEC sp_help` | ✅ Blocked |
| DoS | `WAITFOR DELAY '0:0:5'` | ✅ Blocked |
| Whitespace bypass | tabs and newlines between keywords | ✅ Blocked |
| Comment bypass | `/* */` and `--` before keywords | ✅ Blocked |
| Valid queries | `SELECT`, `SELECT TOP`, `COUNT`, `WHERE` | ✅ Allowed |

---

## Project structure

```
SQLQueryTools/
├── mcp-server.js          # Main MCP server
├── mcp-sql-config.json    # Reference MCP config for the client
├── .env                   # Environment variables (do not version)
├── env.example            # Environment variables template
├── package.json
├── package-lock.json
├── README.md              # English documentation
├── README.es.md           # Spanish documentation
└── tests/
    ├── test-connection.js
    ├── test-schema.js
    ├── test-table.js      # Usage: node tests/test-table.js dbo.Employees
    └── test-examples.js
```

---

## Troubleshooting

**Connection error:**
- Check that `SQL_SERVER`, `SQL_USER` and `SQL_PASSWORD` in `.env` are correct.
- For cloud servers, try setting `SQL_ENCRYPT=true`.
- If using a named instance, set `SQL_INSTANCE` (e.g. `SQLEXPRESS`).
- Confirm that port 1433 is accessible from your network.

**No tables shown in `db_describe_schema`:**
- Check `ALLOWED_TABLES` in `.env`. If empty, all tables are shown; if set, verify the names/prefixes match.

**MCP not appearing in Claude:**
- Verify the path in the config points correctly to `mcp-server.js`.
- Restart Claude Desktop after any config change.
- Check logs: Claude Desktop → Help → Open Logs Folder.

---

## Author

**--Pablon--** — [github.com/negrip](https://github.com/negrip)
