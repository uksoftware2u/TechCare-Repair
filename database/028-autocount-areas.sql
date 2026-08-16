USE TechCareRepair;
GO

IF OBJECT_ID('dbo.AutoCountAreas','U') IS NULL
BEGIN
  CREATE TABLE dbo.AutoCountAreas(
    AreaCode nvarchar(120) NOT NULL PRIMARY KEY,
    Description nvarchar(200) NULL,
    Description2 nvarchar(200) NULL,
    AutoCountKey int NULL,
    AutoCountGuid nvarchar(80) NULL,
    LastSyncedAt datetime2 NOT NULL CONSTRAINT DF_AutoCountAreas_LastSyncedAt DEFAULT SYSDATETIME()
  );
END;
GO
