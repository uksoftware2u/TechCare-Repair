IF COL_LENGTH('dbo.Repairs','CustomerVerificationMethod') IS NULL
  ALTER TABLE dbo.Repairs ADD CustomerVerificationMethod nvarchar(40) NULL;
IF COL_LENGTH('dbo.Repairs','CustomerVerificationValue') IS NULL
  ALTER TABLE dbo.Repairs ADD CustomerVerificationValue nvarchar(200) NULL;
IF COL_LENGTH('dbo.Repairs','CustomerSignatureDataUrl') IS NULL
  ALTER TABLE dbo.Repairs ADD CustomerSignatureDataUrl nvarchar(max) NULL;
GO
