@echo off
echo ========================================
echo   Syncra ERP - Setup Script
echo   Where Inventory Meets Intelligence
echo ========================================

echo.
echo [1/3] Setting up backend database...
cd backend
call npm install
call npm run db:setup
cd ..

echo.
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Compiling blockchain contracts...
cd blockchain
call npm install
call npx hardhat compile
cd ..

echo.
echo ========================================
echo   Setup Complete!
echo.
echo   Start backend:  cd backend && npm run dev
echo   Start frontend: cd frontend && npm run dev
echo.
echo   Login: admin@shivfurniture.com / admin123
echo   URL:   http://localhost:3000
echo ========================================
pause
