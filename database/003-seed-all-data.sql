USE TechCareRepair;

UPDATE dbo.CompanyProfile SET CompanyName=N'TechCare PC Sdn. Bhd.',BusinessRegistrationNo=N'202601012345',Tin=N'C25801234010',SstRegistrationNo=N'W10-2608-32000123',Phone=N'+60 3-7981 8800',Email=N'service@techcare.my',Website=N'www.techcare.my',Address=N'12, Jalan Kuchai Maju 8'+CHAR(10)+N'Kuchai Entrepreneurs Park'+CHAR(10)+N'58200 Kuala Lumpur',Currency=N'MYR',TimeZone=N'Asia/Kuala_Lumpur',UpdatedAt=SYSDATETIME();

IF NOT EXISTS(SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000129') INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,AutoCountSynced) VALUES(N'CUST-000129',N'380-N001',N'Nur Izzati',N'Nur Izzati',N'+60 13-661 9082',N'nur.izzati@example.my',N'RETAIL',N'KUALA LUMPUR',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000130') INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,AutoCountSynced) VALUES(N'CUST-000130',N'380-S002',N'Siti Nurhidayah',N'Siti Nurhidayah',N'+60 17-445 1102',N'siti.nurhidayah@example.my',N'RETAIL',N'KUALA LUMPUR',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000131') INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,AutoCountSynced) VALUES(N'CUST-000131',N'380-T001',N'Tan Kok Leong',N'Tan Kok Leong',N'+60 12-882 4510',N'tan.kok.leong@example.my',N'RETAIL',N'SELANGOR',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000132') INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,AutoCountSynced) VALUES(N'CUST-000132',N'380-H001',N'Hafiz Rahman',N'Hafiz Rahman',N'—',N'—',N'RETAIL',N'—',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000133') INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,AutoCountSynced) VALUES(N'CUST-000133',N'380-M001',N'Melissa Tan',N'Melissa Tan',N'—',N'—',N'RETAIL',N'—',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000134') INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,AutoCountSynced) VALUES(N'CUST-000134',N'380-K001',N'Kumar Raj',N'Kumar Raj',N'—',N'—',N'RETAIL',N'—',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000135') INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,AutoCountSynced) VALUES(N'CUST-000135',N'380-N002',N'Nurul Huda',N'Nurul Huda',N'—',N'—',N'RETAIL',N'—',0);

UPDATE dbo.Repairs SET CustomerId=N'CUST-000129' WHERE RepairNo=N'SR-20260811-097';
IF NOT EXISTS(SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260812-003') INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DueDate,DiagnosticFee) VALUES(N'SR-20260812-003',N'CUST-000130',N'HP',N'Pavilion 15',N'Blue screen issue',N'Repairing',N'Aiman','2026-08-12','2026-08-16',220);
IF NOT EXISTS(SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260811-098') INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DueDate,DiagnosticFee) VALUES(N'SR-20260811-098',N'CUST-000131',N'Lenovo',N'ThinkPad E14',N'Unable to power on',N'Diagnosis',N'Unassigned','2026-08-11','2026-08-15',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260801-076') INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DiagnosticFee) VALUES(N'SR-20260801-076',N'CUST-000132',N'ASUS',N'TUF Gaming F15',N'Warranty claim preparation',N'Waiting Approval',N'Unassigned','2026-08-01',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260803-081') INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DiagnosticFee) VALUES(N'SR-20260803-081',N'CUST-000133',N'Acer',N'Swift 3',N'Sent to supplier for warranty',N'Repairing',N'Unassigned','2026-08-03',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260729-068') INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DiagnosticFee) VALUES(N'SR-20260729-068',N'CUST-000134',N'Lenovo',N'IdeaPad 5',N'Sent to supplier for warranty',N'Repairing',N'Unassigned','2026-07-29',0);
IF NOT EXISTS(SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260725-055') INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DiagnosticFee) VALUES(N'SR-20260725-055',N'CUST-000135',N'HP',N'Pavilion 14',N'Returned from supplier',N'Ready for Collection',N'Unassigned','2026-07-25',0);

DELETE FROM dbo.WarrantyClaims;
DELETE FROM dbo.Suppliers;
INSERT dbo.Suppliers(SupplierId,CompanyName,ContactName,Phone,Email,CreditTerm,Category,WarrantyTerms,OpenClaims,SupplierStatus) VALUES
(N'SUP-000021',N'ASUS Malaysia',N'Jason Lee',N'+60 3-2148 0822',N'service@asus.com.my',N'30 Days',N'Manufacturer',N'12 months',4,N'Active'),
(N'SUP-000020',N'SNS Network',N'Alicia Wong',N'+60 5-242 3399',N'rma@sns.com.my',N'30 Days',N'Distributor',N'12 months',3,N'Active'),
(N'SUP-000019',N'Ingram Micro Malaysia',N'Farid Ismail',N'+60 3-7952 8188',N'support@ingram.com',N'45 Days',N'Distributor',N'Varies',2,N'Active'),
(N'SUP-000018',N'Lenovo Malaysia',N'Rachel Lim',N'+60 3-2788 9100',N'service@lenovo.com',N'30 Days',N'Manufacturer',N'12 months',2,N'Active'),
(N'SUP-000017',N'KL Computer Parts',N'Amir Hassan',N'+60 3-7981 2210',N'sales@klparts.my',N'C.O.D.',N'Parts Supplier',N'3 months',0,N'On Hold');
INSERT dbo.WarrantyClaims(WarrantyId,RepairNo,SupplierId,ClaimReference,ClaimStatus,SentAt,ExpectedReturnDate,ReturnedAt,Notes) VALUES
(N'WR-260812-018',N'SR-20260801-076',N'SUP-000021',NULL,N'Preparation',NULL,NULL,NULL,N'Prepare device and supplier documents.'),
(N'WR-260812-017',N'SR-20260803-081',N'SUP-000020',N'CLM-SNS-11542',N'Sent to Supplier','2026-08-04','2026-08-17',NULL,N'Awaiting supplier diagnosis.'),
(N'WR-260811-016',N'SR-20260729-068',N'SUP-000018',N'CLM-LNV-30776',N'Sent to Supplier','2026-07-30','2026-08-13',NULL,N'Supplier confirmed replacement unit.'),
(N'WR-260810-015',N'SR-20260725-055',N'SUP-000019',N'CLM-IM-90118',N'Returned from Supplier','2026-07-26','2026-08-12','2026-08-12',N'Device received and ready for inspection.');

DELETE FROM dbo.Users;
INSERT dbo.Users(UserId,FullName,UserName,Email,AccessRole,Branch,LastLoginAt,UserStatus,PhotoDataUrl) VALUES
(N'USR-001',N'Nur Aisyah',N'aisyah',N'aisyah@techcare.my',N'Counter Staff',N'Kuala Lumpur','2026-08-12T10:01:00',N'Active',NULL),
(N'USR-002',N'Rizal Hakim',N'rizal',N'rizal@techcare.my',N'Technician',N'Kuala Lumpur','2026-08-12T09:42:00',N'Active',NULL),
(N'USR-003',N'Aiman Zulkifli',N'aiman',N'aiman@techcare.my',N'Technician',N'Subang Jaya','2026-08-11T17:28:00',N'Active',NULL),
(N'USR-004',N'Farah Nadia',N'farah',N'farah@techcare.my',N'Supervisor',N'Kuala Lumpur','2026-08-12T08:55:00',N'Active',NULL),
(N'USR-005',N'Admin Support',N'support',N'support@techcare.my',N'Administrator',N'All Branches','2026-08-01T14:20:00',N'Inactive',NULL);

MERGE dbo.AppSettings AS target USING (VALUES
(N'maintenance-options',N'{"repairPrefix":"SR","nextNumber":"20260812-005","defaultFee":"50.00","warrantyDays":"14","taxRate":"8","receiptCopies":"2","autoDebtor":true,"autoInvoice":true,"requirePhotos":true,"notifyReady":true,"allowDiscount":false}'),
(N'autocount-api-settings',N'{"connection":"AutoCount Accounting On-Premises","onPremiseType":"Local Network","serverAddress":"localhost","autoCountPort":"19500","sqlServer":"localhost\\A2006","sqlAuthentication":"SQL Server Authentication","sqlUsername":"","sqlPassword":"","onPremiseApiUrl":"http://127.0.0.1:8090/api/autocount","accountBook":"TechCare PC Sdn. Bhd.","databaseName":"AED_TECHCARE","username":"api_user","password":"","baseUrl":"https://accounting-api.autocountcloud.com","apiKey":"","webApiBaseUrl":"https://api.autocount.cloud","webApiKey":"","webApiConnectorId":"","webApiCompanyId":"","autoSync":true,"interval":"5","retry":"3"}')
) AS source(SettingKey,JsonValue) ON target.SettingKey=source.SettingKey
WHEN MATCHED THEN UPDATE SET JsonValue=source.JsonValue,UpdatedAt=SYSDATETIME()
WHEN NOT MATCHED THEN INSERT(SettingKey,JsonValue) VALUES(source.SettingKey,source.JsonValue);

DELETE FROM dbo.AccessRights;
;WITH Roles AS (SELECT value AccessRole FROM STRING_SPLIT(N'Administrator|Manager|Supervisor|Counter Staff|Technician',N'|')),
Modules AS (SELECT value ModuleName FROM STRING_SPLIT(N'Dashboard|Repairs|Ready for Collection|Customers|Warranty|Onsite Service|Service Contracts|Suppliers|Stock Items|Accounting Sync|Reports|General Maintenance',N'|')),
Actions AS (SELECT value ActionName FROM STRING_SPLIT(N'View|Create|Edit|Delete|Approve|Print|Sync',N'|'))
INSERT dbo.AccessRights(AccessRole,ModuleName,ActionName,IsAllowed)
SELECT r.AccessRole,m.ModuleName,a.ActionName,CASE WHEN r.AccessRole=N'Administrator' THEN 1 WHEN r.AccessRole IN(N'Manager',N'Supervisor') AND a.ActionName<>N'Delete' THEN 1 WHEN r.AccessRole=N'Counter Staff' AND m.ModuleName IN(N'Dashboard',N'Repairs',N'Ready for Collection',N'Customers') AND a.ActionName IN(N'View',N'Create',N'Edit',N'Print') THEN 1 WHEN r.AccessRole=N'Technician' AND ((m.ModuleName IN(N'Dashboard',N'Repairs',N'Warranty') AND a.ActionName IN(N'View',N'Edit',N'Print')) OR (m.ModuleName=N'Ready for Collection' AND a.ActionName=N'View')) THEN 1 ELSE 0 END
FROM Roles r CROSS JOIN Modules m CROSS JOIN Actions a;

DELETE FROM dbo.AuditTrail;
INSERT dbo.AuditTrail(UserName,ModuleName,ActionName,RecordReference,Details,Result,CreatedAt) VALUES
(N'Nur Aisyah',N'Repairs',N'Create',N'SR-20260812-005',N'Created repair intake and queued AutoCount invoice',N'Success','2026-08-12T10:15:08'),
(N'Admin Support',N'General Maintenance',N'Update',N'Company Profile',N'Updated company contact information',N'Success','2026-08-12T10:12:31'),
(N'Rizal Hakim',N'Repairs',N'Update',N'SR-20260812-002',N'Repair status changed to Repairing',N'Success','2026-08-12T09:55:16'),
(N'Nur Aisyah',N'Customers',N'Create',N'CUST-000128',N'Customer created and synced to AutoCount',N'Success','2026-08-12T09:48:03'),
(N'Admin Support',N'User Maintenance',N'Login Failed',N'support',N'Invalid password entered',N'Failed','2026-08-12T09:40:27');

DELETE FROM dbo.AccountingSyncRecords;
INSERT dbo.AccountingSyncRecords(SyncId,RecordType,SourceReference,Description,AutoCountTarget,AutoCountReference,LastSyncAt,SyncStatus,ResultMessage) VALUES
(N'SYNC-000128',N'Customer',N'CUST-000128',N'Lim Wei Jie',N'Debtor',N'380-L001','2026-08-12T10:12:00',N'Synced',N'Created successfully'),
(N'SYNC-000127',N'Invoice',N'INV-20260812-008',N'Repair SR-20260812-002',N'Sales Invoice',N'IV-000088','2026-08-12T10:10:00',N'Synced',N'Posted successfully'),
(N'SYNC-000126',N'Payment',N'PAY-20260812-005',N'RM 180.00 · Lim Wei Jie',N'Official Receipt',N'OR-000051','2026-08-12T10:10:00',N'Synced',N'Payment applied'),
(N'SYNC-000125',N'Customer',N'CUST-000126',N'Ahmad Faizal',N'Debtor',NULL,NULL,N'Pending',N'Waiting for manual sync'),
(N'SYNC-000123',N'Invoice',N'INV-20260812-009',N'Repair SR-20260812-005',N'Sales Invoice',NULL,NULL,N'Pending',N'Queued after repair confirmation');

IF NOT EXISTS(SELECT 1 FROM dbo.Diagnosis WHERE RepairNo=N'SR-20260812-002')
BEGIN
  INSERT dbo.Diagnosis(RepairNo,CustomerSymptom,CustomerExplanation,RootCause,InternalNote,RecommendedRepair,IsQuotationReady) VALUES(N'SR-20260812-002',N'Keyboard not working',N'The built-in keyboard is faulty. We recommend replacement.',N'Internal keyboard module faulty. Ribbon connector stable, no corrosion.',N'Original keyboard module available in KL branch.',N'Replace keyboard module',1);
  DECLARE @Diagnosis002 bigint=SCOPE_IDENTITY();
  INSERT dbo.DiagnosisRatings(DiagnosisId,MetricName,Rating) VALUES(@Diagnosis002,N'Visual inspection',5),(@Diagnosis002,N'BIOS keyboard test',2),(@Diagnosis002,N'Driver & Device Manager',5),(@Diagnosis002,N'External keyboard test',5),(@Diagnosis002,N'Ribbon cable & connector',5),(@Diagnosis002,N'Liquid damage check',5);
END;
IF NOT EXISTS(SELECT 1 FROM dbo.Diagnosis WHERE RepairNo=N'SR-20260811-098')
BEGIN
  INSERT dbo.Diagnosis(RepairNo,CustomerSymptom,CustomerExplanation,RootCause,InternalNote,RecommendedRepair,IsQuotationReady) VALUES(N'SR-20260811-098',N'Unable to power on',N'Inspection findings for: Unable to power on',N'Diagnosis in progress.',N'SR-20260811-098 · Diagnosis',N'Inspection / diagnosis required',0);
  DECLARE @Diagnosis098 bigint=SCOPE_IDENTITY();
  INSERT dbo.DiagnosisRatings(DiagnosisId,MetricName,Rating) VALUES(@Diagnosis098,N'Visual inspection',5),(@Diagnosis098,N'BIOS keyboard test',5),(@Diagnosis098,N'Driver & Device Manager',5),(@Diagnosis098,N'External keyboard test',5),(@Diagnosis098,N'Ribbon cable & connector',5),(@Diagnosis098,N'Liquid damage check',5);
END;

MERGE dbo.DebtorSequences AS target USING (VALUES('A',0),('F',1),('H',1),('K',1),('L',1),('M',1),('N',2),('S',2),('T',1)) source(PrefixLetter,LastNumber) ON target.PrefixLetter=source.PrefixLetter
WHEN MATCHED THEN UPDATE SET LastNumber=source.LastNumber,UpdatedAt=SYSDATETIME()
WHEN NOT MATCHED THEN INSERT(PrefixLetter,LastNumber) VALUES(source.PrefixLetter,source.LastNumber);
