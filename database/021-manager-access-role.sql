USE TechCareRepair;
GO

;WITH Modules AS (
  SELECT value ModuleName FROM STRING_SPLIT(N'Dashboard|Repairs|Customers|Warranty|Service Contracts|Suppliers|Stock Items|Accounting Sync|Reports|General Maintenance',N'|')
), Actions AS (
  SELECT value ActionName FROM STRING_SPLIT(N'View|Create|Edit|Delete|Approve|Print|Sync',N'|')
)
INSERT dbo.AccessRights(AccessRole,ModuleName,ActionName,IsAllowed)
SELECT N'Manager',m.ModuleName,a.ActionName,CASE WHEN a.ActionName=N'Delete' THEN 0 ELSE 1 END
FROM Modules m CROSS JOIN Actions a
WHERE NOT EXISTS(
  SELECT 1 FROM dbo.AccessRights existing
  WHERE existing.AccessRole=N'Manager' AND existing.ModuleName=m.ModuleName AND existing.ActionName=a.ActionName
);
GO
