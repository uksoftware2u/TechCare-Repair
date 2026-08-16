USE TechCareRepair;

IF OBJECT_ID(N'dbo.RepairWorkflow',N'U') IS NULL
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

IF OBJECT_ID(N'dbo.RepairWorkItems',N'U') IS NULL
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

IF OBJECT_ID(N'dbo.RepairTestResults',N'U') IS NULL
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

IF OBJECT_ID(N'dbo.RepairQaChecks',N'U') IS NULL
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

IF OBJECT_ID(N'dbo.RepairActivityHistory',N'U') IS NULL
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
