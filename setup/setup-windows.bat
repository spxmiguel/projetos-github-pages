@echo off
setlocal enabledelayedexpansion
title Configurar Portfolio GitHub

echo.
echo ============================================
echo  Configurar Portfolio GitHub
echo ============================================
echo.
echo Este assistente configura o portfolio no seu fork.
echo Ele vai pedir seu username, atualizar js\config.js,
echo fazer commit, enviar para o GitHub e tentar ativar Pages.
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git nao foi encontrado.
  echo Instale em: https://git-scm.com/downloads
  echo Depois feche esta janela, abra de novo e rode este arquivo novamente.
  pause
  exit /b 1
)

where gh >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI ^(gh^) nao foi encontrado.
  echo.
  echo Tutorial rapido:
  echo 1. Instale: https://cli.github.com/
  echo 2. Abra o Prompt de Comando nesta pasta.
  echo 3. Rode: gh auth login
  echo 4. Escolha GitHub.com, HTTPS e autentique pelo navegador.
  echo 5. Rode este arquivo novamente.
  pause
  exit /b 1
)

gh auth status >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI instalado, mas ainda nao autenticado.
  echo.
  echo Tutorial rapido:
  echo 1. Rode: gh auth login
  echo 2. Escolha GitHub.com
  echo 3. Escolha HTTPS
  echo 4. Autentique pelo navegador
  echo 5. Rode este arquivo novamente.
  pause
  exit /b 1
)

echo GitHub CLI instalado e autenticado.
echo.
set /p GITHUB_USERNAME=Digite seu username do GitHub: 

if "%GITHUB_USERNAME%"=="" (
  echo Username vazio. Tente novamente.
  pause
  exit /b 1
)

if not exist "js\config.js" (
  echo Nao encontrei js\config.js.
  echo Rode este arquivo na raiz do projeto clonado do seu fork.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$path='js/config.js'; $content=Get-Content $path -Raw; $content=$content -replace 'githubUsername:\s*\"[^\"]+\"', 'githubUsername: \"%GITHUB_USERNAME%\"'; $content=$content -replace 'siteTitle:\s*\"[^\"]+\"', 'siteTitle: \"Portfolio GitHub de %GITHUB_USERNAME%\"'; Set-Content -Path $path -Value $content -Encoding UTF8"
if errorlevel 1 (
  echo Nao foi possivel atualizar js\config.js.
  pause
  exit /b 1
)

git status --short
git add js/config.js
git commit -m "Configure portfolio for %GITHUB_USERNAME%"
if errorlevel 1 (
  echo.
  echo Nenhuma mudanca nova para commitar ou houve um erro no commit.
)

git push
if errorlevel 1 (
  echo.
  echo Nao foi possivel fazer push.
  echo Confirme se voce clonou o seu fork e tem permissao de escrita.
  pause
  exit /b 1
)

for /f "tokens=*" %%r in ('gh repo view --json nameWithOwner --jq ".nameWithOwner"') do set REPO=%%r
for /f "tokens=1,2 delims=/" %%a in ("%REPO%") do set REPO_NAME=%%b
if not "%REPO%"=="" (
  gh api repos/%REPO%/pages >nul 2>nul
  if errorlevel 1 (
    gh api --method POST repos/%REPO%/pages -F "source[branch]=main" -F "source[path]=/" >nul 2>nul
  )
  echo.
  echo Pronto. Seu site ficara disponivel em:
  echo https://%GITHUB_USERNAME%.github.io/!REPO_NAME!/
)

echo.
echo Configuracao finalizada.
pause
