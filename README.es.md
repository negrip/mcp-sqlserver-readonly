# SQL Query Tools — MCP Server

Servidor MCP (Model Context Protocol) para conectarse a SQL Server en modo readonly.
Permite que cualquier cliente MCP (Claude Desktop, GEAI, Cursor, etc.) explore el esquema y ejecute consultas SELECT sobre una base de datos SQL Server.

---

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la conexión

El archivo `.env` ya existe en la carpeta con las variables listas. Completalo con los datos de tu servidor:

```env
SQL_SERVER=mi_servidor
SQL_DATABASE=MiBase
SQL_USER=mi_usuario
SQL_PASSWORD=mi_password
SQL_INSTANCE=              # dejar vacío si no usás instancia nombrada
SQL_ENCRYPT=false
SQL_TRUST_SERVER_CERT=true
ALLOWED_TABLES=            # dejar vacío para ver todas las tablas
MAX_ROWS=200
```

> Si `SQL_ENCRYPT` es `true` (servidores cloud), asegurate de tener `SQL_TRUST_SERVER_CERT=true` también.

### 3. Verificar la conexión

```bash
npm run test-connection
```

Deberías ver `✅ Connection successful!` con la versión de SQL Server y la lista de tablas disponibles.

### 4. Verificar que el servidor MCP arranca

```bash
node mcp-server.js
```

Deberías ver `✅ MCP server connected and ready`. Cerralo con `Ctrl+C` — el cliente MCP lo levanta automáticamente cuando lo necesita.

---

## Conectar desde tu cliente MCP

### Claude Desktop

1. Abrí el archivo de configuración de Claude Desktop:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Agregá el bloque `sql-query-tools` dentro de `mcpServers` (reemplazá la ruta):

```json
{
  "mcpServers": {
    "sql-query-tools": {
      "command": "node",
      "args": ["RUTA_ABSOLUTA/SQLQueryTools/mcp-server.js"]
    }
  }
}
```

3. Reiniciá Claude Desktop desde la bandeja del sistema (click derecho → Quit, luego volvé a abrir).

4. Verificá que aparezca el ícono de herramientas (🔧) en el chat — al hacer clic deberían verse los tools `db_*`.

### GEAI u otro cliente

Apuntá el cliente al archivo `mcp-sql-config.json` incluido en esta carpeta, o configuralo manualmente con la ruta absoluta a `mcp-server.js`. Las credenciales se leen desde el `.env` automáticamente.

### Cursor

1. Abrí Settings → MCP.
2. Agregá el mismo bloque JSON de arriba.
3. Reiniciá Cursor.

---

## Tools disponibles

| Tool | Descripción |
|------|-------------|
| `db_test_connection` | Verifica la conexión y devuelve la versión del servidor |
| `db_describe_schema` | Lista las tablas y vistas con su cantidad de columnas |
| `db_describe_table` | Detalla columnas (nombre, tipo, nullable) de una tabla o vista |
| `db_run_readonly` | Ejecuta un SELECT (inyecta TOP automáticamente si falta) |
| `db_list_databases` | Devuelve información de la base de datos conectada |

---

## Uso desde el chat

Una vez activo el MCP, podés preguntar en lenguaje natural sobre los datos de tu base de datos. El agente va a usar los tools automáticamente para explorar el esquema y responder.

---

## Seguridad

- Solo se permiten consultas `SELECT`. Se bloquean: `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `CREATE`, `EXEC`, `EXECUTE`, `WAITFOR`, `XP_`, `SP_`.
- Se eliminan comentarios SQL (`--` y `/* */`) antes de validar.
- Se normalizan tabs y saltos de línea para evitar bypasses por whitespace.
- No se permiten múltiples sentencias (`;`).
- Se inyecta automáticamente `SELECT TOP N` si la consulta no tiene límite.
- `ALLOWED_TABLES` actúa como lista blanca de tablas visibles (soporta wildcards con `*`), aplicado en `db_describe_schema`, `db_describe_table` y `db_run_readonly`.

### Vectores testeados

| Categoría | Ejemplos | Resultado |
|-----------|----------|-----------|
| Escritura directa | `DROP`, `DELETE`, `UPDATE`, `INSERT` | ✅ Bloqueado |
| Múltiples sentencias | `SELECT 1; DROP TABLE t` | ✅ Bloqueado |
| Procedimientos del sistema | `xp_cmdshell`, `EXEC sp_help` | ✅ Bloqueado |
| DoS | `WAITFOR DELAY '0:0:5'` | ✅ Bloqueado |
| Bypass con whitespace | tabs y saltos de línea entre keywords | ✅ Bloqueado |
| Bypass con comentarios | `/* */` y `--` antes de keywords | ✅ Bloqueado |
| Queries válidos | `SELECT`, `SELECT TOP`, `COUNT`, `WHERE` | ✅ Permitido |

---

## Estructura del proyecto

```
SQLQueryTools/
├── mcp-server.js          # Servidor MCP principal
├── mcp-sql-config.json    # Config MCP de referencia para el cliente
├── .env                   # Variables de entorno (no versionar)
├── env.example            # Template de variables de entorno
├── package.json
├── package-lock.json
├── README.md              # Documentación en inglés
├── README.es.md           # Documentación en español
└── tests/
    ├── test-connection.js
    ├── test-schema.js
    ├── test-table.js
    └── test-examples.js
```

---

## Troubleshooting

**Error de conexión:**
- Verificá que `SQL_SERVER`, `SQL_USER` y `SQL_PASSWORD` en `.env` sean correctos.
- Si el servidor es cloud, probá con `SQL_ENCRYPT=true`.
- Si usás instancia nombrada, definí `SQL_INSTANCE` (ej: `SQLEXPRESS`).
- Confirmá que el puerto 1433 esté accesible desde tu red.

**No aparecen tablas en `db_describe_schema`:**
- Revisá `ALLOWED_TABLES` en `.env`. Si está vacío muestra todo; si tiene valores, verificá que los nombres/prefijos coincidan.

**El MCP no aparece en Claude:**
- Verificá que la ruta en la config apunte correctamente a `mcp-server.js`.
- Reiniciá Claude Desktop después de cualquier cambio en la config.
- Revisá los logs: Claude Desktop → Help → Open Logs Folder.

---

## Autor

**--Pablon--** — [github.com/negrip](https://github.com/negrip)
