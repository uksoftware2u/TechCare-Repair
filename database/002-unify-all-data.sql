USE TechCareRepair;

IF COL_LENGTH('dbo.CompanyProfile','Tin') IS NULL ALTER TABLE dbo.CompanyProfile ADD Tin nvarchar(100) NULL;
IF COL_LENGTH('dbo.CompanyProfile','SstRegistrationNo') IS NULL ALTER TABLE dbo.CompanyProfile ADD SstRegistrationNo nvarchar(100) NULL;
IF COL_LENGTH('dbo.CompanyProfile','Website') IS NULL ALTER TABLE dbo.CompanyProfile ADD Website nvarchar(250) NULL;
IF COL_LENGTH('dbo.CompanyProfile','Currency') IS NULL ALTER TABLE dbo.CompanyProfile ADD Currency nvarchar(10) NULL;
IF COL_LENGTH('dbo.CompanyProfile','TimeZone') IS NULL ALTER TABLE dbo.CompanyProfile ADD TimeZone nvarchar(100) NULL;

IF COL_LENGTH('dbo.Suppliers','Category') IS NULL ALTER TABLE dbo.Suppliers ADD Category nvarchar(100) NULL;
IF COL_LENGTH('dbo.Suppliers','WarrantyTerms') IS NULL ALTER TABLE dbo.Suppliers ADD WarrantyTerms nvarchar(150) NULL;
IF COL_LENGTH('dbo.Suppliers','OpenClaims') IS NULL ALTER TABLE dbo.Suppliers ADD OpenClaims int NOT NULL CONSTRAINT DF_Suppliers_OpenClaims DEFAULT 0;
IF COL_LENGTH('dbo.Suppliers','SupplierStatus') IS NULL ALTER TABLE dbo.Suppliers ADD SupplierStatus nvarchar(40) NOT NULL CONSTRAINT DF_Suppliers_Status DEFAULT N'Active';

IF COL_LENGTH('dbo.Repairs','PurchaseDate') IS NULL ALTER TABLE dbo.Repairs ADD PurchaseDate date NULL;
IF COL_LENGTH('dbo.Repairs','WarrantyStatus') IS NULL ALTER TABLE dbo.Repairs ADD WarrantyStatus nvarchar(50) NULL;
IF COL_LENGTH('dbo.Repairs','DevicePassword') IS NULL ALTER TABLE dbo.Repairs ADD DevicePassword nvarchar(250) NULL;
IF COL_LENGTH('dbo.Repairs','ConditionsJson') IS NULL ALTER TABLE dbo.Repairs ADD ConditionsJson nvarchar(max) NULL;
IF COL_LENGTH('dbo.Repairs','AccessoriesJson') IS NULL ALTER TABLE dbo.Repairs ADD AccessoriesJson nvarchar(max) NULL;
IF COL_LENGTH('dbo.Repairs','ReceiptDelivery') IS NULL ALTER TABLE dbo.Repairs ADD ReceiptDelivery nvarchar(30) NULL;
IF COL_LENGTH('dbo.Repairs','AutoCountSync') IS NULL ALTER TABLE dbo.Repairs ADD AutoCountSync bit NOT NULL CONSTRAINT DF_Repairs_AutoCountSync DEFAULT 0;

IF OBJECT_ID(N'dbo.Users',N'U') IS NULL
CREATE TABLE dbo.Users(
  UserId nvarchar(30) NOT NULL PRIMARY KEY, FullName nvarchar(200) NOT NULL, UserName nvarchar(100) NOT NULL UNIQUE,
  Email nvarchar(200) NOT NULL, AccessRole nvarchar(80) NOT NULL, Branch nvarchar(150) NULL,
  LastLoginAt datetime2 NULL, UserStatus nvarchar(30) NOT NULL, PhotoDataUrl nvarchar(max) NULL,
  PasswordHash nvarchar(128) NULL, PasswordSalt nvarchar(64) NULL,
  CommissionType nvarchar(30) NOT NULL CONSTRAINT DF_Users_CommissionType DEFAULT N'None',
  CommissionValue decimal(18,4) NOT NULL CONSTRAINT DF_Users_CommissionValue DEFAULT 0,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT sysdatetime()
);

IF OBJECT_ID(N'dbo.AppSettings',N'U') IS NULL
CREATE TABLE dbo.AppSettings(
  SettingKey nvarchar(150) NOT NULL PRIMARY KEY, JsonValue nvarchar(max) NOT NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_AppSettings_UpdatedAt DEFAULT sysdatetime()
);

IF OBJECT_ID(N'dbo.AccessRights',N'U') IS NULL
CREATE TABLE dbo.AccessRights(
  AccessRole nvarchar(80) NOT NULL, ModuleName nvarchar(100) NOT NULL, ActionName nvarchar(50) NOT NULL,
  IsAllowed bit NOT NULL, UpdatedAt datetime2 NOT NULL CONSTRAINT DF_AccessRights_UpdatedAt DEFAULT sysdatetime(),
  CONSTRAINT PK_AccessRights PRIMARY KEY(AccessRole,ModuleName,ActionName)
);

IF OBJECT_ID(N'dbo.AccountingSyncRecords',N'U') IS NULL
CREATE TABLE dbo.AccountingSyncRecords(
  SyncId nvarchar(30) NOT NULL PRIMARY KEY, RecordType nvarchar(60) NOT NULL, SourceReference nvarchar(100) NOT NULL,
  Description nvarchar(300) NULL, AutoCountTarget nvarchar(100) NULL, AutoCountReference nvarchar(100) NULL,
  LastSyncAt datetime2 NULL, SyncStatus nvarchar(30) NOT NULL, ResultMessage nvarchar(500) NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_AccountingSync_UpdatedAt DEFAULT sysdatetime()
);

IF OBJECT_ID(N'dbo.UserPreferences',N'U') IS NULL
CREATE TABLE dbo.UserPreferences(
  UserName nvarchar(100) NOT NULL, PreferenceKey nvarchar(180) NOT NULL, JsonValue nvarchar(max) NOT NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_UserPreferences_UpdatedAt DEFAULT sysdatetime(),
  CONSTRAINT PK_UserPreferences PRIMARY KEY(UserName,PreferenceKey)
);

IF OBJECT_ID(N'dbo.RepairDrafts',N'U') IS NULL
CREATE TABLE dbo.RepairDrafts(
  DraftId nvarchar(100) NOT NULL PRIMARY KEY, UserName nvarchar(100) NOT NULL, JsonValue nvarchar(max) NOT NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_RepairDrafts_UpdatedAt DEFAULT sysdatetime()
);

IF OBJECT_ID(N'dbo.DebtorSequences',N'U') IS NULL
CREATE TABLE dbo.DebtorSequences(
  PrefixLetter char(1) NOT NULL PRIMARY KEY, LastNumber int NOT NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_DebtorSequences_UpdatedAt DEFAULT sysdatetime()
);
