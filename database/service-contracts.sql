USE TechCareRepair;

IF OBJECT_ID(N'dbo.ServiceContracts',N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ServiceContracts (
    ContractNo nvarchar(30) NOT NULL PRIMARY KEY,
    CustomerId nvarchar(30) NOT NULL,
    ContractTitle nvarchar(250) NOT NULL,
    SiteAddress nvarchar(1000) NULL,
    StartDate date NOT NULL,
    EndDate date NOT NULL,
    BillingCycle nvarchar(50) NOT NULL,
    AccountManager nvarchar(150) NULL,
    ContractStatus nvarchar(50) NOT NULL CONSTRAINT DF_ServiceContracts_Status DEFAULT N'Draft',
    SignedStatus nvarchar(50) NOT NULL CONSTRAINT DF_ServiceContracts_SignedStatus DEFAULT N'Unsigned',
    SignedBy nvarchar(200) NULL,
    SignerPosition nvarchar(150) NULL,
    SignedAt datetime2 NULL,
    SignatureMethod nvarchar(80) NULL,
    ContractValue decimal(18,2) NOT NULL CONSTRAINT DF_ServiceContracts_Value DEFAULT 0,
    ItemsJson nvarchar(max) NOT NULL CONSTRAINT DF_ServiceContracts_Items DEFAULT N'[]',
    Terms nvarchar(max) NULL,
    AutoRenew bit NOT NULL CONSTRAINT DF_ServiceContracts_AutoRenew DEFAULT 0,
    RenewalNoticeDays int NOT NULL CONSTRAINT DF_ServiceContracts_Notice DEFAULT 30,
    PreviousContractNo nvarchar(30) NULL,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_ServiceContracts_CreatedAt DEFAULT sysdatetime(),
    UpdatedAt datetime2 NOT NULL CONSTRAINT DF_ServiceContracts_UpdatedAt DEFAULT sysdatetime(),
    CONSTRAINT FK_ServiceContracts_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(CustomerId),
    CONSTRAINT FK_ServiceContracts_Previous FOREIGN KEY (PreviousContractNo) REFERENCES dbo.ServiceContracts(ContractNo),
    CONSTRAINT CK_ServiceContracts_Dates CHECK (EndDate >= StartDate),
    CONSTRAINT CK_ServiceContracts_ItemsJson CHECK (ISJSON(ItemsJson)=1)
  );
  CREATE INDEX IX_ServiceContracts_Status ON dbo.ServiceContracts(ContractStatus,EndDate);
  CREATE INDEX IX_ServiceContracts_Customer ON dbo.ServiceContracts(CustomerId);
END;
