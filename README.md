# Projetos GitHub estático

Site estático pronto para GitHub Pages que lista automaticamente os repositórios públicos de um usuário, detecta GitHub Pages ou homepage, mostra link para README e cria botões de download para assets oficiais de releases Windows/Mac.

Usuário padrão: `spxmiguel`.

## Como fazer o seu

### 1. Baixe o pacote

No site publicado, clique em:

```text
Quer ter o seu também? Clique aqui
```

Isso baixa o arquivo `projetos-github-pages-setup.zip`.

O site detecta seu sistema e baixa automaticamente o pacote certo:

- Windows: `projetos-github-pages-windows.zip`
- macOS: `projetos-github-pages-mac.zip`
- Linux: `projetos-github-pages-linux.zip`

Se a detecção estiver errada, a janela de instruções tem a opção `Detecção de OS errado? Escolha o certo`. Clique em Windows, macOS ou Linux para baixar o pacote correto e ver as instruções certas.

Extraia o ZIP baixado em uma pasta do seu computador.

### 2. Instale o que precisa

Você precisa ter:

- Git: https://git-scm.com/downloads
- Node.js: https://nodejs.org/
- GitHub CLI (`gh`): https://cli.github.com/

Depois de instalar o GitHub CLI, autentique:

```bash
gh auth login
```

Escolha `GitHub.com`, `HTTPS` e autentique pelo navegador.

### 3. Abra o setup visual

Escolha um dos três métodos dentro da pasta extraída:

**Windows**

Abra com dois cliques:

```text
setup/setup-gui-windows.bat
```

**macOS**

Abra com dois cliques:

```text
setup/setup-gui-mac.command
```

Se o macOS bloquear por segurança, clique com botão direito no arquivo, escolha `Abrir`, e confirme.

**Universal: Linux, macOS ou Windows**

Rode no terminal, dentro da pasta extraída:

```bash
node setup/setup-gui-universal.js
```

### 4. Preencha a tela

Na tela que abrir no navegador:

1. Coloque seu username do GitHub.
2. Escolha o nome do repositório que será criado.
3. Escolha o nome do site.
4. Escreva uma descrição.
5. Opcionalmente coloque uma foto por link ou anexe uma imagem do computador.
6. Clique em `Salvar e pushar projeto`.

O setup vai atualizar `js/config.js`, copiar sua imagem para `assets/profile/` se você anexar uma foto, iniciar Git se a pasta ainda não for um repositório, criar um repositório novo no seu GitHub se não houver remoto, fazer commit, dar push e tentar ativar o GitHub Pages.

### 5. Abra seu site

Depois do push, o site ficará em:

```text
https://seu-usuario.github.io/nome-do-repositorio/
```

### 6. Alternativa: usar template pelo GitHub

Se preferir o caminho manual:

1. Abra este repositório no GitHub.
2. Clique em `Use this template`.
3. Escolha `Create a new repository`.
4. Clone o repositório criado.
5. Rode o setup visual dentro da pasta clonada.

### 7. Como novos projetos aparecem

Crie ou atualize repositórios públicos na sua conta GitHub. O site puxa tudo pela GitHub API, então novos projetos e releases aparecem automaticamente quando a página carrega.

Para evitar limite da GitHub API, o navegador guarda um cache local por usuário por 24 horas. Se a API limitar as requisições, o site tenta mostrar o último cache salvo em vez de ficar vazio.

## Estrutura

```text
.
├── index.html
├── css/
│   └── styles.css
├── assets/
│   └── profile/
├── js/
│   ├── app.js
│   ├── config.js
│   └── github.js
└── setup/
    ├── setup-gui-mac.command
    ├── setup-gui-windows.bat
    ├── setup-gui-universal.js
    └── gui/
```

## Como trocar o GitHub username

Edite `js/config.js`:

```js
window.PORTFOLIO_CONFIG = {
  githubUsername: "seu-usuario",
  siteTitle: "Meus Projetos GitHub",
  siteDescription: "Minha vitrine de projetos.",
  profileImageUrl: "https://github.com/seu-usuario.png",
  forkUrl: "https://github.com/spxmiguel/projetos-github-pages/releases/latest/download/projetos-github-pages-setup.zip",
  ctaMode: "fineprint",
  includeForks: false,
  includeArchived: true,
  sortBy: "updated",
};
```

Depois salve, faça commit e envie para o GitHub.

`profileImageUrl` é opcional. Deixe vazio (`""`) para não mostrar foto, use uma URL pública como `https://github.com/seu-usuario.png`, ou coloque uma imagem dentro do projeto e use caminho relativo, como `assets/profile/profile.png`.

`ctaMode` controla o botão `Quer ter o seu também? Clique aqui`:

- `"top"`: mostra como botão no topo.
- `"fineprint"`: esconde no fim da página como texto pequeno.
- `"hidden"`: oculta completamente.

## Configuração automática para sua cópia

Depois de criar sua cópia e clonar o repositório, você pode usar um dos assistentes abaixo. Para a maioria das pessoas, recomendo o setup visual.

- Setup visual Windows: execute `setup/setup-gui-windows.bat`
- Setup visual macOS: execute `setup/setup-gui-mac.command`
- Setup visual universal: rode `node setup/setup-gui-universal.js`
- Windows: execute `setup/setup-windows.bat`
- macOS: execute `setup/setup-mac.command`

O setup visual abre uma tela no navegador para mudar o nome do site, colocar o username do GitHub, informar uma URL de foto, anexar uma imagem do computador e por fim salvar, commitar, fazer push e tentar ativar o GitHub Pages na branch `main`.

Os três métodos do setup visual fazem a mesma coisa. Use o `.bat` no Windows, o `.command` no macOS, ou o comando universal em qualquer sistema com Node.js instalado:

```bash
node setup/setup-gui-universal.js
```

Os assistentes simples de terminal pedem seu username do GitHub, permitem informar uma URL de foto ou anexar uma imagem local pelo caminho do arquivo, conferem se `gh` está instalado e autenticado, atualizam `js/config.js`, fazem commit, enviam para o GitHub e tentam ativar o GitHub Pages.

Para usar o setup visual, você também precisa ter Node.js instalado:

```bash
node --version
```

Se não tiver, instale em https://nodejs.org/.

Se você informar um caminho local de imagem, como `C:\Users\voce\Pictures\foto.png` ou `/Users/voce/Pictures/foto.png`, o assistente copia o arquivo para `assets/profile/` e publica junto no GitHub. Caminho local direto não funciona no GitHub Pages sem essa cópia, porque o site fica hospedado na web.

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
4. Recarregue o site. O projeto aparecerá automaticamente.

Para adicionar downloads:

1. Abra o repositório do projeto no GitHub.
2. Crie uma release oficial em `Releases`.
3. Anexe assets com nomes identificáveis, como `meu-app-windows.exe`, `meu-app-win.msi`, `meu-app-macos.dmg` ou `meu-app-mac.pkg`.
4. Recarregue o site. Os botões `Baixar Windows` e/ou `Baixar Mac` aparecerão automaticamente.

## Observações

- A API pública do GitHub tem limite de requisições sem autenticação. Em uso normal no GitHub Pages isso costuma ser suficiente, mas muitos repositórios podem consumir o limite mais rápido.
- O site usa cache local de 24 horas por conta GitHub para reduzir chamadas na API.
- Repositórios privados não aparecem.
- Por padrão forks ficam ocultos. Altere `includeForks` em `js/config.js` se quiser exibi-los.
