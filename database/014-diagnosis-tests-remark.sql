IF COL_LENGTH('dbo.Diagnosis','TestsPerformedRemark') IS NULL
  ALTER TABLE dbo.Diagnosis ADD TestsPerformedRemark nvarchar(max) NULL;
GO
