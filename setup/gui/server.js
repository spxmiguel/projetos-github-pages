const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const guiRoot = __dirname;
const port = 4173;

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function tryRun(command, args) {
  try {
    return { ok: true, output: run(command, args) };
  } catch (error) {
    return {
      ok: false,
      output: [error.stdout, error.stderr, error.message].filter(Boolean).join("\n").trim(),
    };
  }
}

function sanitizeRepoName(value) {
  return (value || "projetos-github-pages")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "projetos-github-pages";
}

function getRemoteRepoName() {
  const remote = tryRun("git", ["remote", "get-url", "origin"]);

  if (!remote.ok || !remote.output) {
    return "";
  }

  const match = remote.output.match(/[:/]([^/]+?)(?:\.git)?$/);
  return match ? match[1] : "";
}

function isGitRepository() {
  const result = tryRun("git", ["rev-parse", "--is-inside-work-tree"]);
  return result.ok && result.output === "true";
}

function ensureGitRepository(log) {
  if (isGitRepository()) {
    log.push("Repositorio Git encontrado.");
    return;
  }

  const init = tryRun("git", ["init", "-b", "main"]);

  if (!init.ok) {
    const fallback = tryRun("git", ["init"]);

    if (!fallback.ok) {
      throw new Error(`Nao foi possivel iniciar Git:\n${fallback.output || init.output}`);
    }

    tryRun("git", ["checkout", "-B", "main"]);
  }

  log.push("Repositorio Git iniciado nesta pasta.");
}

function getCurrentBranch() {
  const branch = tryRun("git", ["branch", "--show-current"]);

  if (branch.ok && branch.output) {
    return branch.output;
  }

  tryRun("git", ["checkout", "-B", "main"]);
  return "main";
}

function ensureRemote(log, repoName) {
  const remote = tryRun("git", ["remote", "get-url", "origin"]);

  if (remote.ok && remote.output) {
    log.push("Remote origin encontrado.");
    return;
  }

  const create = tryRun("gh", ["repo", "create", repoName, "--public", "--source=.", "--remote=origin"]);

  if (!create.ok) {
    throw new Error(`Nao foi possivel criar o repositorio ${repoName}:\n${create.output}`);
  }

  log.push(`Repositorio criado no GitHub: ${repoName}`);
}

function readConfig() {
  const configPath = path.join(root, "js/config.js");
  const content = fs.readFileSync(configPath, "utf8");

  return {
    githubUsername: content.match(/githubUsername:\s*"([^"]*)"/)?.[1] || "",
    repoName: content.match(/repoName:\s*"([^"]*)"/)?.[1] || "projetos-github-pages",
    siteTitle: content.match(/siteTitle:\s*"([^"]*)"/)?.[1] || "",
    siteDescription: content.match(/siteDescription:\s*"([^"]*)"/)?.[1] || "",
    profileImageUrl: content.match(/profileImageUrl:\s*"([^"]*)"/)?.[1] || "",
    ctaMode: content.match(/ctaMode:\s*"([^"]*)"/)?.[1] || "top",
  };
}

function jsString(value) {
  return JSON.stringify(value || "");
}

function updateConfig({ githubUsername, repoName, siteTitle, siteDescription, profileImageUrl, ctaMode }) {
  const configPath = path.join(root, "js/config.js");
  let content = fs.readFileSync(configPath, "utf8");
  const safeCtaMode = ["top", "fineprint", "hidden"].includes(ctaMode) ? ctaMode : "top";

  content = content.replace(/githubUsername:\s*"[^"]*"/, `githubUsername: ${jsString(githubUsername)}`);
  content = content.replace(/repoName:\s*"[^"]*"/, `repoName: ${jsString(repoName)}`);
  content = content.replace(/siteTitle:\s*"[^"]*"/, `siteTitle: ${jsString(siteTitle)}`);
  content = content.replace(
    /siteDescription:\s*(?:"[^"]*"|`[^`]*`)/,
    `siteDescription: ${jsString(siteDescription)}`
  );
  content = content.replace(/profileImageUrl:\s*"[^"]*"/, `profileImageUrl: ${jsString(profileImageUrl)}`);
  content = content.replace(/encryptedToken:\s*"[^"]*"/, `encryptedToken: ""`);

  if (content.includes("ctaMode:")) {
    content = content.replace(/ctaMode:\s*"[^"]*"/, `ctaMode: ${jsString(safeCtaMode)}`);
  } else {
    content = content.replace(/forkUrl:\s*"[^"]*",/, (match) => `${match}\n  ctaMode: ${jsString(safeCtaMode)},`);
  }

  fs.writeFileSync(configPath, content, "utf8");
}

function saveImageFile(imageFile) {
  if (!imageFile || !imageFile.dataUrl) {
    return "";
  }

  const match = imageFile.dataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/);

  if (!match) {
    throw new Error("Imagem invalida. Use PNG, JPG, WebP ou GIF.");
  }

  const extensionByType = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = extensionByType[match[1]];
  const assetDir = path.join(root, "assets/profile");
  const assetPath = path.join(assetDir, `profile.${extension}`);

  fs.mkdirSync(assetDir, { recursive: true });
  fs.writeFileSync(assetPath, Buffer.from(match[2], "base64"));

  return `assets/profile/profile.${extension}`;
}

