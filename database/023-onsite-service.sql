USE TechCareRepair;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.ServiceRequests',N'U') IS NULL
BEGIN
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
END;
GO

IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ServiceRequests') AND name=N'UX_ServiceRequests_LinkedRepair')
  CREATE UNIQUE INDEX UX_ServiceRequests_LinkedRepair ON dbo.ServiceRequests(LinkedRepairNo) WHERE LinkedRepairNo IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.ServiceRequestTimeline',N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ServiceRequestTimeline (
    TimelineId bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RequestNo nvarchar(30) NOT NULL,
    EventType nvarchar(80) NOT NULL,
    EventDetails nvarchar(1000) NULL,
    PerformedBy nvarchar(150) NULL,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_ServiceTimeline_Created DEFAULT sysdatetime(),
    CONSTRAINT FK_ServiceTimeline_Request FOREIGN KEY(RequestNo) REFERENCES dbo.ServiceRequests(RequestNo) ON DELETE CASCADE
  );
END;
GO

;WITH Roles AS (SELECT value AccessRole FROM STRING_SPLIT(N'Administrator|Manager|Supervisor|Counter Staff|Technician',N'|')),
Actions AS (SELECT value ActionName FROM STRING_SPLIT(N'View|Create|Edit|Delete|Approve|Print|Sync',N'|'))
INSERT dbo.AccessRights(AccessRole,ModuleName,ActionName,IsAllowed)
SELECT r.AccessRole,N'Onsite Service',a.ActionName,
  CASE WHEN r.AccessRole IN(N'Administrator',N'Manager',N'Supervisor') THEN 1
       WHEN r.AccessRole IN(N'Counter Staff',N'Technician') AND a.ActionName IN(N'View',N'Create',N'Edit',N'Print') THEN 1
       ELSE 0 END
FROM Roles r CROSS JOIN Actions a
WHERE NOT EXISTS(SELECT 1 FROM dbo.AccessRights x WHERE x.AccessRole=r.AccessRole AND x.ModuleName=N'Onsite Service' AND x.ActionName=a.ActionName);
GO
