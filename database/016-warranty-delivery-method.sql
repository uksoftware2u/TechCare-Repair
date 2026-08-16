SET XACT_ABORT ON;
GO

IF COL_LENGTH('dbo.WarrantyClaims','DeliveryMethod') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD DeliveryMethod nvarchar(60) NULL;
GO

IF COL_LENGTH('dbo.WarrantyClaims','DeliveryContact') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD DeliveryContact nvarchar(200) NULL;
GO

IF COL_LENGTH('dbo.WarrantyClaims','DeliveryReference') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD DeliveryReference nvarchar(200) NULL;
GO
