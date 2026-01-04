@echo off
setlocal

set CMD=%1
set ARG=%2

if "%CMD%"=="" goto help
if "%CMD%"=="start" goto start
if "%CMD%"=="stop" goto stop
if "%CMD%"=="restart" goto restart
if "%CMD%"=="mount" goto mount
if "%CMD%"=="unmount" goto unmount
if "%CMD%"=="update" goto update
if "%CMD%"=="logs" goto logs

:help
echo Usage: mnemosyne.bat ^<command^> [args]
echo.
echo Commands:
echo   start           Start the cluster
echo   stop            Stop the cluster
echo   restart         Restart the cluster
echo   mount ^<drive^>   Mount to a Drive Letter (e.g. Z:)
echo   unmount ^<drive^> Unmount a Drive Letter (e.g. Z:) (or 'all' to clear)
echo   update          Pull latest code (RESET hard) and rebuild
echo   logs            View logs
goto :eof

:start
echo Starting Mnemosyne...
docker compose up -d --build --remove-orphans
goto :eof

:stop
echo Stopping Mnemosyne...
docker compose down
goto :eof

:restart
echo Restarting Mnemosyne...
docker compose restart
goto :eof

:mount
if "%ARG%"=="" (
    echo Error: Drive letter required. Example: mnemosyne mount Z:
    goto :eof
)
echo Mounting http://localhost:8080/archive to %ARG%...
net use %ARG% http://localhost:8080/archive /user:admin password
if errorlevel 1 (
    echo Failed to mount. Ensure WebClient service is running.
) else (
    echo Success! Mounted to %ARG%
)
goto :eof

:unmount
if "%ARG%"=="" (
    echo Error: Drive letter required. Example: mnemosyne unmount Z:
    goto :eof
)
if "%ARG%"=="all" (
    net use * /delete /yes
) else (
    net use %ARG% /delete
)
goto :eof

:update
echo WARNING: This will RESET your local code to match the remote repository.
echo Your .env and data/ folder will be preserved.
set /p CONFIRM="Are you sure? (y/N) "
if /i not "%CONFIRM%"=="y" goto :eof

echo Fetching latest code...
git fetch origin
git reset --hard origin/master
echo Rebuilding containers...
docker compose up -d --build --remove-orphans
echo Update Complete.
goto :eof

:logs
docker compose logs -f --tail=100
goto :eof
