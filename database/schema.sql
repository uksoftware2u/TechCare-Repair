IF DB_ID(N'TechCareRepair') IS NULL
BEGIN
  CREATE DATABASE TechCareRepair;
END;
GO

USE TechCareRepair;
GO

CREATE TABLE dbo.CompanyProfile (
  Id int IDENTITY(1,1) PRIMARY KEY,
  CompanyName nvarchar(200) NOT NULL,
  BusinessRegistrationNo nvarchar(80) NULL,
  Address nvarchar(1000) NULL,
  Phone nvarchar(80) NULL,
  Email nvarchar(200) NULL,
  Logo varbinary(max) NULL,
  LogoMimeType nvarchar(100) NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_CompanyProfile_UpdatedAt DEFAULT sysdatetime()
);
GO

CREATE TABLE dbo.Customers (
  CustomerId nvarchar(30) NOT NULL PRIMARY KEY,
  DebtorAccount nvarchar(20) NULL,
  CompanyName nvarchar(200) NOT NULL,
  ContactName nvarchar(200) NOT NULL,
  Mobile nvarchar(80) NOT NULL,
  Email nvarchar(200) NULL,
  Tin nvarchar(100) NULL,
  CustomerType nvarchar(40) NOT NULL CONSTRAINT DF_Customers_Type DEFAULT N'RETAIL',
  Area nvarchar(120) NULL,
  Balance decimal(18,2) NOT NULL CONSTRAINT DF_Customers_Balance DEFAULT 0,
  AutoCountSynced bit NOT NULL CONSTRAINT DF_Customers_Synced DEFAULT 0,
  AutoCountSyncEnabled bit NOT NULL CONSTRAINT DF_Customers_AutoCountSyncEnabled DEFAULT 1,
  AutoCountLinked bit NOT NULL CONSTRAINT DF_Customers_AutoCountLinked DEFAULT 0,
  CustomerOrigin nvarchar(20) NOT NULL CONSTRAINT DF_Customers_CustomerOrigin DEFAULT N'Local',
  LastSyncAt datetime2 NULL,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_Customers_CreatedAt DEFAULT sysdatetime(),
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_Customers_UpdatedAt DEFAULT sysdatetime(),
  CONSTRAINT UQ_Customers_DebtorAccount UNIQUE (DebtorAccount)
);
GO

CREATE TABLE dbo.Repairs (
  RepairNo nvarchar(30) NOT NULL PRIMARY KEY,
  CustomerId nvarchar(30) NOT NULL,
  DeviceType nvarchar(80) NULL,
  Brand nvarchar(100) NULL,
  Model nvarchar(200) NULL,
  SerialNumber nvarchar(200) NULL,
  CustomerAssetTag nvarchar(200) NULL,
  InternalDeviceId nvarchar(50) NOT NULL CONSTRAINT DF_Repairs_InternalDeviceId DEFAULT CONCAT(N'DEV-',CONVERT(nvarchar(36),NEWID())),
  IdentifierType nvarchar(60) NOT NULL CONSTRAINT DF_Repairs_IdentifierType DEFAULT N'Manufacturer Serial',
  IdentifierSource nvarchar(30) NOT NULL CONSTRAINT DF_Repairs_IdentifierSource DEFAULT N'Manual',
  SerialUnavailableReason nvarchar(200) NULL,
  IsWarrantyClaim bit NOT NULL CONSTRAINT DF_Repairs_IsWarrantyClaim DEFAULT 0,
  IssueCategory nvarchar(120) NULL,
  IssueDescription nvarchar(max) NOT NULL,
  PhotosJson nvarchar(max) NULL,
  CustomerVerificationMethod nvarchar(40) NULL,
  CustomerVerificationValue nvarchar(200) NULL,
  CustomerSignatureDataUrl nvarchar(max) NULL,
  CustomerVerifiedAt datetime2 NULL,
  RepairStatus nvarchar(60) NOT NULL CONSTRAINT DF_Repairs_Status DEFAULT N'Received',
  CompletedAt datetime2 NULL,
  Technician nvarchar(150) NULL,
  ReceivedAt datetime2 NOT NULL CONSTRAINT DF_Repairs_ReceivedAt DEFAULT sysdatetime(),
  DueDate date NULL,
  DiagnosticFee decimal(18,2) NOT NULL CONSTRAINT DF_Repairs_Fee DEFAULT 0,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_Repairs_UpdatedAt DEFAULT sysdatetime(),
  CONSTRAINT FK_Repairs_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(CustomerId)
);
GO

