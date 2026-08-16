IF COL_LENGTH('dbo.Repairs','CompletedAt') IS NULL
  ALTER TABLE dbo.Repairs ADD CompletedAt datetime2 NULL;
GO

UPDATE dbo.Repairs
SET CompletedAt=COALESCE(CompletedAt,UpdatedAt)
WHERE RepairStatus IN(N'Ready for Collection',N'Completed',N'Collected') AND CompletedAt IS NULL;
GO

IF OBJECT_ID('dbo.CommissionEntries','U') IS NULL
BEGIN
  CREATE TABLE dbo.CommissionEntries(
    CommissionEntryId bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RepairNo nvarchar(30) NOT NULL,
    LineIndex int NOT NULL,
    TechnicianUserId nvarchar(30) NOT NULL,
    TechnicianName nvarchar(200) NOT NULL,
    CustomerName nvarchar(200) NOT NULL,
    ItemCode nvarchar(80) NULL,
    ItemDescription nvarchar(300) NOT NULL,
    ItemType nvarchar(120) NULL,
    Quantity decimal(18,4) NOT NULL,
    UnitPrice decimal(18,2) NOT NULL,
    Discount decimal(18,2) NOT NULL CONSTRAINT DF_CommissionEntries_Discount DEFAULT 0,
    NetSales decimal(18,2) NOT NULL,
    CommissionType nvarchar(30) NOT NULL,
    CommissionValue decimal(18,4) NOT NULL,
    GrossCommission decimal(18,2) NOT NULL,
    AdjustmentAmount decimal(18,2) NOT NULL CONSTRAINT DF_CommissionEntries_Adjustment DEFAULT 0,
    ApprovalStatus nvarchar(30) NOT NULL CONSTRAINT DF_CommissionEntries_Approval DEFAULT N'Draft',
    PaymentStatus nvarchar(30) NOT NULL CONSTRAINT DF_CommissionEntries_Payment DEFAULT N'Unpaid',
    PaymentReference nvarchar(100) NULL,
    CompletionDate datetime2 NOT NULL,
    RuleSnapshotJson nvarchar(max) NULL,
    ApprovedBy nvarchar(200) NULL,
    ApprovedAt datetime2 NULL,
    PaidBy nvarchar(200) NULL,
    PaidAt datetime2 NULL,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_CommissionEntries_Created DEFAULT SYSDATETIME(),
    UpdatedAt datetime2 NOT NULL CONSTRAINT DF_CommissionEntries_Updated DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_CommissionEntries_Source UNIQUE(RepairNo,LineIndex,TechnicianUserId),
    CONSTRAINT CK_CommissionEntries_Approval CHECK(ApprovalStatus IN(N'Draft',N'Approved',N'Rejected')),
    CONSTRAINT CK_CommissionEntries_Payment CHECK(PaymentStatus IN(N'Unpaid',N'Paid',N'Cancelled'))
  );
  CREATE INDEX IX_CommissionEntries_Period ON dbo.CommissionEntries(CompletionDate,TechnicianUserId);
  CREATE INDEX IX_CommissionEntries_Status ON dbo.CommissionEntries(ApprovalStatus,PaymentStatus);
END;
GO

IF OBJECT_ID('dbo.CommissionAdjustments','U') IS NULL
BEGIN
  CREATE TABLE dbo.CommissionAdjustments(
    CommissionAdjustmentId bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CommissionEntryId bigint NOT NULL,
    Amount decimal(18,2) NOT NULL,
    Reason nvarchar(500) NOT NULL,
    CreatedBy nvarchar(200) NOT NULL,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_CommissionAdjustments_Created DEFAULT SYSDATETIME(),
    CONSTRAINT FK_CommissionAdjustments_Entry FOREIGN KEY(CommissionEntryId) REFERENCES dbo.CommissionEntries(CommissionEntryId)
  );
END;
GO

