IF OBJECT_ID('dbo.StockItems','U') IS NULL
BEGIN
  CREATE TABLE dbo.StockItems (
    ItemCode nvarchar(80) NOT NULL PRIMARY KEY,
    ItemDescription nvarchar(300) NOT NULL,
    Description2 nvarchar(300) NULL,
    Uom nvarchar(30) NOT NULL CONSTRAINT DF_StockItems_Uom DEFAULT N'UNIT',
    UomRate decimal(18,4) NOT NULL CONSTRAINT DF_StockItems_UomRate DEFAULT 1,
    ItemGroup nvarchar(80) NULL,
    SellingPrice decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_Price DEFAULT 0,
    Price1 decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_Price1 DEFAULT 0,
    Price2 decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_Price2 DEFAULT 0,
    MinimumPrice decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_MinPrice DEFAULT 0,
    ItemType nvarchar(120) NOT NULL CONSTRAINT DF_StockItems_Type DEFAULT N'Stock Item',
    Active bit NOT NULL CONSTRAINT DF_StockItems_Active DEFAULT 1,
    AutoCountLinked bit NOT NULL CONSTRAINT DF_StockItems_AutoCountLinked DEFAULT 0,
    AutoCountSynced bit NOT NULL CONSTRAINT DF_StockItems_AutoCountSynced DEFAULT 0,
    AutoCountSyncEnabled bit NOT NULL CONSTRAINT DF_StockItems_AutoCountSyncEnabled DEFAULT 1,
    LastSyncAt datetime2 NULL,
    UpdatedAt datetime2 NOT NULL CONSTRAINT DF_StockItems_UpdatedAt DEFAULT sysdatetime(),
    CONSTRAINT CK_StockItems_Prices CHECK (SellingPrice >= 0 AND MinimumPrice >= 0 AND MinimumPrice <= SellingPrice)
  );
END;
GO
;WITH Roles AS (SELECT value AccessRole FROM STRING_SPLIT(N'Administrator|Manager|Supervisor|Counter Staff|Technician',N'|')),
Actions AS (SELECT value ActionName FROM STRING_SPLIT(N'View|Create|Edit|Delete|Approve|Print|Sync',N'|'))
INSERT dbo.AccessRights(AccessRole,ModuleName,ActionName,IsAllowed)
SELECT r.AccessRole,N'Stock Items',a.ActionName,CASE WHEN r.AccessRole=N'Administrator' THEN 1 WHEN r.AccessRole IN(N'Manager',N'Supervisor') AND a.ActionName<>N'Delete' THEN 1 WHEN r.AccessRole IN(N'Counter Staff',N'Technician') AND a.ActionName IN(N'View',N'Create',N'Edit',N'Print') THEN 1 ELSE 0 END
FROM Roles r CROSS JOIN Actions a
WHERE NOT EXISTS(SELECT 1 FROM dbo.AccessRights x WHERE x.AccessRole=r.AccessRole AND x.ModuleName=N'Stock Items' AND x.ActionName=a.ActionName);
GO
