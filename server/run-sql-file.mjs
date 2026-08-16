import { readFile } from "node:fs/promises";
import { getPool } from "./db.mjs";

const file=process.argv[2];
if(!file) throw new Error("SQL file path is required.");
try {
  const source=await readFile(file,"utf8");
  const batches=source.split(/^\s*GO\s*$/gim).map((batch)=>batch.trim()).filter(Boolean);
  const pool=await getPool();
  for(const batch of batches) await pool.request().batch(batch);
  console.log(`Executed ${file} (${batches.length} batch${batches.length===1?"":"es"}).`);
  await pool.close();
} catch(error) {
  console.error(`SQL execution failed: ${error.message}`);
  process.exitCode=1;
}
