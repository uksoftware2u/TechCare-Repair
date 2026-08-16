import { readFile } from "node:fs/promises";
import { getPool } from "./db.mjs";

try {
  const schema = await readFile(new URL("../database/schema.sql",import.meta.url),"utf8");
  const batches = schema.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
  const pool = await getPool();
  for (let index=0; index<batches.length; index += 1) {
    const batch = index === 0 ? batches[index] : `USE TechCareRepair;\n${batches[index]}`;
    await pool.request().batch(batch);
  }
  const result = await pool.request().query("SELECT name FROM sys.databases WHERE name = N'TechCareRepair'");
  console.log(result.recordset.length ? "TechCareRepair database created successfully." : "Database creation could not be verified.");
  await pool.close();
} catch (error) {
  console.error(`SQL Server migration failed: ${error.message}`);
  process.exitCode = 1;
}
