@echo off
chcp 65001 > nul
title MG SOLUTIONS ERP - Ejecución Local (Frontend + Backend)

echo ===================================================
echo     MG SOLUTIONS ERP - INICIO DEL SISTEMA
echo ===================================================
echo.

cd /d "%~dp0"

echo 1. Limpiando puertos 3000 y 4000 para evitar conflictos...
call npm run clean:ports

echo.
echo 2. Iniciando Servidor Backend (Express :4000) y Frontend (Vite :3000)...
echo    Presione CTRL+C en esta ventana cuando desee apagar ambos servicios.
echo.

start http://localhost:3000

call npm run dev:all

pause
