import { readFile } from "node:fs/promises";
import { getPool } from "./db.mjs";

try {
  const sql=await readFile(new URL("../database/provision-app-login.sql",import.meta.url),"utf8");
  const pool=await getPool();
  await pool.request().batch(sql);
  console.log("Restricted SQL login techcare_app provisioned.");
  await pool.close();
} catch(error) {
  console.error(`App login provisioning failed: ${error.message}`);
  process.exitCode=1;
}
