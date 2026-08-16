import { readFile } from "node:fs/promises";
import { getPool } from "./db.mjs";

try {
  const seed = await readFile(new URL("../database/seed.sql",import.meta.url),"utf8");
  const pool = await getPool();
  await pool.request().batch(seed);
  const counts = await pool.request().query("SELECT (SELECT COUNT(*) FROM dbo.Customers) AS Customers, (SELECT COUNT(*) FROM dbo.Repairs) AS Repairs, (SELECT COUNT(*) FROM dbo.Suppliers) AS Suppliers, (SELECT COUNT(*) FROM dbo.WarrantyClaims) AS WarrantyClaims");
  console.log(JSON.stringify(counts.recordset[0],null,2));
  await pool.close();
} catch (error) {
  console.error(`SQL Server seed failed: ${error.message}`);
  process.exitCode = 1;
}
