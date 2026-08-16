IF OBJECT_ID(N'dbo.AutoCountStockOptions',N'U') IS NULL
BEGIN
  CREATE TABLE dbo.AutoCountStockOptions(
    OptionType nvarchar(30) NOT NULL,
    OptionCode nvarchar(120) NOT NULL,
    Description nvarchar(250) NULL,
    IsActive bit NOT NULL CONSTRAINT DF_AutoCountStockOptions_Active DEFAULT 1,
    LastSyncedAt datetime2 NOT NULL CONSTRAINT DF_AutoCountStockOptions_Synced DEFAULT SYSDATETIME(),
    CONSTRAINT PK_AutoCountStockOptions PRIMARY KEY(OptionType,OptionCode)
  );
END;
GO
IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE name=N'CK_StockItems_Type' AND parent_object_id=OBJECT_ID(N'dbo.StockItems')) ALTER TABLE dbo.StockItems DROP CONSTRAINT CK_StockItems_Type;
GO
ALTER TABLE dbo.StockItems ALTER COLUMN ItemType nvarchar(120) NOT NULL;
GO
