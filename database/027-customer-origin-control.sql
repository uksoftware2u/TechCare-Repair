USE TechCareRepair;
GO

IF COL_LENGTH('dbo.Customers','CustomerOrigin') IS NULL
  ALTER TABLE dbo.Customers ADD CustomerOrigin nvarchar(20) NOT NULL CONSTRAINT DF_Customers_CustomerOrigin DEFAULT N'Local';
GO

UPDATE dbo.Customers
SET CustomerOrigin=CASE WHEN DebtorAccount LIKE N'300-%' THEN N'AutoCount' ELSE N'Local' END;

UPDATE dbo.Customers
SET ControlAccount=CASE WHEN CustomerOrigin=N'AutoCount' THEN N'300-0000' ELSE N'380-0000' END;
GO
