$ErrorActionPreference = "Stop"
$logFile = "C:\Users\shrin\OneDrive\Desktop\intership brech\Backend\mysql-reset-log-v3.txt"
$myIni = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
$myIniBak = "$myIni.bak"
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$mysqldExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"

Function Log-Message($msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $msg"
    $entry | Out-File -FilePath $logFile -Append -Encoding UTF8
    Write-Host $entry
}

try {
    if (Test-Path $logFile) { Remove-Item $logFile -Force }
    Log-Message "=== MySQL Password Reset v3 ==="

    # Step 1: Restore my.ini if a backup exists (from previous failed attempt)
    if (Test-Path $myIniBak) {
        Log-Message "Restoring my.ini from backup..."
        Copy-Item $myIniBak $myIni -Force
        Remove-Item $myIniBak -Force
    }

    # Step 2: Stop the MySQL service
    Log-Message "Stopping MySQL80 service..."
    try { Stop-Service -Name "MySQL80" -Force } catch { Log-Message "Service stop warning: $($_.Exception.Message)" }
    Start-Sleep -Seconds 5

    # Also kill any leftover mysqld processes
    Log-Message "Killing any leftover mysqld processes..."
    Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3

    # Step 3: Start mysqld directly (NOT as service) with skip-grant-tables
    Log-Message "Starting mysqld directly with --skip-grant-tables..."
    $proc = Start-Process -FilePath $mysqldExe `
        -ArgumentList "--defaults-file=`"$myIni`"", "--skip-grant-tables", "--shared-memory", "--console" `
        -PassThru -WindowStyle Hidden
    Log-Message "mysqld started with PID $($proc.Id). Waiting 10 seconds..."
    Start-Sleep -Seconds 10

    # Check if the process is still running
    if ($proc.HasExited) {
        Log-Message "ERROR: mysqld exited prematurely with code $($proc.ExitCode)"
        throw "mysqld failed to start"
    }
    Log-Message "mysqld is running."

    # Step 4: Connect and reset password
    Log-Message "Connecting and resetting password..."
    $resetSQL = "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
    & $mysqlExe -u root -e $resetSQL 2>&1 | ForEach-Object { Log-Message "mysql: $_" }
    Log-Message "Password reset command executed."

    # Step 5: Stop the temporary mysqld
    Log-Message "Stopping temporary mysqld (PID $($proc.Id))..."
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5

    # Step 6: Start the normal service
    Log-Message "Starting MySQL80 service normally..."
    Start-Service -Name "MySQL80"
    Start-Sleep -Seconds 5

    # Step 7: Verify
    Log-Message "Verifying connection with new password..."
    $result = & $mysqlExe -u root -proot -e "SELECT 'CONNECTION_OK' AS status;" 2>&1
    $resultStr = $result | Out-String
    Log-Message "Verification result: $resultStr"

    if ($resultStr -match "CONNECTION_OK") {
        Log-Message "SUCCESS! Password is now 'root'. MySQL is working."
    } else {
        Log-Message "WARNING: Verification returned unexpected result."
    }
} catch {
    Log-Message "FATAL ERROR: $($_.Exception.Message)"

    # Try to restart normal service anyway
    try {
        Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        Start-Service -Name "MySQL80" -ErrorAction SilentlyContinue
        Log-Message "MySQL80 service restarted."
    } catch {
        Log-Message "Could not restart service: $($_.Exception.Message)"
    }
}

Log-Message "Done. Window closes in 10 seconds..."
Start-Sleep -Seconds 10
