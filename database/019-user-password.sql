USE TechCareRepair;
GO

IF COL_LENGTH('dbo.Users','PasswordHash') IS NULL
  ALTER TABLE dbo.Users ADD PasswordHash nvarchar(128) NULL;
GO

IF COL_LENGTH('dbo.Users','PasswordSalt') IS NULL
  ALTER TABLE dbo.Users ADD PasswordSalt nvarchar(64) NULL;
GO

