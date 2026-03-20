# SQL Query Tools — MCP Server

MCP (Model Context Protocol) server for connecting to SQL Server in readonly mode.
Allows any MCP client (Claude Desktop, GEAI, Cursor, etc.) to explore the schema and run SELECT queries against a SQL Server database.

> 📖 [Versión en español](README.es.md)

---

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the connection

The `.env` file is already included with the variables ready. Fill it in with your server details:

```env
SQL_SERVER=my_server
SQL_DATABASE=MyDatabase
SQL_USER=my_user
SQL_PASSWORD=my_password
SQL_INSTANCE=              # leave empty if not using a named instance
SQL_ENCRYPT=false
SQL_TRUST_SERVER_CERT=true
ALLOWED_TABLES=            # leave empty to expose all tables
MAX_ROWS=200
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
| `db_test_connection` | Tests the connection and returns server version |
| `db_describe_schema` | Lists tables and views with their column count |
| `db_describe_table` | Returns column details (name, type, nullable) for a table or view |
| `db_run_readonly` | Executes a SELECT query (auto-injects TOP if missing) |
| `db_list_databases` | Returns the currently connected database info |

---

## Usage

Once the MCP is active, you can ask questions in natural language about your database. The agent will use the tools automatically to explore the schema and respond.

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
    ├── test-table.js
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
