@echo off
echo ========================================
echo   Starting Syncra ERP Database...
echo ========================================
echo.
echo Starting PostgreSQL container...
docker-compose up -d postgres
echo.
echo Database is running in the background.
echo You can stop it later with: docker-compose down
echo ========================================
pause
