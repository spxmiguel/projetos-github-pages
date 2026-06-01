# Portfólio GitHub estático

Site estático pronto para GitHub Pages que lista automaticamente os repositórios públicos de um usuário, detecta GitHub Pages ou homepage, mostra link para README e cria botões de download para assets oficiais de releases Windows/Mac.

Usuário padrão: `spxmiguel`.

## Estrutura

```text
.
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── config.js
    └── github.js
```

## Como trocar o GitHub username

Edite `js/config.js`:

```js
window.PORTFOLIO_CONFIG = {
  githubUsername: "seu-usuario",
  siteTitle: "Meu Portfólio GitHub",
  siteDescription: "Minha vitrine de projetos.",
  includeForks: false,
  includeArchived: true,
  sortBy: "updated",
};
```

Depois salve, faça commit e envie para o GitHub.

## Configuração automática para quem fez fork

Depois de fazer fork e clonar o seu fork, você pode usar um dos assistentes:

- Windows: execute `setup/setup-windows.bat`
- macOS: execute `setup/setup-mac.command`

O assistente pede seu username do GitHub, confere se `gh` está instalado e autenticado, atualiza `js/config.js`, faz commit, envia para o GitHub e tenta ativar o GitHub Pages na branch `main`.

Se `gh` não estiver instalado ou autenticado, o próprio assistente mostra o tutorial curto:

```bash
gh auth login
```

Escolha `GitHub.com`, `HTTPS` e autentique pelo navegador.

## Como hospedar no GitHub Pages

1. Publique este projeto em um repositório no GitHub.
2. No GitHub, abra `Settings` > `Pages`.
3. Em `Build and deployment`, selecione `Deploy from a branch`.
4. Escolha a branch `main` e a pasta `/root`.
5. Salve. O GitHub vai publicar o site em alguns minutos.

Também é possível ativar via GitHub CLI:

```bash
gh repo create nome-do-repo --public --source=. --remote=origin --push
gh api --method POST repos/SEU_USUARIO/nome-do-repo/pages -f source.branch=main -f source.path=/
```

## Como adicionar novos projetos e releases

O site não precisa de backend nem etapa de build. Ele consulta a GitHub API diretamente no navegador.

Para adicionar um projeto:

1. Crie um novo repositório público na conta configurada.
2. Preencha a descrição do repositório no GitHub.
3. Opcionalmente ative GitHub Pages ou configure o campo `Homepage`.
4. Recarregue o portfólio. O projeto aparecerá automaticamente.

Para adicionar downloads:

1. Abra o repositório do projeto no GitHub.
2. Crie uma release oficial em `Releases`.
3. Anexe assets com nomes identificáveis, como `meu-app-windows.exe`, `meu-app-win.msi`, `meu-app-macos.dmg` ou `meu-app-mac.pkg`.
4. Recarregue o portfólio. Os botões `Baixar Windows` e/ou `Baixar Mac` aparecerão automaticamente.

## Observações

- A API pública do GitHub tem limite de requisições sem autenticação. Em uso normal no GitHub Pages isso costuma ser suficiente, mas muitos repositórios podem consumir o limite mais rápido.
- Repositórios privados não aparecem.
- Por padrão forks ficam ocultos. Altere `includeForks` em `js/config.js` se quiser exibi-los.
