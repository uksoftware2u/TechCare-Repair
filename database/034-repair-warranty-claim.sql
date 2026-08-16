USE TechCareRepair;
IF COL_LENGTH('dbo.Repairs','IsWarrantyClaim') IS NULL
  ALTER TABLE dbo.Repairs ADD IsWarrantyClaim bit NOT NULL CONSTRAINT DF_Repairs_IsWarrantyClaim DEFAULT 0 WITH VALUES;
GO
