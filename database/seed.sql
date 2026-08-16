IF NOT EXISTS (SELECT 1 FROM dbo.CompanyProfile)
  INSERT dbo.CompanyProfile(CompanyName,BusinessRegistrationNo,Address,Phone,Email) VALUES(N'TechCare PC Sdn. Bhd.',N'202601012345',N'12, Jalan Kuchai Maju 8, Kuchai Entrepreneurs Park, 58200 Kuala Lumpur',N'+60 3-7981 8800',N'service@techcare.my');

IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000128')
  INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,Tin,CustomerType,Area,Balance,AutoCountSynced,LastSyncAt) VALUES(N'CUST-000128',N'380-L001',N'Lim Wei Jie',N'Lim Wei Jie',N'+60 16-778 8990',N'wei.jie.lim@gmail.com',N'IG12345678010',N'RETAIL',N'KUALA LUMPUR',180,1,'2026-08-12T10:12:00');
IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000127')
  INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,Balance,AutoCountSynced,LastSyncAt) VALUES(N'CUST-000127',N'380-S001',N'Siti Nur Aisyah',N'Siti Nur Aisyah',N'+60 12-345 6789',N'siti.aisyah@gmail.com',N'RETAIL',N'SELANGOR',0,1,'2026-08-12T09:40:00');
IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000126')
  INSERT dbo.Customers(CustomerId,CompanyName,ContactName,Mobile,Email,CustomerType,Area,Balance,AutoCountSynced) VALUES(N'CUST-000126',N'Ahmad Faizal',N'Ahmad Faizal',N'+60 12-345 6789',N'ahmad.faizal@gmail.com',N'RETAIL',N'KUALA LUMPUR',250,0);
IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId=N'CUST-000125')
  INSERT dbo.Customers(CustomerId,DebtorAccount,CompanyName,ContactName,Mobile,Email,CustomerType,Area,Balance,AutoCountSynced,LastSyncAt) VALUES(N'CUST-000125',N'380-F001',N'Farah Nadia',N'Farah Nadia',N'+60 11-2088 7741',N'farah.nadia@gmail.com',N'RETAIL',N'SELANGOR',0,1,'2026-08-11T16:22:00');

IF NOT EXISTS (SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260812-001')
  INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DueDate,DiagnosticFee) VALUES(N'SR-20260812-001',N'CUST-000126',N'Dell',N'Inspiron 15',N'Laptop slow and overheating',N'Waiting Approval',N'Unassigned','2026-08-12','2026-08-14',250);
IF NOT EXISTS (SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260812-002')
  INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DueDate,DiagnosticFee) VALUES(N'SR-20260812-002',N'CUST-000128',N'ASUS',N'VivoBook 14',N'Keyboard not working',N'Repairing',N'Rizal','2026-08-12','2026-08-15',180);
IF NOT EXISTS (SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260812-004')
  INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DueDate,DiagnosticFee) VALUES(N'SR-20260812-004',N'CUST-000125',N'Apple',N'MacBook Air M1',N'Trackpad not responsive',N'Ready for Collection',N'Nur Aisyah','2026-08-12','2026-08-12',0);
IF NOT EXISTS (SELECT 1 FROM dbo.Repairs WHERE RepairNo=N'SR-20260811-097')
  INSERT dbo.Repairs(RepairNo,CustomerId,Brand,Model,IssueDescription,RepairStatus,Technician,ReceivedAt,DueDate,DiagnosticFee) VALUES(N'SR-20260811-097',N'CUST-000127',N'Acer',N'Aspire 5',N'Broken display panel',N'Received',N'Unassigned','2026-08-11','2026-08-17',0);

IF NOT EXISTS (SELECT 1 FROM dbo.Suppliers WHERE SupplierId=N'SUP-001')
  INSERT dbo.Suppliers(SupplierId,CompanyName,ContactName,Phone,Email,CreditTerm) VALUES(N'SUP-001',N'ASUS Malaysia',N'Warranty Department',N'+60 3-2241 5151',N'service@asus.com',N'30 Days');
IF NOT EXISTS (SELECT 1 FROM dbo.Suppliers WHERE SupplierId=N'SUP-002')
  INSERT dbo.Suppliers(SupplierId,CompanyName,ContactName,Phone,Email,CreditTerm) VALUES(N'SUP-002',N'SNS Network',N'Service Centre',N'+60 5-242 4610',N'support@sns.com.my',N'30 Days');

IF NOT EXISTS (SELECT 1 FROM dbo.WarrantyClaims WHERE WarrantyId=N'WR-260812-018')
  INSERT dbo.WarrantyClaims(WarrantyId,RepairNo,SupplierId,ClaimStatus,Notes) VALUES(N'WR-260812-018',N'SR-20260812-002',N'SUP-001',N'Preparation',N'Prepare device and supplier documents.');
