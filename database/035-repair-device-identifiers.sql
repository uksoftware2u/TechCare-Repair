USE TechCareRepair;

IF COL_LENGTH('dbo.Repairs','CustomerAssetTag') IS NULL
  ALTER TABLE dbo.Repairs ADD CustomerAssetTag nvarchar(200) NULL;

IF COL_LENGTH('dbo.Repairs','InternalDeviceId') IS NULL
  ALTER TABLE dbo.Repairs ADD InternalDeviceId nvarchar(50) NULL;

IF COL_LENGTH('dbo.Repairs','IdentifierType') IS NULL
  ALTER TABLE dbo.Repairs ADD IdentifierType nvarchar(60) NULL;

IF COL_LENGTH('dbo.Repairs','IdentifierSource') IS NULL
  ALTER TABLE dbo.Repairs ADD IdentifierSource nvarchar(30) NULL;

IF COL_LENGTH('dbo.Repairs','SerialUnavailableReason') IS NULL
  ALTER TABLE dbo.Repairs ADD SerialUnavailableReason nvarchar(200) NULL;
GO

UPDATE dbo.Repairs
SET InternalDeviceId = CONCAT(N'DEV-', REPLACE(RepairNo,N'SR-',N''))
WHERE NULLIF(InternalDeviceId,N'') IS NULL;

UPDATE dbo.Repairs
SET IdentifierType = CASE
    WHEN NULLIF(SerialNumber,N'') IS NULL THEN N'Serial Label Missing'
    ELSE N'Manufacturer Serial'
  END,
  IdentifierSource = CASE
    WHEN NULLIF(SerialNumber,N'') IS NULL THEN N'Generated'
    ELSE N'Existing Record'
  END,
  SerialUnavailableReason = CASE
    WHEN NULLIF(SerialNumber,N'') IS NULL THEN N'Existing record has no serial number'
    ELSE SerialUnavailableReason
  END
WHERE IdentifierType IS NULL OR IdentifierSource IS NULL;

ALTER TABLE dbo.Repairs ALTER COLUMN InternalDeviceId nvarchar(50) NOT NULL;
ALTER TABLE dbo.Repairs ALTER COLUMN IdentifierType nvarchar(60) NOT NULL;
ALTER TABLE dbo.Repairs ALTER COLUMN IdentifierSource nvarchar(30) NOT NULL;

IF NOT EXISTS (
  SELECT 1 FROM sys.default_constraints dc
  JOIN sys.columns c ON c.default_object_id=dc.object_id
  WHERE dc.parent_object_id=OBJECT_ID(N'dbo.Repairs') AND c.name=N'InternalDeviceId'
)
  ALTER TABLE dbo.Repairs ADD CONSTRAINT DF_Repairs_InternalDeviceId DEFAULT CONCAT(N'DEV-',CONVERT(nvarchar(36),NEWID())) FOR InternalDeviceId;

IF NOT EXISTS (
  SELECT 1 FROM sys.default_constraints dc
  JOIN sys.columns c ON c.default_object_id=dc.object_id
  WHERE dc.parent_object_id=OBJECT_ID(N'dbo.Repairs') AND c.name=N'IdentifierType'
)
  ALTER TABLE dbo.Repairs ADD CONSTRAINT DF_Repairs_IdentifierType DEFAULT N'Manufacturer Serial' FOR IdentifierType;

IF NOT EXISTS (
  SELECT 1 FROM sys.default_constraints dc
  JOIN sys.columns c ON c.default_object_id=dc.object_id
  WHERE dc.parent_object_id=OBJECT_ID(N'dbo.Repairs') AND c.name=N'IdentifierSource'
)
  ALTER TABLE dbo.Repairs ADD CONSTRAINT DF_Repairs_IdentifierSource DEFAULT N'Manual' FOR IdentifierSource;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.Repairs')
    AND name = N'UX_Repairs_InternalDeviceId'
)
  CREATE UNIQUE INDEX UX_Repairs_InternalDeviceId ON dbo.Repairs(InternalDeviceId);
GO
