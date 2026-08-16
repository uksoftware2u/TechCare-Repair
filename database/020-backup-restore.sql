USE TechCareRepair;
GO
IF IS_ROLEMEMBER(N'db_backupoperator',N'techcare_app') <> 1
  ALTER ROLE db_backupoperator ADD MEMBER techcare_app;
GO

USE master;
GO
IF NOT EXISTS(SELECT 1 FROM sys.database_principals WHERE name=N'techcare_app')
  CREATE USER techcare_app FOR LOGIN techcare_app;
GO
CREATE OR ALTER PROCEDURE dbo.TechCareListBackups
WITH EXECUTE AS OWNER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP (50) bs.backup_set_id AS BackupId,
    RIGHT(bmf.physical_device_name,CHARINDEX('\',REVERSE(bmf.physical_device_name))-1) AS FileName,
    bmf.physical_device_name AS BackupPath,bs.backup_start_date AS StartedAt,
    bs.backup_finish_date AS FinishedAt,bs.backup_size AS BackupSize,
    bs.compressed_backup_size AS CompressedSize,bs.is_copy_only AS IsCopyOnly,
    bs.has_backup_checksums AS HasChecksum,bs.user_name AS CreatedBy
  FROM msdb.dbo.backupset bs
  JOIN msdb.dbo.backupmediafamily bmf ON bmf.media_set_id=bs.media_set_id
  WHERE bs.database_name=N'TechCareRepair' AND bs.type=N'D'
  ORDER BY bs.backup_finish_date DESC;
END;
GO
CREATE OR ALTER PROCEDURE dbo.TechCareVerifyBackup @FileName nvarchar(260)
WITH EXECUTE AS OWNER
AS
BEGIN
  SET NOCOUNT ON;
  IF @FileName LIKE N'%\%' OR @FileName LIKE N'%/%' OR @FileName NOT LIKE N'TechCareRepair[_]%.bak'
    THROW 50001,'Invalid TechCare backup file name.',1;
  DECLARE @Directory nvarchar(3500)=CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(3500));
  DECLARE @Path nvarchar(4000)=CONCAT(@Directory,CASE WHEN RIGHT(@Directory,1) IN (N'\',N'/') THEN N'' ELSE N'\' END,@FileName);
  RESTORE VERIFYONLY FROM DISK=@Path WITH CHECKSUM;
  SELECT @FileName AS FileName,N'Verified' AS VerificationStatus;
END;
GO
CREATE OR ALTER PROCEDURE dbo.TechCareRestoreBackup @FileName nvarchar(260)
WITH EXECUTE AS OWNER
AS
BEGIN
  SET NOCOUNT ON;
  IF @FileName LIKE N'%\%' OR @FileName LIKE N'%/%' OR @FileName NOT LIKE N'TechCareRepair[_]%.bak'
    THROW 50001,'Invalid TechCare backup file name.',1;
  DECLARE @Directory nvarchar(3500)=CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(3500));
  DECLARE @Path nvarchar(4000)=CONCAT(@Directory,CASE WHEN RIGHT(@Directory,1) IN (N'\',N'/') THEN N'' ELSE N'\' END,@FileName);
  RESTORE VERIFYONLY FROM DISK=@Path WITH CHECKSUM;
  ALTER DATABASE TechCareRepair SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  BEGIN TRY
    RESTORE DATABASE TechCareRepair FROM DISK=@Path WITH REPLACE,RECOVERY;
    ALTER DATABASE TechCareRepair SET MULTI_USER;
  END TRY
  BEGIN CATCH
    ALTER DATABASE TechCareRepair SET MULTI_USER;
    THROW;
  END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.TechCareRestoreUploadedBackup @BackupPath nvarchar(4000)
WITH EXECUTE AS OWNER
AS
BEGIN
  SET NOCOUNT ON;
  IF @BackupPath IS NULL OR LOWER(RIGHT(@BackupPath,4))<>N'.bak'
    THROW 50001,'Only a SQL Server .bak file can be restored.',1;
  RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;
  ALTER DATABASE TechCareRepair SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  BEGIN TRY
    RESTORE DATABASE TechCareRepair FROM DISK=@BackupPath WITH REPLACE,RECOVERY;
    ALTER DATABASE TechCareRepair SET MULTI_USER;
  END TRY
  BEGIN CATCH
    ALTER DATABASE TechCareRepair SET MULTI_USER;
    THROW;
  END CATCH;
END;
GO
GRANT EXECUTE ON dbo.TechCareListBackups TO techcare_app;
GRANT EXECUTE ON dbo.TechCareVerifyBackup TO techcare_app;
GRANT EXECUTE ON dbo.TechCareRestoreBackup TO techcare_app;
GRANT EXECUTE ON dbo.TechCareRestoreUploadedBackup TO techcare_app;
GO
IF OBJECT_ID(N'dbo.TechCareReadBackup',N'P') IS NOT NULL DROP PROCEDURE dbo.TechCareReadBackup;
GO
IF EXISTS(SELECT 1 FROM sys.server_principals WHERE name=N'TechCareBackupReaderLogin') DROP LOGIN TechCareBackupReaderLogin;
GO
IF EXISTS(SELECT 1 FROM sys.certificates WHERE name=N'TechCareBackupReaderCertificate') DROP CERTIFICATE TechCareBackupReaderCertificate;
GO
