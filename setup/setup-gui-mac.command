#!/usr/bin/env bash
set -u

cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  clear
  echo ""
  echo "Node.js nao foi encontrado."
  echo "Instale em: https://nodejs.org/"
  echo "Depois abra este arquivo novamente."
  echo ""
  read -r -p "Pressione Enter para sair..."
  exit 1
fi

node setup/gui/server.js
