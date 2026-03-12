@echo off
echo.
echo ============================================
echo   Affiliate Courses Platform - Setup
echo ============================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed. Get it from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js detected: 
node -v

echo.
echo [1/4] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (echo [ERROR] npm install failed && pause && exit /b 1)

echo.
echo [2/4] Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% neq 0 (echo [ERROR] Prisma generate failed && pause && exit /b 1)

echo.
echo [3/4] Creating database...
call npx prisma migrate dev --name init
if %ERRORLEVEL% neq 0 (echo [ERROR] Migration failed && pause && exit /b 1)

echo.
echo [4/4] Seeding database...
call npx ts-node prisma/seed.ts
if %ERRORLEVEL% neq 0 (echo [ERROR] Seed failed && pause && exit /b 1)

echo.
echo ============================================
echo   SETUP COMPLETE! Run: npm run dev
echo   Server: http://localhost:3000
echo   Admin:  admin@platform.com / Admin@123456
echo ============================================
pause
