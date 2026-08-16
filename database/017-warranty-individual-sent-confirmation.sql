SET XACT_ABORT ON;
GO

IF COL_LENGTH('dbo.WarrantyClaims','DeliveryPhotosJson') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD DeliveryPhotosJson nvarchar(max) NULL;
GO

IF COL_LENGTH('dbo.WarrantyClaims','SentConfirmationPrintCount') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD SentConfirmationPrintCount int NOT NULL CONSTRAINT DF_Warranty_SentPrintCount DEFAULT 0;
GO

IF COL_LENGTH('dbo.WarrantyClaims','SentConfirmationLastPrintedAt') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD SentConfirmationLastPrintedAt datetime2 NULL;
GO

IF COL_LENGTH('dbo.WarrantyClaims','SentConfirmationEmailCount') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD SentConfirmationEmailCount int NOT NULL CONSTRAINT DF_Warranty_SentEmailCount DEFAULT 0;
GO

IF COL_LENGTH('dbo.WarrantyClaims','SentConfirmationLastEmailedAt') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD SentConfirmationLastEmailedAt datetime2 NULL;
GO

IF COL_LENGTH('dbo.WarrantyClaims','SentConfirmationLastEmailedTo') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD SentConfirmationLastEmailedTo nvarchar(200) NULL;
GO
