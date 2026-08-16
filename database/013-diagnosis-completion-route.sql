IF COL_LENGTH('dbo.Diagnosis','TechnicalCheckRemark') IS NULL
  ALTER TABLE dbo.Diagnosis ADD TechnicalCheckRemark nvarchar(max) NULL;
GO

IF COL_LENGTH('dbo.Diagnosis','IsDiagnosisCompleted') IS NULL
  ALTER TABLE dbo.Diagnosis ADD IsDiagnosisCompleted bit NOT NULL CONSTRAINT DF_Diagnosis_Completed DEFAULT 0;
GO

IF COL_LENGTH('dbo.Diagnosis','CompletionRoute') IS NULL
  ALTER TABLE dbo.Diagnosis ADD CompletionRoute nvarchar(60) NULL;
GO

UPDATE dbo.Diagnosis SET IsDiagnosisCompleted=1,CompletionRoute=N'Prepare Quotation' WHERE IsQuotationReady=1 AND IsDiagnosisCompleted=0;
GO
