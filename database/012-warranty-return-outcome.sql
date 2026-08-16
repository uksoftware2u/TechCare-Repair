IF COL_LENGTH('dbo.WarrantyClaims','ReturnOutcome') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD ReturnOutcome nvarchar(60) NULL;
GO

IF COL_LENGTH('dbo.WarrantyClaims','ReplacementDetails') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD ReplacementDetails nvarchar(max) NULL;
GO

IF COL_LENGTH('dbo.WarrantyClaims','RejectReason') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD RejectReason nvarchar(max) NULL;
GO

IF COL_LENGTH('dbo.WarrantyClaims','AdditionalCharge') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD AdditionalCharge decimal(18,2) NULL;
GO
