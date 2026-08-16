IF COL_LENGTH('dbo.StockItems','Description2') IS NULL ALTER TABLE dbo.StockItems ADD Description2 nvarchar(300) NULL;
IF COL_LENGTH('dbo.StockItems','Uom') IS NULL ALTER TABLE dbo.StockItems ADD Uom nvarchar(30) NOT NULL CONSTRAINT DF_StockItems_Uom DEFAULT N'UNIT';
IF COL_LENGTH('dbo.StockItems','UomRate') IS NULL ALTER TABLE dbo.StockItems ADD UomRate decimal(18,4) NOT NULL CONSTRAINT DF_StockItems_UomRate DEFAULT 1;
IF COL_LENGTH('dbo.StockItems','ItemGroup') IS NULL ALTER TABLE dbo.StockItems ADD ItemGroup nvarchar(80) NULL;
IF COL_LENGTH('dbo.StockItems','Price1') IS NULL ALTER TABLE dbo.StockItems ADD Price1 decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_Price1 DEFAULT 0;
IF COL_LENGTH('dbo.StockItems','Price2') IS NULL ALTER TABLE dbo.StockItems ADD Price2 decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_Price2 DEFAULT 0;
IF COL_LENGTH('dbo.StockItems','AutoCountLinked') IS NULL ALTER TABLE dbo.StockItems ADD AutoCountLinked bit NOT NULL CONSTRAINT DF_StockItems_AutoCountLinked DEFAULT 0;
IF COL_LENGTH('dbo.StockItems','AutoCountSynced') IS NULL ALTER TABLE dbo.StockItems ADD AutoCountSynced bit NOT NULL CONSTRAINT DF_StockItems_AutoCountSynced DEFAULT 0;
IF COL_LENGTH('dbo.StockItems','LastSyncAt') IS NULL ALTER TABLE dbo.StockItems ADD LastSyncAt datetime2 NULL;
GO
UPDATE dbo.StockItems SET Price1=SellingPrice WHERE Price1=0 AND SellingPrice<>0;
GO
