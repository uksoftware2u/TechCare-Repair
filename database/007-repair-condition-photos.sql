IF COL_LENGTH('dbo.Repairs','PhotosJson') IS NULL
  ALTER TABLE dbo.Repairs ADD PhotosJson nvarchar(max) NULL;
GO
