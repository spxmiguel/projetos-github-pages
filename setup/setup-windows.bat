@echo off
setlocal enabledelayedexpansion
title Configurar Projetos GitHub

echo.
echo ============================================
echo  Configurar Projetos GitHub
echo ============================================
echo.
echo Este assistente configura o site na sua copia.
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
set /p "GITHUB_USERNAME=Digite seu username do GitHub: "
set /p "PROFILE_IMAGE_INPUT=URL da foto ou caminho de arquivo local (opcional, Enter para pular): "

if "%GITHUB_USERNAME%"=="" (
  echo Username vazio. Tente novamente.
  pause
  exit /b 1
)

if not exist "js\config.js" (
  echo Nao encontrei js\config.js.
  echo Rode este arquivo na raiz do projeto clonado da sua copia.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$path='js/config.js'; $q=[char]34; $username=$env:GITHUB_USERNAME; $imageInput=$env:PROFILE_IMAGE_INPUT; $imageUrl=''; if ($imageInput) { if ($imageInput -match '^https?://') { $imageUrl=$imageInput } elseif (Test-Path -LiteralPath $imageInput -PathType Leaf) { New-Item -ItemType Directory -Force -Path 'assets/profile' | Out-Null; $ext=[IO.Path]::GetExtension($imageInput).TrimStart('.').ToLowerInvariant(); if ($ext -notin @('jpg','jpeg','png','webp','gif')) { $ext='png' }; $target='assets/profile/profile.' + $ext; Copy-Item -LiteralPath $imageInput -Destination $target -Force; $imageUrl=$target } else { Write-Host 'Foto nao encontrada. Vou continuar sem foto.' } }; $content=Get-Content $path -Raw; $content=$content -replace ('githubUsername:\s*' + $q + '[^' + $q + ']+' + $q), ('githubUsername: ' + $q + $username + $q); $content=$content -replace ('siteTitle:\s*' + $q + '[^' + $q + ']+' + $q), ('siteTitle: ' + $q + 'Projetos GitHub de ' + $username + $q); $content=$content -replace ('profileImageUrl:\s*' + $q + '[^' + $q + ']*' + $q), ('profileImageUrl: ' + $q + $imageUrl + $q); Set-Content -Path $path -Value $content -Encoding UTF8"
if errorlevel 1 (
  echo Nao foi possivel atualizar js\config.js.
  pause
  exit /b 1
)

git status --short
git add js/config.js assets/profile 2>nul
if errorlevel 1 git add js/config.js
git commit -m "Configure projects site for %GITHUB_USERNAME%"
if errorlevel 1 (
  echo.
  echo Nenhuma mudanca nova para commitar ou houve um erro no commit.
)

git push
if errorlevel 1 (
  echo.
  echo Nao foi possivel fazer push.
  echo Confirme se voce clonou a sua copia e tem permissao de escrita.
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