function getStatus() {
  const git = tryRun("git", ["--version"]);
  const gh = tryRun("gh", ["--version"]);
  const auth = tryRun("gh", ["auth", "status"]);
  const remoteRepoName = getRemoteRepoName();

  return {
    git: { ok: git.ok, label: git.ok ? "Instalado" : "Nao encontrado" },
    gh: { ok: gh.ok, label: gh.ok ? "Instalado" : "Nao encontrado" },
    auth: { ok: auth.ok, label: auth.ok ? "Autenticado" : "Precisa login" },
    repoName: remoteRepoName || "projetos-github-pages",
    config: fs.existsSync(path.join(root, "js/config.js")) ? readConfig() : null,
    help:
      "Para usar o setup visual:\n\n" +
      "1. Instale Git: https://git-scm.com/downloads\n" +
      "2. Instale GitHub CLI: https://cli.github.com/\n" +
      "3. Rode no terminal: gh auth login\n" +
      "4. Escolha GitHub.com, HTTPS e autentique pelo navegador.\n",
  };
}

function enablePages(log) {
  const repo = tryRun("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);

  if (!repo.ok || !repo.output) {
    log.push("Nao consegui identificar o repositorio remoto com gh repo view.");
    return "";
  }

  const [owner, repoName] = repo.output.split("/");
  const pages = tryRun("gh", ["api", `repos/${repo.output}/pages`]);

  if (!pages.ok) {
    const create = tryRun("gh", [
      "api",
      "--method",
      "POST",
      `repos/${repo.output}/pages`,
      "-F",
      "source[branch]=main",
      "-F",
      "source[path]=/",
    ]);
    log.push(create.ok ? "GitHub Pages ativado." : `Nao consegui ativar Pages:\n${create.output}`);
  } else {
    log.push("GitHub Pages ja estava ativo.");
  }

  return `https://${owner}.github.io/${repoName}/`;
}

function setup(payload) {
  const log = [];
  const username = (payload.githubUsername || "").trim();
  const repoName = sanitizeRepoName(payload.repoName);

  if (!username) {
    throw new Error("Informe o nome de usuario GitHub.");
  }

  const status = getStatus();

  if (!status.git.ok || !status.gh.ok || !status.auth.ok) {
    throw new Error(status.help);
  }

  ensureGitRepository(log);

  const imagePath = payload.imageFile ? saveImageFile(payload.imageFile) : "";
  const profileImageUrl = imagePath || (payload.profileImageUrl || "").trim();
  const title = (payload.siteTitle || "").trim() || `Projetos GitHub de ${username}`;
  const description = (payload.siteDescription || "").trim() || "Minha vitrine de projetos no GitHub.";

  updateConfig({
    githubUsername: username,
    repoName: repoName,
    siteTitle: title,
    siteDescription: description,
    profileImageUrl,
    ctaMode: payload.ctaMode,
  });
  log.push("Config atualizado.");

  const add = tryRun("git", ["add", "."]);
  log.push(add.ok ? "Arquivos preparados para commit." : `Aviso no git add:\n${add.output}`);

  const commit = tryRun("git", ["commit", "-m", `Configure projects site for ${username}`]);
  log.push(commit.ok ? commit.output : `Commit pulado ou falhou:\n${commit.output}`);

  ensureRemote(log, repoName);

  const branch = getCurrentBranch();
  let push = tryRun("git", ["push"]);

  if (!push.ok) {
    push = tryRun("git", ["push", "-u", "origin", branch]);
  }

  if (!push.ok) {
    throw new Error(`Nao foi possivel fazer push:\n${push.output}`);
  }

  log.push(push.output || "Push enviado.");
  const siteUrl = enablePages(log);

  if (siteUrl) {
    log.push(`Site: ${siteUrl}`);
  }

  return { log: log.join("\n\n"), siteUrl };
}

function send(res, statusCode, data, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(data);
}

function sendJson(res, statusCode, data) {
  send(res, statusCode, JSON.stringify(data), { "Content-Type": "application/json; charset=utf-8" });
}

function staticFile(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.resolve(guiRoot, `.${pathname}`);

  if (!filePath.startsWith(guiRoot)) {
    send(res, 403, "Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, "Not found");
    return;
  }

  const type = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  }[path.extname(filePath)] || "application/octet-stream";

  send(res, 200, fs.readFileSync(filePath), { "Content-Type": type });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/status") {
    sendJson(res, 200, getStatus());
    return;
  }

  if (req.method === "POST" && req.url === "/api/setup") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 12 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        sendJson(res, 200, setup(JSON.parse(body || "{}")));
      } catch (error) {
        sendJson(res, 400, { log: error.message });
      }
    });
    return;
  }

  staticFile(req, res);
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Setup visual aberto em ${url}`);

  const opener =
    process.platform === "darwin" ? ["open", [url]] :
    process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] :
    ["xdg-open", [url]];

  tryRun(opener[0], opener[1]);
});
