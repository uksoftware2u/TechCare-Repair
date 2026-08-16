USE TechCareRepair;
GO

IF COL_LENGTH('dbo.Customers','AutoCountLinked') IS NULL
  ALTER TABLE dbo.Customers ADD AutoCountLinked bit NOT NULL CONSTRAINT DF_Customers_AutoCountLinked DEFAULT 0;
GO

UPDATE c
SET AutoCountLinked=1
FROM dbo.Customers c
WHERE c.AutoCountSynced=1
   OR c.LastSyncAt IS NOT NULL
   OR c.DebtorAccount LIKE N'300-%'
   OR EXISTS(
      SELECT 1 FROM dbo.AccountingSyncRecords s
      WHERE s.RecordType=N'Customer'
        AND s.SourceReference=c.CustomerId
        AND (s.SyncStatus=N'Synced' OR NULLIF(s.AutoCountReference,N'') IS NOT NULL)
   );
GO
