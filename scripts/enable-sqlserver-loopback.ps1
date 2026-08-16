$ErrorActionPreference = "Stop"

$tcpPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.UK2026\MSSQLServer\SuperSocketNetLib\Tcp"
$loopbackPath = Join-Path $tcpPath "IP11"

Set-ItemProperty -LiteralPath $tcpPath -Name Enabled -Value 1
Set-ItemProperty -LiteralPath $tcpPath -Name ListenOnAllIPs -Value 0
Set-ItemProperty -LiteralPath $loopbackPath -Name Enabled -Value 1
Set-ItemProperty -LiteralPath $loopbackPath -Name TcpDynamicPorts -Value ""
Set-ItemProperty -LiteralPath $loopbackPath -Name TcpPort -Value "14330"

Restart-Service -Name 'MSSQL$UK2026' -Force