CREATE UNIQUE INDEX UX_Repairs_InternalDeviceId ON dbo.Repairs(InternalDeviceId);
GO

CREATE TABLE dbo.Diagnosis (
  DiagnosisId bigint IDENTITY(1,1) PRIMARY KEY,
  RepairNo nvarchar(30) NOT NULL,
  CustomerSymptom nvarchar(max) NULL,
  CustomerExplanation nvarchar(max) NULL,
  RootCause nvarchar(max) NULL,
  InternalNote nvarchar(max) NULL,
  RecommendedRepair nvarchar(300) NULL,
  TestsPerformedRemark nvarchar(max) NULL,
  IsQuotationReady bit NOT NULL CONSTRAINT DF_Diagnosis_Ready DEFAULT 0,
  TechnicalCheckedBy nvarchar(200) NULL,
  TechnicalCheckedAt datetime2 NULL,
  TechnicalCheckRemark nvarchar(max) NULL,
  IsDiagnosisCompleted bit NOT NULL CONSTRAINT DF_Diagnosis_Completed DEFAULT 0,
  CompletionRoute nvarchar(60) NULL,
  QuotationJson nvarchar(max) NULL,
  SavedAt datetime2 NOT NULL CONSTRAINT DF_Diagnosis_SavedAt DEFAULT sysdatetime(),
  CONSTRAINT FK_Diagnosis_Repairs FOREIGN KEY (RepairNo) REFERENCES dbo.Repairs(RepairNo)
);
GO

