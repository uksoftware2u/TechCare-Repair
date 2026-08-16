USE TechCareRepair;
GO

IF COL_LENGTH('dbo.Users','CommissionType') IS NULL
  ALTER TABLE dbo.Users ADD CommissionType nvarchar(30) NOT NULL CONSTRAINT DF_Users_CommissionType DEFAULT N'None';
GO

IF COL_LENGTH('dbo.Users','CommissionValue') IS NULL
  ALTER TABLE dbo.Users ADD CommissionValue decimal(18,4) NOT NULL CONSTRAINT DF_Users_CommissionValue DEFAULT 0;
GO

