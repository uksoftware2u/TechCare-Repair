IF COL_LENGTH('dbo.WarrantyClaims','SupplierReminderCount') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD SupplierReminderCount int NOT NULL CONSTRAINT DF_Warranty_ReminderCount DEFAULT 0;
GO

IF COL_LENGTH('dbo.WarrantyClaims','LastSupplierReminderAt') IS NULL
  ALTER TABLE dbo.WarrantyClaims ADD LastSupplierReminderAt datetime2 NULL;
GO

IF OBJECT_ID('dbo.WarrantySupplierReminders','U') IS NULL
BEGIN
  CREATE TABLE dbo.WarrantySupplierReminders (
    ReminderId bigint IDENTITY(1,1) PRIMARY KEY,
    WarrantyId nvarchar(30) NOT NULL,
    RecipientEmail nvarchar(200) NOT NULL,
    EmailSubject nvarchar(500) NOT NULL,
    EmailBody nvarchar(max) NULL,
    SentAt datetime2 NOT NULL CONSTRAINT DF_WarrantySupplierReminders_SentAt DEFAULT sysdatetime(),
    CONSTRAINT FK_WarrantySupplierReminders_Warranty FOREIGN KEY (WarrantyId) REFERENCES dbo.WarrantyClaims(WarrantyId)
  );
END
GO

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_WarrantySupplierReminders_Warranty' AND object_id=OBJECT_ID('dbo.WarrantySupplierReminders'))
  CREATE INDEX IX_WarrantySupplierReminders_Warranty ON dbo.WarrantySupplierReminders(WarrantyId,SentAt DESC);
GO