IF OBJECT_ID('dbo.CommissionPaymentBatches','U') IS NULL
BEGIN
  CREATE TABLE dbo.CommissionPaymentBatches(
    PaymentBatchId nvarchar(40) NOT NULL PRIMARY KEY,
    PaymentReference nvarchar(100) NOT NULL,
    PaymentDate date NOT NULL,
    TotalAmount decimal(18,2) NOT NULL,
    Notes nvarchar(500) NULL,
    CreatedBy nvarchar(200) NOT NULL,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_CommissionPaymentBatches_Created DEFAULT SYSDATETIME()
  );
  CREATE TABLE dbo.CommissionPaymentLines(
    PaymentBatchId nvarchar(40) NOT NULL,
    CommissionEntryId bigint NOT NULL,
    PaidAmount decimal(18,2) NOT NULL,
    CONSTRAINT PK_CommissionPaymentLines PRIMARY KEY(PaymentBatchId,CommissionEntryId),
    CONSTRAINT FK_CommissionPaymentLines_Batch FOREIGN KEY(PaymentBatchId) REFERENCES dbo.CommissionPaymentBatches(PaymentBatchId),
    CONSTRAINT FK_CommissionPaymentLines_Entry FOREIGN KEY(CommissionEntryId) REFERENCES dbo.CommissionEntries(CommissionEntryId)
  );
END;
GO

;WITH LatestDiagnosis AS(
  SELECT d.*,ROW_NUMBER() OVER(PARTITION BY d.RepairNo ORDER BY d.SavedAt DESC,d.DiagnosisId DESC) rn
  FROM dbo.Diagnosis d WHERE d.QuotationJson IS NOT NULL
),SourceLines AS(
  SELECT r.RepairNo,CONVERT(int,j.[key])+1 LineIndex,u.UserId,u.FullName,c.ContactName,
    q.ItemCode,COALESCE(NULLIF(q.ItemDescription,N''),NULLIF(q.ItemCode,N''),CONCAT(N'Item ',CONVERT(int,j.[key])+1)) ItemDescription,
    s.ItemType,q.Quantity,q.UnitPrice,
    CASE WHEN q.Discount<0 THEN 0 WHEN q.Discount>q.Quantity*q.UnitPrice THEN q.Quantity*q.UnitPrice ELSE q.Discount END Discount,
    r.CompletedAt,u.CommissionType,u.CommissionValue
  FROM dbo.Repairs r
  JOIN dbo.Customers c ON c.CustomerId=r.CustomerId
  JOIN dbo.Users u ON u.FullName=r.Technician AND u.CommissionType IN(N'Item Rate',N'Item Amount')
  JOIN LatestDiagnosis d ON d.RepairNo=r.RepairNo AND d.rn=1
  CROSS APPLY OPENJSON(d.QuotationJson,N'$.lines') j
  CROSS APPLY OPENJSON(j.value) WITH(ItemCode nvarchar(80) N'$.itemCode',ItemDescription nvarchar(300) N'$.name',Quantity decimal(18,4) N'$.qty',UnitPrice decimal(18,2) N'$.price',Discount decimal(18,2) N'$.discount') q
  LEFT JOIN dbo.StockItems s ON s.ItemCode=q.ItemCode
  WHERE r.CompletedAt IS NOT NULL AND q.Quantity>0
)
INSERT dbo.CommissionEntries(RepairNo,LineIndex,TechnicianUserId,TechnicianName,CustomerName,ItemCode,ItemDescription,ItemType,Quantity,UnitPrice,Discount,NetSales,CommissionType,CommissionValue,GrossCommission,CompletionDate,RuleSnapshotJson)
SELECT x.RepairNo,x.LineIndex,x.UserId,x.FullName,x.ContactName,x.ItemCode,x.ItemDescription,x.ItemType,x.Quantity,x.UnitPrice,x.Discount,
  calc.NetSales,x.CommissionType,x.CommissionValue,
  ROUND(CASE WHEN x.CommissionType=N'Item Rate' THEN calc.NetSales*x.CommissionValue/100 ELSE x.Quantity*x.CommissionValue END,2),x.CompletedAt,
  (SELECT x.UserId technicianUserId,x.CommissionType commissionType,x.CommissionValue commissionValue,x.CompletedAt capturedAt FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)
FROM SourceLines x
CROSS APPLY(VALUES(CONVERT(decimal(18,2),x.Quantity*x.UnitPrice-x.Discount)))calc(NetSales)
WHERE NOT EXISTS(SELECT 1 FROM dbo.CommissionEntries e WHERE e.RepairNo=x.RepairNo AND e.LineIndex=x.LineIndex AND e.TechnicianUserId=x.UserId);
GO
