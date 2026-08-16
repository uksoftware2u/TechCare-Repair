IF COL_LENGTH('dbo.Diagnosis','TechnicalCheckedBy') IS NULL
  ALTER TABLE dbo.Diagnosis ADD TechnicalCheckedBy nvarchar(200) NULL;
GO

IF COL_LENGTH('dbo.Diagnosis','TechnicalCheckedAt') IS NULL
  ALTER TABLE dbo.Diagnosis ADD TechnicalCheckedAt datetime2 NULL;
GO
