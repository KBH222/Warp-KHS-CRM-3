@echo off
REM Creates timestamped backup on Windows

FOR /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') DO SET "dt=%%a"
SET "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
SET "BACKUP_NAME=khs-crm-backup-%TIMESTAMP%"

REM Create backup directory
IF NOT EXIST ..\backups mkdir ..\backups

REM Create the backup using tar (Windows 10+ has tar)
echo Creating backup: %BACKUP_NAME%.tar.gz
tar -czf "..\backups\%BACKUP_NAME%.tar.gz" ^
  --exclude=node_modules ^
  --exclude=.git ^
  --exclude=dist ^
  --exclude=build ^
  --exclude=*.log ^
  .

echo Backup created at: ..\backups\%BACKUP_NAME%.tar.gz
echo.
echo All backups:
dir ..\backups\*.tar.gz