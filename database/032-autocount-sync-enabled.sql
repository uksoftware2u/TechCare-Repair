IF COL_LENGTH('dbo.Customers','AutoCountSyncEnabled') IS NULL
  ALTER TABLE dbo.Customers ADD AutoCountSyncEnabled bit NOT NULL CONSTRAINT DF_Customers_AutoCountSyncEnabled DEFAULT 1 WITH VALUES;
GO

IF COL_LENGTH('dbo.StockItems','AutoCountSyncEnabled') IS NULL
  ALTER TABLE dbo.StockItems ADD AutoCountSyncEnabled bit NOT NULL CONSTRAINT DF_StockItems_AutoCountSyncEnabled DEFAULT 1 WITH VALUES;
GO
