// Ejemplos de uso de las herramientas del MCP server
// Este archivo es solo para referencia, no se ejecuta directamente

// Ejemplo 1: Chat directo con GEAI
const geaiChatExample = {
  name: "geai.chat",
  arguments: {
    message: "¿Cuáles son las mejores prácticas para optimizar consultas SQL Server?",
    system: "Eres un experto en bases de datos SQL Server con 20 años de experiencia",
    extra: {
      temperature: 0.7,
      max_tokens: 1000
    }
  }
};

// Ejemplo 2: Consultar esquema de base de datos
const describeSchemaExample = {
  name: "db.describe_schema",
  arguments: {}
};

// Ejemplo 3: Ejecutar consulta SQL directa
const runQueryExample = {
  name: "db.run_readonly",
  arguments: {
    query: "SELECT TOP 10 customer_id, first_name, last_name, email FROM dbo.customers WHERE city = 'Madrid' ORDER BY last_name"
  }
};

// Ejemplo 4: Pregunta en lenguaje natural que se convierte a SQL
const naturalLanguageExample = {
  name: "db.ask_nl",
  arguments: {
    question: "Muéstrame los 5 clientes con más ventas en el último mes, incluyendo su nombre y total de ventas",
    assistantId: "asst_XXXXXXXX" // opcional, usa el por defecto si no se especifica
  }
};

// Ejemplo 5: Consulta más compleja en lenguaje natural
const complexQueryExample = {
  name: "db.ask_nl",
  arguments: {
    question: "¿Cuál es el promedio de ventas por región y cuántos clientes hay en cada una? Solo incluye regiones con más de 10 clientes."
  }
};

// Ejemplo 6: Chat con GEAI para análisis de datos
const dataAnalysisExample = {
  name: "geai.chat",
  arguments: {
    message: "Analiza estos datos de ventas y sugiere estrategias para mejorar las ventas en la región con menor rendimiento",
    system: "Eres un analista de datos experto en identificar patrones y oportunidades de mejora en ventas"
  }
};

// Ejemplo 7: Consulta de auditoría
const auditExample = {
  name: "db.run_readonly",
  arguments: {
    query: "SELECT TOP 50 table_name, column_name, data_type, is_nullable FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name IN ('customers', 'orders', 'products') ORDER BY table_name, ordinal_position"
  }
};

// Ejemplo 8: Pregunta sobre rendimiento
const performanceExample = {
  name: "db.ask_nl",
  arguments: {
    question: "Identifica las consultas más lentas en la base de datos y sugiere índices para optimizarlas"
  }
};

console.log("Ejemplos de uso de las herramientas MCP:");
console.log("1. Chat con GEAI:", JSON.stringify(geaiChatExample, null, 2));
console.log("2. Describir esquema:", JSON.stringify(describeSchemaExample, null, 2));
console.log("3. Ejecutar consulta:", JSON.stringify(runQueryExample, null, 2));
console.log("4. Pregunta en lenguaje natural:", JSON.stringify(naturalLanguageExample, null, 2));
console.log("5. Consulta compleja:", JSON.stringify(complexQueryExample, null, 2));
console.log("6. Análisis de datos:", JSON.stringify(dataAnalysisExample, null, 2));
console.log("7. Consulta de auditoría:", JSON.stringify(auditExample, null, 2));
console.log("8. Análisis de rendimiento:", JSON.stringify(performanceExample, null, 2));
