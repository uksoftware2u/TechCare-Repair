USE TechCareRepair;
GO

IF COL_LENGTH('dbo.Customers','CompanyName2') IS NULL ALTER TABLE dbo.Customers ADD CompanyName2 nvarchar(200) NULL;
IF COL_LENGTH('dbo.Customers','ControlAccount') IS NULL ALTER TABLE dbo.Customers ADD ControlAccount nvarchar(30) NULL;
IF COL_LENGTH('dbo.Customers','DebtorType') IS NULL ALTER TABLE dbo.Customers ADD DebtorType nvarchar(40) NULL;
IF COL_LENGTH('dbo.Customers','TaxEntityId') IS NULL ALTER TABLE dbo.Customers ADD TaxEntityId int NULL;
IF COL_LENGTH('dbo.Customers','IsGroupCompany') IS NULL ALTER TABLE dbo.Customers ADD IsGroupCompany bit NOT NULL CONSTRAINT DF_Customers_IsGroupCompany DEFAULT 0;
IF COL_LENGTH('dbo.Customers','IsActive') IS NULL ALTER TABLE dbo.Customers ADD IsActive bit NOT NULL CONSTRAINT DF_Customers_IsActive DEFAULT 1;
IF COL_LENGTH('dbo.Customers','IsCashSaleDebtor') IS NULL ALTER TABLE dbo.Customers ADD IsCashSaleDebtor bit NOT NULL CONSTRAINT DF_Customers_IsCashSaleDebtor DEFAULT 0;
IF COL_LENGTH('dbo.Customers','BillingAddress1') IS NULL ALTER TABLE dbo.Customers ADD BillingAddress1 nvarchar(250) NULL;
IF COL_LENGTH('dbo.Customers','BillingAddress2') IS NULL ALTER TABLE dbo.Customers ADD BillingAddress2 nvarchar(250) NULL;
IF COL_LENGTH('dbo.Customers','BillingAddress3') IS NULL ALTER TABLE dbo.Customers ADD BillingAddress3 nvarchar(250) NULL;
IF COL_LENGTH('dbo.Customers','BillingAddress4') IS NULL ALTER TABLE dbo.Customers ADD BillingAddress4 nvarchar(250) NULL;
IF COL_LENGTH('dbo.Customers','DeliveryAddress1') IS NULL ALTER TABLE dbo.Customers ADD DeliveryAddress1 nvarchar(250) NULL;
IF COL_LENGTH('dbo.Customers','DeliveryAddress2') IS NULL ALTER TABLE dbo.Customers ADD DeliveryAddress2 nvarchar(250) NULL;
IF COL_LENGTH('dbo.Customers','DeliveryAddress3') IS NULL ALTER TABLE dbo.Customers ADD DeliveryAddress3 nvarchar(250) NULL;
IF COL_LENGTH('dbo.Customers','DeliveryAddress4') IS NULL ALTER TABLE dbo.Customers ADD DeliveryAddress4 nvarchar(250) NULL;
IF COL_LENGTH('dbo.Customers','Phone2') IS NULL ALTER TABLE dbo.Customers ADD Phone2 nvarchar(80) NULL;
IF COL_LENGTH('dbo.Customers','Fax2') IS NULL ALTER TABLE dbo.Customers ADD Fax2 nvarchar(80) NULL;
IF COL_LENGTH('dbo.Customers','CurrencyCode') IS NULL ALTER TABLE dbo.Customers ADD CurrencyCode nvarchar(10) NULL;
IF COL_LENGTH('dbo.Customers','DisplayTerm') IS NULL ALTER TABLE dbo.Customers ADD DisplayTerm nvarchar(50) NULL;

GO

USE TechCareRepair;

UPDATE dbo.Customers
SET BillingAddress1=COALESCE(BillingAddress1,BillingAddress),
    DeliveryAddress1=COALESCE(DeliveryAddress1,DeliveryAddress),
    ControlAccount=COALESCE(NULLIF(ControlAccount,N''),N'300-0000'),
    CurrencyCode=COALESCE(NULLIF(CurrencyCode,N''),N'MYR'),
    DisplayTerm=COALESCE(NULLIF(DisplayTerm,N''),N'C.O.D.');
