@echo off
setlocal
title Mnemosyne Setup

echo ==========================================
echo           Mnemosyne Setup
echo ==========================================
echo This script will configure your secrets and node.
echo.

:: 1. RPC_SECRET
echo [1/5] Cluster RPC Secret
echo This is the shared password for the entire cluster.
echo Leave blank to generate a new secure key.
set /p RPC_SECRET="Enter RPC_SECRET: "

if "%RPC_SECRET%"=="" (
    for /f "delims=" %%i in ('powershell -Command "[convert]::ToHexString((Get-Random -Count 32 -InputObject (0..255)))"') do set RPC_SECRET=%%i
    echo Generated: %RPC_SECRET%
)
echo.

:: 2. ADMIN_TOKEN
echo [2/5] Admin Token
echo Password for the Web Dashboard.
set /p ADMIN_TOKEN="Enter ADMIN_TOKEN (blank to generate): "

if "%ADMIN_TOKEN%"=="" (
    for /f "delims=" %%i in ('powershell -Command "[convert]::ToHexString((Get-Random -Count 32 -InputObject (0..255)))"') do set ADMIN_TOKEN=%%i
    echo Generated: %ADMIN_TOKEN%
)
echo.

:: 3. TS_HOSTNAME
echo [3/5] Tailscale Hostname
echo Unique name for this device.
echo Default: %COMPUTERNAME%
set /p TS_HOSTNAME="Enter TS_HOSTNAME: "
if "%TS_HOSTNAME%"=="" set TS_HOSTNAME=%COMPUTERNAME%
echo Using: %TS_HOSTNAME%
echo.

:: 4. TS_AUTHKEY
echo [4/5] Tailscale Auth Key
echo Generate here: https://login.tailscale.com/admin/settings/keys
echo Tip: Check 'Reusable' to use on multiple devices.
echo Note: Keys expire. Dashboard will warn on disconnect.
set /p TS_AUTHKEY="Enter TS_AUTHKEY: "
echo.

:: 5. DATA_DIR
echo [5/6] Data Directory
echo Where to store the Vault data? (e.g. D:\MnemosyneData)
echo Default: ./data
set /p DATA_DIR="Enter DATA_DIR: "
if "%DATA_DIR%"=="" set DATA_DIR=./data
echo.

:: 6. S3_KEYS
echo [6/6] Cluster S3 Credentials
echo Required for Rclone.
echo - PRIMARY NODE: Leave blank.
echo - SECONDARY NODE: Paste from primary node .env.
set /p S3_ACCESS_KEY_ID="Enter S3_ACCESS_KEY_ID: "
set /p S3_SECRET_ACCESS_KEY="Enter S3_SECRET_ACCESS_KEY: "
echo.

echo Applying configuration...

:: Copy .env
if not exist .env copy .env.example .env

:: Use PowerShell for Safe File Replacement (Batch string replacement is dangerous with special chars)
powershell -Command "(Get-Content .env) -replace 'RPC_SECRET=.*', 'RPC_SECRET=%RPC_SECRET%' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'ADMIN_TOKEN=.*', 'ADMIN_TOKEN=%ADMIN_TOKEN%' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'TS_HOSTNAME=.*', 'TS_HOSTNAME=%TS_HOSTNAME%' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'TS_AUTHKEY=.*', 'TS_AUTHKEY=%TS_AUTHKEY%' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'DATA_DIR=.*', 'DATA_DIR=%DATA_DIR%' | Set-Content .env"

if not "%S3_ACCESS_KEY_ID%"=="" (
    powershell -Command "(Get-Content .env) -replace 'S3_ACCESS_KEY_ID=.*', 'S3_ACCESS_KEY_ID=%S3_ACCESS_KEY_ID%' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'S3_SECRET_ACCESS_KEY=.*', 'S3_SECRET_ACCESS_KEY=%S3_SECRET_ACCESS_KEY%' | Set-Content .env"
)

echo Updated .env

:: Update config.toml
if not exist config.toml copy config.toml.example config.toml
powershell -Command "(Get-Content config.toml) -replace 'replace_this_with_shared_32_byte_hex_secret', '%RPC_SECRET%' | Set-Content config.toml"
powershell -Command "(Get-Content config.toml) -replace 'REPLACE_WITH_RPC_SECRET_FROM_ENV_FILE', '%RPC_SECRET%' | Set-Content config.toml"
powershell -Command "(Get-Content config.toml) -replace 'REPLACE_WITH_ADMIN_TOKEN_FROM_ENV_FILE', '%ADMIN_TOKEN%' | Set-Content config.toml"

echo Updated config.toml

echo.
echo ==========================================
echo           Setup Complete!
echo ==========================================
echo.
echo NEXT STEPS:
echo 1. Start the stack:
echo    docker compose up -d --build
echo.
echo 2. Finalize Configuration (REQUIRED):
echo    - Get your IP: docker exec mnemosyne-net tailscale ip -4
echo    - Edit 'config.toml' -> replace '100.x.y.z' with that IP.
echo    - Restart: docker restart mnemosyne-store
echo.
echo 3. Connect Nodes (Run once per pair):
echo    - docker exec -it mnemosyne-store /garage node connect ^<OTHER_ID^>@^<OTHER_IP^>:3901
echo.
pause
