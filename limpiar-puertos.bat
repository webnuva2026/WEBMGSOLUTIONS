@echo off
chcp 65001 > nul
title MG SOLUTIONS - Limpiador de Puertos 3000 y 4000

cd /d "%~dp0"

node scripts/clean-ports.js

echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause > nul
