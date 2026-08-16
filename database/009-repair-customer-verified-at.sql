IF COL_LENGTH('dbo.Repairs','CustomerVerifiedAt') IS NULL
  ALTER TABLE dbo.Repairs ADD CustomerVerifiedAt datetime2 NULL;
GO