CREATE TABLE dbo.DiagnosisRatings (
  DiagnosisId bigint NOT NULL,
  MetricName nvarchar(150) NOT NULL,
  Rating tinyint NOT NULL,
  CONSTRAINT PK_DiagnosisRatings PRIMARY KEY (DiagnosisId, MetricName),
  CONSTRAINT CK_DiagnosisRatings_Rating CHECK (Rating BETWEEN 0 AND 6),
  CONSTRAINT FK_DiagnosisRatings_Diagnosis FOREIGN KEY (DiagnosisId) REFERENCES dbo.Diagnosis(DiagnosisId) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.RepairWorkflow (
  RepairNo nvarchar(30) NOT NULL PRIMARY KEY,
  AssignedTechnician nvarchar(150) NULL,
  PartsReady bit NOT NULL CONSTRAINT DF_RepairWorkflow_PartsReady DEFAULT 0,
  OldPartsDisposition nvarchar(60) NULL,
  TechnicianGuideJson nvarchar(max) NULL,
  CurrentSubstage nvarchar(40) NOT NULL CONSTRAINT DF_RepairWorkflow_Substage DEFAULT N'Preparation',
  RepairStartedAt datetime2 NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_RepairWorkflow_Updated DEFAULT sysdatetime(),
  CONSTRAINT FK_RepairWorkflow_Repair FOREIGN KEY(RepairNo) REFERENCES dbo.Repairs(RepairNo) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.RepairWorkItems (
  WorkItemId nvarchar(50) NOT NULL PRIMARY KEY,
  RepairNo nvarchar(30) NOT NULL,
  ItemCode nvarchar(80) NULL,
  ItemDescription nvarchar(300) NOT NULL,
  WorkAction nvarchar(80) NOT NULL,
  SerialBatchNo nvarchar(200) NULL,
  Quantity decimal(18,2) NOT NULL CONSTRAINT DF_RepairWorkItems_Qty DEFAULT 1,
  InstalledBy nvarchar(150) NULL,
  WorkStatus nvarchar(30) NOT NULL CONSTRAINT DF_RepairWorkItems_Status DEFAULT N'Pending',
  WorkRemark nvarchar(max) NULL,
  CompletedAt datetime2 NULL,
  CONSTRAINT FK_RepairWorkItems_Repair FOREIGN KEY(RepairNo) REFERENCES dbo.Repairs(RepairNo) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.RepairTestResults (
  TestResultId nvarchar(50) NOT NULL PRIMARY KEY,
  RepairNo nvarchar(30) NOT NULL,
  TestName nvarchar(150) NOT NULL,
  TestResult nvarchar(20) NOT NULL CONSTRAINT DF_RepairTestResults_Result DEFAULT N'Pending',
  Observation nvarchar(max) NULL,
  TestedBy nvarchar(150) NULL,
  TestedAt datetime2 NULL,
  CONSTRAINT FK_RepairTestResults_Repair FOREIGN KEY(RepairNo) REFERENCES dbo.Repairs(RepairNo) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.RepairQaChecks (
  RepairNo nvarchar(30) NOT NULL PRIMARY KEY,
  IssueResolved bit NOT NULL CONSTRAINT DF_RepairQa_Issue DEFAULT 0,
  ConditionVerified bit NOT NULL CONSTRAINT DF_RepairQa_Condition DEFAULT 0,
  AccessoriesVerified bit NOT NULL CONSTRAINT DF_RepairQa_Accessories DEFAULT 0,
  DataHandlingConfirmed bit NOT NULL CONSTRAINT DF_RepairQa_Data DEFAULT 0,
  CheckedBy nvarchar(150) NULL,
  QaRemark nvarchar(max) NULL,
  ConfirmedAt datetime2 NULL,
  CONSTRAINT FK_RepairQa_Repair FOREIGN KEY(RepairNo) REFERENCES dbo.Repairs(RepairNo) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.RepairActivityHistory (
  ActivityId bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
  RepairNo nvarchar(30) NOT NULL,
  ActivityType nvarchar(80) NOT NULL,
  ActivityDetails nvarchar(1000) NULL,
  PerformedBy nvarchar(150) NULL,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_RepairActivity_Created DEFAULT sysdatetime(),
  CONSTRAINT FK_RepairActivity_Repair FOREIGN KEY(RepairNo) REFERENCES dbo.Repairs(RepairNo) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.RepairCollections (
  CollectionId bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
  RepairNo nvarchar(30) NOT NULL,
  PostedAt datetime2 NOT NULL CONSTRAINT DF_RepairCollections_PostedAt DEFAULT sysdatetime(),
  ScheduledPickupAt datetime2 NULL,
  NotificationChannel nvarchar(30) NULL,
  NotificationCount int NOT NULL CONSTRAINT DF_RepairCollections_NotificationCount DEFAULT 0,
  LastNotifiedAt datetime2 NULL,
  PaymentStatus nvarchar(30) NOT NULL CONSTRAINT DF_RepairCollections_PaymentStatus DEFAULT N'Outstanding',
  AmountDue decimal(18,2) NOT NULL CONSTRAINT DF_RepairCollections_AmountDue DEFAULT 0,
  AmountPaid decimal(18,2) NOT NULL CONSTRAINT DF_RepairCollections_AmountPaid DEFAULT 0,
  CollectorName nvarchar(200) NULL,
  CollectorContact nvarchar(100) NULL,
  CollectedAt datetime2 NULL,
  CollectedByStaff nvarchar(150) NULL,
  CollectionRemark nvarchar(max) NULL,
  ProofType nvarchar(40) NULL,
  ProofDataUrl nvarchar(max) NULL,
  ProofCapturedAt datetime2 NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_RepairCollections_UpdatedAt DEFAULT sysdatetime(),
  CONSTRAINT UQ_RepairCollections_Repair UNIQUE(RepairNo),
  CONSTRAINT FK_RepairCollections_Repair FOREIGN KEY(RepairNo) REFERENCES dbo.Repairs(RepairNo) ON DELETE CASCADE,
  CONSTRAINT CK_RepairCollections_Payment CHECK(PaymentStatus IN(N'Outstanding',N'Partially Paid',N'Paid'))
);
GO

CREATE INDEX IX_RepairCollections_CollectedAt ON dbo.RepairCollections(CollectedAt,PostedAt);
GO

CREATE TABLE dbo.ServiceRequests (
  RequestNo nvarchar(30) NOT NULL PRIMARY KEY,
  CustomerId nvarchar(30) NOT NULL,
  ReceivedVia nvarchar(30) NOT NULL,
  ServiceMethod nvarchar(50) NOT NULL,
  RequestStatus nvarchar(60) NOT NULL CONSTRAINT DF_ServiceRequests_Status DEFAULT N'New',
  ReportedProblem nvarchar(max) NOT NULL,
  DeviceType nvarchar(80) NULL,
  Brand nvarchar(100) NULL,
  Model nvarchar(200) NULL,
  SerialNumber nvarchar(200) NULL,
  AddressSnapshot nvarchar(1000) NULL,
  AppointmentAt datetime2 NULL,
  TimeWindow nvarchar(80) NULL,
  Coordinator nvarchar(150) NULL,
  AssignedPerson nvarchar(150) NULL,
  ReturnMethod nvarchar(50) NULL,
  ReturnAssignedPerson nvarchar(150) NULL,
  LinkedRepairNo nvarchar(30) NULL,
  NextAction nvarchar(250) NULL,
  ClosedAt datetime2 NULL,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_ServiceRequests_Created DEFAULT sysdatetime(),
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_ServiceRequests_Updated DEFAULT sysdatetime(),
  CONSTRAINT FK_ServiceRequests_Customers FOREIGN KEY(CustomerId) REFERENCES dbo.Customers(CustomerId),
  CONSTRAINT FK_ServiceRequests_Repairs FOREIGN KEY(LinkedRepairNo) REFERENCES dbo.Repairs(RepairNo)
);
CREATE UNIQUE INDEX UX_ServiceRequests_LinkedRepair ON dbo.ServiceRequests(LinkedRepairNo) WHERE LinkedRepairNo IS NOT NULL;
GO

CREATE TABLE dbo.ServiceRequestTimeline (
  TimelineId bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
  RequestNo nvarchar(30) NOT NULL,
  EventType nvarchar(80) NOT NULL,
  EventDetails nvarchar(1000) NULL,
  PerformedBy nvarchar(150) NULL,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_ServiceTimeline_Created DEFAULT sysdatetime(),
  CONSTRAINT FK_ServiceTimeline_Request FOREIGN KEY(RequestNo) REFERENCES dbo.ServiceRequests(RequestNo) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.Suppliers (
  SupplierId nvarchar(30) NOT NULL PRIMARY KEY,
  CompanyName nvarchar(200) NOT NULL,
  ContactName nvarchar(200) NULL,
  Phone nvarchar(80) NULL,
  Email nvarchar(200) NULL,
  CreditTerm nvarchar(80) NULL,
  Active bit NOT NULL CONSTRAINT DF_Suppliers_Active DEFAULT 1,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_Suppliers_UpdatedAt DEFAULT sysdatetime()
);
GO

CREATE TABLE dbo.StockItems (
  ItemCode nvarchar(80) NOT NULL PRIMARY KEY,
  ItemDescription nvarchar(300) NOT NULL,
  Description2 nvarchar(300) NULL,
  Uom nvarchar(30) NOT NULL CONSTRAINT DF_StockItems_Uom DEFAULT N'UNIT',
  UomRate decimal(18,4) NOT NULL CONSTRAINT DF_StockItems_UomRate DEFAULT 1,
  ItemGroup nvarchar(80) NULL,
  SellingPrice decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_Price DEFAULT 0,
  Price1 decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_Price1 DEFAULT 0,
  Price2 decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_Price2 DEFAULT 0,
  MinimumPrice decimal(18,2) NOT NULL CONSTRAINT DF_StockItems_MinPrice DEFAULT 0,
  ItemType nvarchar(120) NOT NULL CONSTRAINT DF_StockItems_Type DEFAULT N'Stock Item',
  Active bit NOT NULL CONSTRAINT DF_StockItems_Active DEFAULT 1,
  AutoCountLinked bit NOT NULL CONSTRAINT DF_StockItems_AutoCountLinked DEFAULT 0,
  AutoCountSynced bit NOT NULL CONSTRAINT DF_StockItems_AutoCountSynced DEFAULT 0,
  AutoCountSyncEnabled bit NOT NULL CONSTRAINT DF_StockItems_AutoCountSyncEnabled DEFAULT 1,
  LastSyncAt datetime2 NULL,
  UpdatedAt datetime2 NOT NULL CONSTRAINT DF_StockItems_UpdatedAt DEFAULT sysdatetime(),
  CONSTRAINT CK_StockItems_Prices CHECK (SellingPrice >= 0 AND MinimumPrice >= 0 AND MinimumPrice <= SellingPrice)
);
GO

CREATE TABLE dbo.AutoCountStockOptions(
  OptionType nvarchar(30) NOT NULL,
  OptionCode nvarchar(120) NOT NULL,
  Description nvarchar(250) NULL,
  IsActive bit NOT NULL CONSTRAINT DF_AutoCountStockOptions_Active DEFAULT 1,
  LastSyncedAt datetime2 NOT NULL CONSTRAINT DF_AutoCountStockOptions_Synced DEFAULT SYSDATETIME(),
  CONSTRAINT PK_AutoCountStockOptions PRIMARY KEY(OptionType,OptionCode)
);
GO

CREATE TABLE dbo.WarrantyClaims (
  WarrantyId nvarchar(30) NOT NULL PRIMARY KEY,
  RepairNo nvarchar(30) NOT NULL,
  SupplierId nvarchar(30) NOT NULL,
  ClaimReference nvarchar(100) NULL,
  ClaimStatus nvarchar(60) NOT NULL,
  SentAt datetime2 NULL,
  DeliveryMethod nvarchar(60) NULL,
  DeliveryContact nvarchar(200) NULL,
  DeliveryReference nvarchar(200) NULL,
  DeliveryPhotosJson nvarchar(max) NULL,
  SentConfirmationPrintCount int NOT NULL CONSTRAINT DF_Warranty_SentPrintCount DEFAULT 0,
  SentConfirmationLastPrintedAt datetime2 NULL,
  SentConfirmationEmailCount int NOT NULL CONSTRAINT DF_Warranty_SentEmailCount DEFAULT 0,
  SentConfirmationLastEmailedAt datetime2 NULL,
  SentConfirmationLastEmailedTo nvarchar(200) NULL,
  ExpectedReturnDate date NULL,
  ReturnedAt datetime2 NULL,
  SupplierReminderCount int NOT NULL CONSTRAINT DF_Warranty_ReminderCount DEFAULT 0,
  LastSupplierReminderAt datetime2 NULL,
  ReturnOutcome nvarchar(60) NULL,
  ReplacementDetails nvarchar(max) NULL,
  RejectReason nvarchar(max) NULL,
  AdditionalCharge decimal(18,2) NULL,
  Notes nvarchar(max) NULL,
  CONSTRAINT FK_Warranty_Repair FOREIGN KEY (RepairNo) REFERENCES dbo.Repairs(RepairNo),
  CONSTRAINT FK_Warranty_Supplier FOREIGN KEY (SupplierId) REFERENCES dbo.Suppliers(SupplierId)
);
GO

CREATE TABLE dbo.WarrantySupplierReminders (
  ReminderId bigint IDENTITY(1,1) PRIMARY KEY,
  WarrantyId nvarchar(30) NOT NULL,
  RecipientEmail nvarchar(200) NOT NULL,
  EmailSubject nvarchar(500) NOT NULL,
  EmailBody nvarchar(max) NULL,
  SentAt datetime2 NOT NULL CONSTRAINT DF_WarrantySupplierReminders_SentAt DEFAULT sysdatetime(),
  CONSTRAINT FK_WarrantySupplierReminders_Warranty FOREIGN KEY (WarrantyId) REFERENCES dbo.WarrantyClaims(WarrantyId)
);
GO

CREATE TABLE dbo.AuditTrail (
  AuditId bigint IDENTITY(1,1) PRIMARY KEY,
  UserId nvarchar(50) NULL,
  UserName nvarchar(150) NOT NULL,
  ModuleName nvarchar(100) NOT NULL,
  ActionName nvarchar(100) NOT NULL,
  RecordReference nvarchar(100) NULL,
  Details nvarchar(max) NULL,
  Result nvarchar(30) NOT NULL,
  Severity nvarchar(20) NOT NULL CONSTRAINT DF_AuditTrail_Severity DEFAULT N'Information',
  HttpMethod nvarchar(10) NULL,
  RequestPath nvarchar(500) NULL,
  ChangedFields nvarchar(1000) NULL,
  RequestData nvarchar(max) NULL,
  ResponseData nvarchar(max) NULL,
  UserAgent nvarchar(500) NULL,
  SessionId nvarchar(100) NULL,
  DurationMs int NULL,
  IpAddress nvarchar(80) NULL,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_AuditTrail_CreatedAt DEFAULT sysdatetime()
);
GO

CREATE TABLE dbo.CommissionEntries(
  CommissionEntryId bigint IDENTITY(1,1) PRIMARY KEY, RepairNo nvarchar(30) NOT NULL, LineIndex int NOT NULL,
  TechnicianUserId nvarchar(30) NOT NULL, TechnicianName nvarchar(200) NOT NULL, CustomerName nvarchar(200) NOT NULL,
  ItemCode nvarchar(80) NULL, ItemDescription nvarchar(300) NOT NULL, ItemType nvarchar(120) NULL,
  Quantity decimal(18,4) NOT NULL, UnitPrice decimal(18,2) NOT NULL, Discount decimal(18,2) NOT NULL DEFAULT 0,
  NetSales decimal(18,2) NOT NULL, CommissionType nvarchar(30) NOT NULL, CommissionValue decimal(18,4) NOT NULL,
  GrossCommission decimal(18,2) NOT NULL, AdjustmentAmount decimal(18,2) NOT NULL DEFAULT 0,
  ApprovalStatus nvarchar(30) NOT NULL DEFAULT N'Draft', PaymentStatus nvarchar(30) NOT NULL DEFAULT N'Unpaid',
  PaymentReference nvarchar(100) NULL, CompletionDate datetime2 NOT NULL, RuleSnapshotJson nvarchar(max) NULL,
  ApprovedBy nvarchar(200) NULL, ApprovedAt datetime2 NULL, PaidBy nvarchar(200) NULL, PaidAt datetime2 NULL,
  CreatedAt datetime2 NOT NULL DEFAULT SYSDATETIME(), UpdatedAt datetime2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT UQ_CommissionEntries_Source UNIQUE(RepairNo,LineIndex,TechnicianUserId)
);
CREATE TABLE dbo.CommissionAdjustments(CommissionAdjustmentId bigint IDENTITY(1,1) PRIMARY KEY,CommissionEntryId bigint NOT NULL,Amount decimal(18,2) NOT NULL,Reason nvarchar(500) NOT NULL,CreatedBy nvarchar(200) NOT NULL,CreatedAt datetime2 NOT NULL DEFAULT SYSDATETIME(),FOREIGN KEY(CommissionEntryId) REFERENCES dbo.CommissionEntries(CommissionEntryId));
CREATE TABLE dbo.CommissionPaymentBatches(PaymentBatchId nvarchar(40) PRIMARY KEY,PaymentReference nvarchar(100) NOT NULL,PaymentDate date NOT NULL,TotalAmount decimal(18,2) NOT NULL,Notes nvarchar(500) NULL,CreatedBy nvarchar(200) NOT NULL,CreatedAt datetime2 NOT NULL DEFAULT SYSDATETIME());
CREATE TABLE dbo.CommissionPaymentLines(PaymentBatchId nvarchar(40) NOT NULL,CommissionEntryId bigint NOT NULL,PaidAmount decimal(18,2) NOT NULL,PRIMARY KEY(PaymentBatchId,CommissionEntryId),FOREIGN KEY(PaymentBatchId) REFERENCES dbo.CommissionPaymentBatches(PaymentBatchId),FOREIGN KEY(CommissionEntryId) REFERENCES dbo.CommissionEntries(CommissionEntryId));
GO

CREATE INDEX IX_Repairs_Status ON dbo.Repairs(RepairStatus);
CREATE INDEX IX_Repairs_Customer ON dbo.Repairs(CustomerId);
CREATE INDEX IX_WarrantyClaims_Status ON dbo.WarrantyClaims(ClaimStatus);
CREATE INDEX IX_AuditTrail_CreatedAt ON dbo.AuditTrail(CreatedAt DESC);
CREATE INDEX IX_CommissionEntries_Period ON dbo.CommissionEntries(CompletionDate,TechnicianUserId);
CREATE INDEX IX_CommissionEntries_Status ON dbo.CommissionEntries(ApprovalStatus,PaymentStatus);
GO
