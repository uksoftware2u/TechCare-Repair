USE TechCareRepair;
GO

;WITH Actions AS (
  SELECT value ActionName FROM STRING_SPLIT(N'View|Create|Edit|Delete|Approve|Print|Sync',N'|')
)
MERGE dbo.AccessRights AS target
USING (
  SELECT N'Administrator' AccessRole,N'General Maintenance' ModuleName,ActionName
  FROM Actions
) AS source
ON target.AccessRole=source.AccessRole
AND target.ModuleName=source.ModuleName
AND target.ActionName=source.ActionName
WHEN MATCHED THEN UPDATE SET IsAllowed=1,UpdatedAt=SYSDATETIME()
WHEN NOT MATCHED THEN INSERT(AccessRole,ModuleName,ActionName,IsAllowed)
VALUES(source.AccessRole,source.ModuleName,source.ActionName,1);
GO
