import { readFile } from "node:fs/promises";
import { getPool } from "./db.mjs";

try {
  const script=await readFile(new URL("../database/service-contracts.sql",import.meta.url),"utf8");
  const pool=await getPool();
  await pool.request().batch(script);
  console.log("Service Contracts schema ready.");
  await pool.close();
} catch(error) {
  console.error(`Service Contracts migration failed: ${error.message}`);
  process.exitCode=1;
}
