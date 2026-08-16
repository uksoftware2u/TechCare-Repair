import sql from "mssql";

const connectionString = process.env.SQLSERVER_CONNECTION_STRING;
const config = connectionString || {
  server: process.env.SQLSERVER_HOST || "127.0.0.1",
  port: Number(process.env.SQLSERVER_PORT || 14330),
  database: process.env.SQLSERVER_DATABASE || "TechCareRepair",
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  options: {
    encrypt: process.env.SQLSERVER_ENCRYPT === "true",
    trustServerCertificate: process.env.SQLSERVER_TRUST_CERTIFICATE !== "false",
  },
};
let poolPromise;

export function getPool() {
  if (!connectionString && (!config.user || !config.password)) throw new Error("SQL Server credentials are not configured.");
  if (!poolPromise) poolPromise = sql.connect(config);
  return poolPromise;
}

export async function closePool() {
  if (!poolPromise) return;
  const active = await poolPromise;
  poolPromise = undefined;
  await active.close();
}

export function getDatabasePool(database) {
  if (connectionString) throw new Error("Database-specific connection is unavailable when SQLSERVER_CONNECTION_STRING is used.");
  if (!config.user || !config.password) throw new Error("SQL Server credentials are not configured.");
  return new sql.ConnectionPool({...config,database}).connect();
}

export { sql };
