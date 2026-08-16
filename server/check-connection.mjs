import { getPool } from "./db.mjs";

try {
  const pool = await getPool();
  const result = await pool.request().query("SELECT DB_NAME() AS DatabaseName, @@SERVERNAME AS ServerName, SYSDATETIME() AS ServerTime");
  console.log(JSON.stringify(result.recordset[0], null, 2));
  await pool.close();
} catch (error) {
  console.error(`SQL Server connection failed: ${error.message}`);
  process.exitCode = 1;
}
