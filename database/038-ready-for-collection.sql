SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.RepairCollections',N'U') IS NULL
BEGIN
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
END;
GO

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.RepairCollections') AND name=N'IX_RepairCollections_CollectedAt')
  CREATE INDEX IX_RepairCollections_CollectedAt ON dbo.RepairCollections(CollectedAt,PostedAt);
GO

INSERT dbo.RepairCollections(RepairNo,PostedAt,AmountDue,PaymentStatus)
SELECT r.RepairNo,COALESCE(r.CompletedAt,r.UpdatedAt),r.DiagnosticFee,N'Outstanding'
FROM dbo.Repairs r
WHERE r.RepairStatus IN(N'Ready for Collection',N'Collected')
  AND NOT EXISTS(SELECT 1 FROM dbo.RepairCollections c WHERE c.RepairNo=r.RepairNo);
GO

;WITH Roles AS (SELECT value AccessRole FROM STRING_SPLIT(N'Administrator|Manager|Supervisor|Counter Staff|Technician',N'|')),
Actions AS (SELECT value ActionName FROM STRING_SPLIT(N'View|Create|Edit|Delete|Approve|Print|Sync',N'|'))
INSERT dbo.AccessRights(AccessRole,ModuleName,ActionName,IsAllowed)
SELECT r.AccessRole,N'Ready for Collection',a.ActionName,
  CASE
    WHEN r.AccessRole=N'Administrator' THEN 1
    WHEN r.AccessRole IN(N'Manager',N'Supervisor') AND a.ActionName<>N'Delete' THEN 1
    WHEN r.AccessRole=N'Counter Staff' AND a.ActionName IN(N'View',N'Create',N'Edit',N'Print') THEN 1
    WHEN r.AccessRole=N'Technician' AND a.ActionName=N'View' THEN 1
    ELSE 0
  END
FROM Roles r CROSS JOIN Actions a
WHERE NOT EXISTS(
  SELECT 1 FROM dbo.AccessRights x
  WHERE x.AccessRole=r.AccessRole AND x.ModuleName=N'Ready for Collection' AND x.ActionName=a.ActionName
);
GO
