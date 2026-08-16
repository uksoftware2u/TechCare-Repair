USE TechCareRepair;
GO
IF OBJECT_ID('dbo.AutoCountCustomerOptions','U') IS NULL
BEGIN
  CREATE TABLE dbo.AutoCountCustomerOptions(
    OptionType nvarchar(30) NOT NULL,
    OptionCode nvarchar(120) NOT NULL,
    Description nvarchar(250) NULL,
    IsActive bit NOT NULL CONSTRAINT DF_AutoCountCustomerOptions_IsActive DEFAULT 1,
    LastSyncedAt datetime2 NOT NULL CONSTRAINT DF_AutoCountCustomerOptions_LastSyncedAt DEFAULT SYSDATETIME(),
    CONSTRAINT PK_AutoCountCustomerOptions PRIMARY KEY(OptionType,OptionCode)
  );
END;
GO
