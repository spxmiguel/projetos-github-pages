@echo off
setlocal
title Setup visual - Projetos GitHub
cd /d "%~dp0\.."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js nao foi encontrado.
  echo Instale em: https://nodejs.org/
  echo Depois rode este arquivo novamente.
  echo.
  pause
  exit /b 1
)

node setup\gui\server.js
pause
