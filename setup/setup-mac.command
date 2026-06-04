#!/usr/bin/env bash
set -u

cd "$(dirname "$0")/.."

clear
echo ""
echo "============================================"
echo " Configurar Projetos GitHub"
echo "============================================"
echo ""
echo "Este assistente configura o site na sua copia."
echo "Ele vai pedir seu username, atualizar js/config.js,"
echo "fazer commit, enviar para o GitHub e tentar ativar Pages."
echo ""

if ! command -v git >/dev/null 2>&1; then
  echo "Git nao foi encontrado."
  echo "Instale em: https://git-scm.com/downloads"
  echo "Depois abra este arquivo novamente."
  read -r -p "Pressione Enter para sair..."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) nao foi encontrado."
  echo ""
  echo "Tutorial rapido:"
  echo "1. Instale: https://cli.github.com/"
  echo "   Alternativa com Homebrew: brew install gh"
  echo "2. Abra o Terminal nesta pasta."
  echo "3. Rode: gh auth login"
  echo "4. Escolha GitHub.com, HTTPS e autentique pelo navegador."
  echo "5. Abra este arquivo novamente."
  read -r -p "Pressione Enter para sair..."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI instalado, mas ainda nao autenticado."
  echo ""
  echo "Tutorial rapido:"
  echo "1. Rode: gh auth login"
  echo "2. Escolha GitHub.com"
  echo "3. Escolha HTTPS"
  echo "4. Autentique pelo navegador"
  echo "5. Abra este arquivo novamente."
  read -r -p "Pressione Enter para sair..."
  exit 1
fi

echo "GitHub CLI instalado e autenticado."
echo ""
read -r -p "Digite seu username do GitHub: " GITHUB_USERNAME
read -r -p "URL da foto ou caminho de arquivo local (opcional, Enter para pular): " PROFILE_IMAGE_INPUT

if [ -z "$GITHUB_USERNAME" ]; then
  echo "Username vazio. Tente novamente."
  read -r -p "Pressione Enter para sair..."
  exit 1
fi

if [ ! -f "js/config.js" ]; then
  echo "Nao encontrei js/config.js."
  echo "Rode este arquivo na raiz do projeto clonado da sua copia."
  read -r -p "Pressione Enter para sair..."
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true)"
REPO_NAME="projetos-github-pages"
if [ -n "$REPO" ]; then
  REPO_NAME="${REPO#*/}"
fi

export REPO_NAME
export GITHUB_USERNAME
PROFILE_IMAGE_URL=""

if [ -n "$PROFILE_IMAGE_INPUT" ]; then
  case "$PROFILE_IMAGE_INPUT" in
    http://*|https://*)
      PROFILE_IMAGE_URL="$PROFILE_IMAGE_INPUT"
      ;;
    *)
      if [ -f "$PROFILE_IMAGE_INPUT" ]; then
        mkdir -p assets/profile
        FILE_NAME="$(basename "$PROFILE_IMAGE_INPUT")"
        EXTENSION="${FILE_NAME##*.}"
        EXTENSION="$(printf '%s' "$EXTENSION" | tr '[:upper:]' '[:lower:]')"

        case "$EXTENSION" in
          jpg|jpeg|png|webp|gif)
            ;;
          *)
            EXTENSION="png"
            ;;
        esac

        cp "$PROFILE_IMAGE_INPUT" "assets/profile/profile.$EXTENSION"
        PROFILE_IMAGE_URL="assets/profile/profile.$EXTENSION"
      else
        echo "Foto nao encontrada. Vou continuar sem foto."
      fi
      ;;
  esac
fi

export PROFILE_IMAGE_URL
perl -0pi -e 's/githubUsername:\s*"[^"]+"/githubUsername: "$ENV{GITHUB_USERNAME}"/' js/config.js
perl -0pi -e 's/repoName:\s*"[^"]*"/repoName: "$ENV{REPO_NAME}"/' js/config.js
perl -0pi -e 's/siteTitle:\s*"[^"]+"/siteTitle: "Projetos GitHub de $ENV{GITHUB_USERNAME}"/' js/config.js
perl -0pi -e 's/profileImageUrl:\s*"[^"]*"/profileImageUrl: "$ENV{PROFILE_IMAGE_URL}"/' js/config.js
perl -0pi -e 's/encryptedToken:\s*"[^"]*"/encryptedToken: ""/' js/config.js
perl -0pi -e 's/encryptedGroqKey:\s*"[^"]*"/encryptedGroqKey: ""/' js/config.js

if [ $? -ne 0 ]; then
  echo "Nao foi possivel atualizar js/config.js."
  read -r -p "Pressione Enter para sair..."
  exit 1
fi

git status --short
git add js/config.js assets/profile 2>/dev/null || git add js/config.js
if ! git commit -m "Configure projects site for $GITHUB_USERNAME"; then
  echo ""
  echo "Nenhuma mudanca nova para commitar ou houve um erro no commit."
fi

if ! git push; then
  echo ""
  echo "Nao foi possivel fazer push."
  echo "Confirme se voce clonou a sua copia e tem permissao de escrita."
  read -r -p "Pressione Enter para sair..."
  exit 1
fi

if [ -n "$REPO" ]; then
  if ! gh api "repos/$REPO/pages" >/dev/null 2>&1; then
    gh api --method POST "repos/$REPO/pages" -F 'source[branch]=main' -F 'source[path]=/' >/dev/null 2>&1 || true
  fi

  echo ""
  echo "Pronto. Seu site ficara disponivel em:"
  echo "https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
fi

echo ""
echo "Configuracao finalizada."
read -r -p "Pressione Enter para sair..."
