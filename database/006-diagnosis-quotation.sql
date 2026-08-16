IF COL_LENGTH('dbo.Diagnosis','QuotationJson') IS NULL ALTER TABLE dbo.Diagnosis ADD QuotationJson nvarchar(max) NULL;
