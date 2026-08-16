SET XACT_ABORT ON;
GO
IF COL_LENGTH('dbo.AuditTrail','UserId') IS NULL ALTER TABLE dbo.AuditTrail ADD UserId nvarchar(50) NULL;
IF COL_LENGTH('dbo.AuditTrail','Severity') IS NULL ALTER TABLE dbo.AuditTrail ADD Severity nvarchar(20) NOT NULL CONSTRAINT DF_AuditTrail_Severity DEFAULT N'Information';
IF COL_LENGTH('dbo.AuditTrail','HttpMethod') IS NULL ALTER TABLE dbo.AuditTrail ADD HttpMethod nvarchar(10) NULL;
IF COL_LENGTH('dbo.AuditTrail','RequestPath') IS NULL ALTER TABLE dbo.AuditTrail ADD RequestPath nvarchar(500) NULL;
IF COL_LENGTH('dbo.AuditTrail','ChangedFields') IS NULL ALTER TABLE dbo.AuditTrail ADD ChangedFields nvarchar(1000) NULL;
IF COL_LENGTH('dbo.AuditTrail','RequestData') IS NULL ALTER TABLE dbo.AuditTrail ADD RequestData nvarchar(max) NULL;
IF COL_LENGTH('dbo.AuditTrail','ResponseData') IS NULL ALTER TABLE dbo.AuditTrail ADD ResponseData nvarchar(max) NULL;
IF COL_LENGTH('dbo.AuditTrail','UserAgent') IS NULL ALTER TABLE dbo.AuditTrail ADD UserAgent nvarchar(500) NULL;
IF COL_LENGTH('dbo.AuditTrail','SessionId') IS NULL ALTER TABLE dbo.AuditTrail ADD SessionId nvarchar(100) NULL;
IF COL_LENGTH('dbo.AuditTrail','DurationMs') IS NULL ALTER TABLE dbo.AuditTrail ADD DurationMs int NULL;
IF COL_LENGTH('dbo.AuditTrail','IpAddress') IS NULL ALTER TABLE dbo.AuditTrail ADD IpAddress nvarchar(80) NULL;
GO
UPDATE dbo.AuditTrail SET Severity=CASE WHEN Result=N'Failed' THEN N'Warning' ELSE N'Information' END WHERE Severity IS NULL OR Severity=N'';
GO
