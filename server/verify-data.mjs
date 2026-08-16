import { getPool } from "./db.mjs";

const tables=["CompanyProfile","Customers","Repairs","Diagnosis","DiagnosisRatings","Suppliers","WarrantyClaims","Users","AppSettings","AccessRights","AuditTrail","AccountingSyncRecords","UserPreferences","RepairDrafts","DebtorSequences"];
try {
  const pool=await getPool();
  const counts={};
  for(const table of tables){
    const result=await pool.request().query(`SELECT COUNT_BIG(*) AS count FROM dbo.${table}`);
    counts[table]=Number(result.recordset[0].count);
  }
  const integrity=await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.Repairs r LEFT JOIN dbo.Customers c ON c.CustomerId=r.CustomerId WHERE c.CustomerId IS NULL) OrphanRepairs,
      (SELECT COUNT(*) FROM dbo.Diagnosis d LEFT JOIN dbo.Repairs r ON r.RepairNo=d.RepairNo WHERE r.RepairNo IS NULL) OrphanDiagnosis,
      (SELECT COUNT(*) FROM dbo.WarrantyClaims w LEFT JOIN dbo.Repairs r ON r.RepairNo=w.RepairNo WHERE r.RepairNo IS NULL) OrphanWarranty,
      (SELECT COUNT(*) FROM dbo.Customers WHERE DebtorAccount IS NOT NULL AND DebtorAccount NOT LIKE '380-[A-Z][0-9][0-9][0-9]') InvalidDebtorAccounts
  `);
  console.log(JSON.stringify({database:"TechCareRepair",counts,integrity:integrity.recordset[0]},null,2));
  await pool.close();
} catch(error) {
  console.error(`Data verification failed: ${error.message}`);
  process.exitCode=1;
}
