@echo off
cd /d %~dp0

echo Server baslatiliyor...

start "Vite Server" cmd /k npm run dev -- --host

echo Bekleniyor...
timeout /t 5 >nul

echo Tarayici aciliyor...
start http://localhost:5173