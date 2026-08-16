USE TechCareRepair;

IF COL_LENGTH(N'dbo.RepairWorkflow',N'TechnicianGuideJson') IS NULL
  ALTER TABLE dbo.RepairWorkflow ADD TechnicianGuideJson nvarchar(max) NULL;
GO
