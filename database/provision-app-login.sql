USE master;
IF SUSER_ID(N'techcare_app') IS NULL
  CREATE LOGIN techcare_app WITH PASSWORD=N'TcR_2026!9xQ#7mLp2Vb', CHECK_POLICY=ON, CHECK_EXPIRATION=OFF;
ELSE
  ALTER LOGIN techcare_app WITH PASSWORD=N'TcR_2026!9xQ#7mLp2Vb';

USE TechCareRepair;
IF USER_ID(N'techcare_app') IS NULL
  CREATE USER techcare_app FOR LOGIN techcare_app;

IF IS_ROLEMEMBER(N'db_datareader',N'techcare_app') <> 1
  ALTER ROLE db_datareader ADD MEMBER techcare_app;
IF IS_ROLEMEMBER(N'db_datawriter',N'techcare_app') <> 1
  ALTER ROLE db_datawriter ADD MEMBER techcare_app;
