import { getPool } from "./db.mjs";

try {
  const pool=await getPool();
  const files=await pool.request().query("SELECT name,type_desc,physical_name,size*8/1024 AS size_mb FROM sys.database_files");
  const counts=await pool.request().query("SELECT (SELECT COUNT(*) FROM dbo.Customers) AS Customers,(SELECT COUNT(*) FROM dbo.Repairs) AS Repairs,(SELECT COUNT(*) FROM dbo.Suppliers) AS Suppliers,(SELECT COUNT(*) FROM dbo.WarrantyClaims) AS WarrantyClaims");
  console.log(JSON.stringify({files:files.recordset,counts:counts.recordset[0]},null,2));
  await pool.close();
} catch(error) {
  console.error(error.message);
  process.exitCode=1;
}
