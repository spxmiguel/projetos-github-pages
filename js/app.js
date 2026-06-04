(function () {
  try {
    const override = localStorage.getItem("github-projects-config-override");
    if (override) {
      const parsed = JSON.parse(override);
      const usernameMatch = parsed.githubUsername === window.PORTFOLIO_CONFIG.githubUsername;
      const repoMatch = parsed.repoName === window.PORTFOLIO_CONFIG.repoName;
      const isExpired = !parsed.savedAt || (Date.now() - parsed.savedAt > 10 * 60 * 1000);
      
      if (usernameMatch && repoMatch && !isExpired) {
        Object.assign(window.PORTFOLIO_CONFIG, parsed);
      } else {
        localStorage.removeItem("github-projects-config-override");
      }
    }
  } catch (e) {
    // Ignore
  }

  const config = window.PORTFOLIO_CONFIG;
  const SETUP_DOWNLOADS = {
    windows: {
      label: "Windows",
      file: "projetos-github-pages-windows.zip",
      launcher: "setup/setup-gui-windows.bat",
      steps: [
        "Abra o ZIP baixado e extraia a pasta.",
        "Entre na pasta extraida.",
        "Dê dois cliques em setup/setup-gui-windows.bat.",
        "Preencha username, nome do repositorio, nome do site e foto opcional.",
        "Clique em Salvar e pushar projeto.",
      ],
    },
    mac: {
      label: "macOS",
      file: "projetos-github-pages-mac.zip",
      launcher: "setup/setup-gui-mac.command",
      steps: [
        "Abra o ZIP baixado e extraia a pasta.",
        "Entre na pasta extraida.",
        "Dê dois cliques em setup/setup-gui-mac.command.",
        "Se o macOS bloquear, clique com botão direito no arquivo, escolha Abrir e confirme.",
        "Preencha os dados e clique em Salvar e pushar projeto.",
      ],
    },
    linux: {
      label: "Linux",
      file: "projetos-github-pages-linux.zip",
      launcher: "node setup/setup-gui-universal.js",
      steps: [
        "Abra o ZIP baixado e extraia a pasta.",
        "Abra o terminal dentro da pasta extraida.",
        "Rode: node setup/setup-gui-universal.js",
        "Preencha username, nome do repositorio, nome do site e foto opcional.",
        "Clique em Salvar e pushar projeto.",
      ],
    },
  };
  const RELEASE_DOWNLOAD_BASE =
    "https://github.com/spxmiguel/projetos-github-pages/releases/latest/download/";
  const state = {
    projects: [],
    search: "",
    language: "all",
    theme: localStorage.getItem("github-projects-theme") || "system",
  };

  let decryptedToken = sessionStorage.getItem("github-projects-session-token") || null;
  let decryptedGroqKey = sessionStorage.getItem("github-projects-session-groq") || null;
  let adminPassword = sessionStorage.getItem("github-projects-session-password") || null;

  const SUN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const MOON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const LOCKED_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
  const UNLOCKED_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
  
  const CALENDAR_SVG = `<svg class="card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
  const COMMIT_SVG = `<svg class="card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="1.05" y1="12" x2="7" y2="12"></line><line x1="17.01" y1="12" x2="22.96" y2="12"></line></svg>`;
  const TAG_SVG = `<svg class="card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`;
  const STAR_SVG = `<svg class="card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  const FORK_SVG = `<svg class="card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>`;
  const ALERT_SVG = `<svg class="card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  const PACKAGE_SVG = `<svg class="card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon><polygon points="12 22.08 21 17.08 21 6.92 12 12 12 22.08"></polygon><polygon points="12 12 21 6.92 12 1.84 3 6.92 12 12"></polygon></svg>`;
  const PIN_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

  const elements = {
    brandName: document.querySelector("#brandName"),
    brandHandle: document.querySelector("#brandHandle"),
    forkCta: document.querySelector("#forkCta"),
    headerCreateYours: document.querySelector("#headerCreateYours"),
    fineprintCta: document.querySelector("#fineprintCta"),
    setupModal: document.querySelector("#setupModal"),
    setupDetectedText: document.querySelector("#setupDetectedText"),
    setupSteps: document.querySelector("#setupSteps"),
    setupDownloadAgain: document.querySelector("#setupDownloadAgain"),
    profileLink: document.querySelector("#profileLink"),
    profilePanel: document.querySelector("#profilePanel"),
    profileImage: document.querySelector("#profileImage"),
    profileName: document.querySelector("#profileName"),
    heroTitle: document.querySelector("#heroTitle"),
    heroDescription: document.querySelector("#heroDescription"),
    repoCount: document.querySelector("#repoCount"),
    releaseCount: document.querySelector("#releaseCount"),
    languageCount: document.querySelector("#languageCount"),
    searchInput: document.querySelector("#searchInput"),
    languageFilter: document.querySelector("#languageFilter"),
    themeToggle: document.querySelector("#themeToggle"),
    themeIcon: document.querySelector("#themeIcon"),
    statusMessage: document.querySelector("#statusMessage"),
    projectGrid: document.querySelector("#projectGrid"),
    template: document.querySelector("#projectCardTemplate"),
    
    // Admin panel elements
    adminBtn: document.querySelector("#adminBtn"),
    adminBtnIcon: document.querySelector("#adminBtnIcon"),
    adminModal: document.querySelector("#adminModal"),
    adminLoginForm: document.querySelector("#adminLoginForm"),
    adminSetupForm: document.querySelector("#adminSetupForm"),
    adminEditForm: document.querySelector("#adminEditForm"),
    adminClose: document.querySelector("#adminClose"),
    adminBackdrop: document.querySelector("#adminBackdrop"),
    adminLoginPassword: document.querySelector("#adminLoginPassword"),
    adminLoginError: document.querySelector("#adminLoginError"),
    adminSetupToken: document.querySelector("#adminSetupToken"),
    adminSetupPassword: document.querySelector("#adminSetupPassword"),
    adminSetupPasswordConfirm: document.querySelector("#adminSetupPasswordConfirm"),
    adminSetupError: document.querySelector("#adminSetupError"),
    adminGithubUsername: document.querySelector("#adminGithubUsername"),
    adminRepoName: document.querySelector("#adminRepoName"),
    adminSiteTitle: document.querySelector("#adminSiteTitle"),
    adminSiteDescription: document.querySelector("#adminSiteDescription"),
    adminProfileImageUrl: document.querySelector("#adminProfileImageUrl"),
    adminForkUrl: document.querySelector("#adminForkUrl"),
    adminCtaMode: document.querySelector("#adminCtaMode"),
    adminSortBy: document.querySelector("#adminSortBy"),
    adminIncludeForks: document.querySelector("#adminIncludeForks"),
    adminIncludeArchived: document.querySelector("#adminIncludeArchived"),
    adminChangeToken: document.querySelector("#adminChangeToken"),
    adminChangePassword: document.querySelector("#adminChangePassword"),
    adminChangePasswordConfirm: document.querySelector("#adminChangePasswordConfirm"),
    adminEditError: document.querySelector("#adminEditError"),
    adminEditSuccess: document.querySelector("#adminEditSuccess"),
    adminSaveBtn: document.querySelector("#adminSaveBtn"),
    adminLogoutBtn: document.querySelector("#adminLogoutBtn"),
    adminResetConfigBtn: document.querySelector("#adminResetConfigBtn"),
    adminSetupGroqKey: document.querySelector("#adminSetupGroqKey"),
    adminGroqKey: document.querySelector("#adminGroqKey"),
    adminGenerateBlogBtn: document.querySelector("#adminGenerateBlogBtn"),
    adminGenerateBlogStatus: document.querySelector("#adminGenerateBlogStatus"),
    blogGrid: document.querySelector("#blogGrid"),
  };

  function getPreferredTheme() {
    if (state.theme !== "system") {
      return state.theme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme() {
    const theme = getPreferredTheme();
    document.documentElement.dataset.theme = theme;
    elements.themeIcon.innerHTML = theme === "dark" ? SUN_SVG : MOON_SVG;
  }

  function toggleTheme() {
    const nextTheme = getPreferredTheme() === "dark" ? "light" : "dark";
    state.theme = nextTheme;
    localStorage.setItem("github-projects-theme", nextTheme);
    applyTheme();
  }

  function setupPageCopy() {
    document.title = config.siteTitle;
    elements.brandName.textContent = config.siteTitle;
    elements.brandHandle.textContent = `@${config.githubUsername}`;
    elements.forkCta.href =
      config.forkUrl ||
      `${RELEASE_DOWNLOAD_BASE}${SETUP_DOWNLOADS.linux.file}`;
    if (elements.headerCreateYours) {
      elements.headerCreateYours.href = elements.forkCta.href;
    }
    elements.fineprintCta.querySelector("a").href = elements.forkCta.href;
    applyCtaMode(config.ctaMode || "top");
    elements.profileLink.href = `https://github.com/${config.githubUsername}`;
    elements.heroTitle.textContent = config.siteTitle;
    if (config.siteDescription) {
      elements.heroDescription.textContent = config.siteDescription;
      elements.heroDescription.hidden = false;
    } else {
      elements.heroDescription.textContent = "";
      elements.heroDescription.hidden = true;
    }
    elements.profileName.textContent = config.githubUsername;

    const profileImg = config.profileImageUrl || "assets/profile/default-avatar.png";
    elements.profileImage.src = profileImg;
    elements.profileImage.alt = `Foto de ${config.githubUsername}`;
    elements.profilePanel.hidden = false;
  }

  function setStatus(message, isHtml = false) {
    if (isHtml) {
      elements.statusMessage.innerHTML = message;
    } else {
      elements.statusMessage.textContent = message;
    }
  }

  function applyCtaMode(mode) {
    const normalizedMode = ["top", "fineprint", "hidden"].includes(mode) ? mode : "top";

    elements.forkCta.hidden = normalizedMode !== "top";
    elements.fineprintCta.hidden = normalizedMode !== "fineprint";
  }

  function detectOs() {
    const platform = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();

    if (platform.includes("win")) return "windows";
    if (platform.includes("mac") || platform.includes("iphone") || platform.includes("ipad")) return "mac";
    return "linux";
  }

  function getDownloadUrl(os) {
    return `${RELEASE_DOWNLOAD_BASE}${SETUP_DOWNLOADS[os].file}`;
  }

  function triggerDownload(os) {
    const link = document.createElement("a");
    link.href = getDownloadUrl(os);
    link.download = SETUP_DOWNLOADS[os].file;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.append(link);
    link.click();
    link.remove();
  }

  function showSetupInstructions(os, { downloaded = false } = {}) {
    const setup = SETUP_DOWNLOADS[os];

    elements.setupDetectedText.textContent = downloaded
      ? `Detectei ${setup.label} e iniciei o download de ${setup.file}.`
      : `Mostrando instruções para ${setup.label}.`;
    elements.setupSteps.replaceChildren(
      ...setup.steps.map((step) => {
        const item = document.createElement("li");
        item.textContent = step;
        return item;
      })
    );
    elements.setupDownloadAgain.href = getDownloadUrl(os);
    elements.setupDownloadAgain.textContent = `Baixar ${setup.label} novamente`;
    elements.setupModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeSetupModal() {
    elements.setupModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  // --- CRYPTO HELPERS (WEB CRYPTO API) ---
  async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptText(text, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(text)
    );
    
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
    const encryptedHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, "0")).join("");
    return `${saltHex}.${ivHex}.${encryptedHex}`;
  }

  async function decryptText(encryptedString, password) {
    try {
      const parts = encryptedString.split(".");
      if (parts.length !== 3) throw new Error("Formato criptografado inválido.");
      const [saltHex, ivHex, encryptedHex] = parts;
      
      const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const encrypted = new Uint8Array(encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const key = await deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encrypted
      );
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (e) {
      throw new Error("Senha incorreta.");
    }
  }

  // --- GITHUB REPO VALIDATION & PUSH ---
  async function checkTokenValidity(token, username, repo) {
    const url = `https://api.github.com/repos/${username}/${repo}/contents/js/config.js`;
    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/vnd.github+json",
          "Authorization": `token ${token}`
        }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  function generateConfigJsContent() {
    return `window.PORTFOLIO_CONFIG = {
  githubUsername: ${JSON.stringify(config.githubUsername)},
  repoName: ${JSON.stringify(config.repoName)},
  siteTitle: ${JSON.stringify(config.siteTitle)},
  siteDescription: ${JSON.stringify(config.siteDescription)},
  profileImageUrl: ${JSON.stringify(config.profileImageUrl)},
  forkUrl: ${JSON.stringify(config.forkUrl)},
  ctaMode: ${JSON.stringify(config.ctaMode)},
  includeForks: ${config.includeForks},
  includeArchived: ${config.includeArchived},
  sortBy: ${JSON.stringify(config.sortBy)},
  encryptedToken: ${JSON.stringify(config.encryptedToken)},
  encryptedGroqKey: ${JSON.stringify(config.encryptedGroqKey || null)},
  pinnedRepos: ${JSON.stringify(config.pinnedRepos || [])},
  hiddenRepos: ${JSON.stringify(config.hiddenRepos || [])},
  blogPosts: ${JSON.stringify(config.blogPosts || [])},
};
`;
  }

  async function pushConfigToGithub(token) {
    const username = config.githubUsername;
    const repo = config.repoName;
    const path = "js/config.js";
    const url = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
    
    let sha = null;
    try {
      const getRes = await fetch(url, {
        headers: {
          "Accept": "application/vnd.github+json",
          "Authorization": `token ${token}`
        }
      });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
      }
    } catch (e) {
      // File doesn't exist yet or network error
    }
    
    const newContent = generateConfigJsContent();
    
    // Unicode-safe base64 encoding
    const encoder = new TextEncoder();
    const bytes = encoder.encode(newContent);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Content = btoa(binary);
    
    const body = {
      message: "Update site configuration via Admin Panel",
      content: base64Content
    };
    if (sha) {
      body.sha = sha;
    }
    
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(errData.message || `Erro do GitHub API: ${putRes.status}`);
    }
  }

  // --- ADMIN UI FLOWS ---
  function openAdminModal() {
    elements.adminModal.hidden = false;
    document.body.classList.add("modal-open");
    resetAdminModalViews();
  }

  function closeAdminModal() {
    elements.adminModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function resetAdminModalViews() {
    elements.adminLoginForm.style.display = "none";
    elements.adminSetupForm.style.display = "none";
    elements.adminEditForm.style.display = "none";
    elements.adminLoginError.style.display = "none";
    elements.adminSetupError.style.display = "none";
    elements.adminEditError.style.display = "none";
    elements.adminEditSuccess.style.display = "none";
    
    elements.adminLoginForm.reset();
    elements.adminSetupForm.reset();
    elements.adminEditForm.reset();
    
    if (!decryptedToken) {
      if (!config.encryptedToken) {
        elements.adminSetupForm.style.display = "flex";
        document.querySelector("#adminModalTitle").textContent = "Configurar Painel Admin";
      } else {
        elements.adminLoginForm.style.display = "flex";
        document.querySelector("#adminModalTitle").textContent = "Desbloquear Painel";
      }
    } else {
      showEditView();
    }
  }

  function showEditView() {
    elements.adminLoginForm.style.display = "none";
    elements.adminSetupForm.style.display = "none";
    elements.adminEditForm.style.display = "flex";
    document.querySelector("#adminModalTitle").textContent = "Editar Informações do Site";
    
    elements.adminGithubUsername.value = config.githubUsername || "";
    elements.adminRepoName.value = config.repoName || "projetos-github-pages";
    elements.adminSiteTitle.value = config.siteTitle || "";
    elements.adminSiteDescription.value = config.siteDescription || "";
    elements.adminProfileImageUrl.value = config.profileImageUrl || "";
    elements.adminForkUrl.value = config.forkUrl || "";
    elements.adminCtaMode.value = config.ctaMode || "top";
    elements.adminSortBy.value = config.sortBy || "updated";
    elements.adminIncludeForks.checked = !!config.includeForks;
    elements.adminIncludeArchived.checked = !!config.includeArchived;
    elements.adminGroqKey.value = decryptedGroqKey || "";
    
    renderAdminProjectsList();
  }

  function renderAdminProjectsList() {
    const listContainer = document.querySelector("#adminProjectsList");
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    
    if (!config.pinnedRepos) config.pinnedRepos = [];
    if (!config.hiddenRepos) config.hiddenRepos = [];
    
    const pinned = config.pinnedRepos;
    const sortedProjects = [...state.projects].sort((a, b) => {
      const aPinned = pinned.includes(a.name);
      const bPinned = pinned.includes(b.name);
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (aPinned && bPinned) {
        return pinned.indexOf(a.name) - pinned.indexOf(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    
    if (sortedProjects.length === 0) {
      listContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem; padding: 8px;">Nenhum projeto carregado.</span>';
      return;
    }
    
    for (const project of sortedProjects) {
      const row = document.createElement("div");
      row.className = "admin-project-row";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.padding = "6px 8px";
      row.style.borderRadius = "var(--radius-sm)";
      row.style.borderBottom = "1px solid rgba(255,255,255,0.03)";
      
      const nameSpan = document.createElement("span");
      nameSpan.textContent = project.name;
      nameSpan.style.fontSize = "0.85rem";
      nameSpan.style.fontWeight = "600";
      nameSpan.style.textOverflow = "ellipsis";
      nameSpan.style.overflow = "hidden";
      nameSpan.style.whiteSpace = "nowrap";
      nameSpan.style.maxWidth = "45%";
      
      const actionsDiv = document.createElement("div");
      actionsDiv.style.display = "flex";
      actionsDiv.style.alignItems = "center";
      actionsDiv.style.gap = "6px";
      
      const isPinned = pinned.includes(project.name);
      
      // If pinned, show move up/down controls
      if (isPinned) {
        const orderDiv = document.createElement("div");
        orderDiv.style.display = "flex";
        orderDiv.style.gap = "2px";
        
        const pinIdx = pinned.indexOf(project.name);
        
        // Up button
        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
        upBtn.style.padding = "2px 6px";
        upBtn.style.fontSize = "0.7rem";
        upBtn.style.borderRadius = "3px";
        upBtn.style.border = "1px solid var(--border)";
        upBtn.style.background = "transparent";
        upBtn.style.color = "var(--text-muted)";
        upBtn.style.cursor = pinIdx > 0 ? "pointer" : "not-allowed";
        upBtn.style.opacity = pinIdx > 0 ? "1" : "0.3";
        upBtn.style.display = "inline-flex";
        upBtn.style.alignItems = "center";
        upBtn.style.justifyContent = "center";
        if (pinIdx > 0) {
          upBtn.addEventListener("click", () => {
            const temp = pinned[pinIdx - 1];
            pinned[pinIdx - 1] = pinned[pinIdx];
            pinned[pinIdx] = temp;
            renderAdminProjectsList();
          });
        }
        
        // Down button
        const downBtn = document.createElement("button");
        downBtn.type = "button";
        downBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        downBtn.style.padding = "2px 6px";
        downBtn.style.fontSize = "0.7rem";
        downBtn.style.borderRadius = "3px";
        downBtn.style.border = "1px solid var(--border)";
        downBtn.style.background = "transparent";
        downBtn.style.color = "var(--text-muted)";
        downBtn.style.cursor = pinIdx < pinned.length - 1 ? "pointer" : "not-allowed";
        downBtn.style.opacity = pinIdx < pinned.length - 1 ? "1" : "0.3";
        downBtn.style.display = "inline-flex";
        downBtn.style.alignItems = "center";
        downBtn.style.justifyContent = "center";
        if (pinIdx < pinned.length - 1) {
          downBtn.addEventListener("click", () => {
            const temp = pinned[pinIdx + 1];
            pinned[pinIdx + 1] = pinned[pinIdx];
            pinned[pinIdx] = temp;
            renderAdminProjectsList();
          });
        }
        
        orderDiv.append(upBtn, downBtn);
        actionsDiv.append(orderDiv);
      }
      
      // Pin Button
      const pinBtn = document.createElement("button");
      pinBtn.type = "button";
      const starSvg = isPinned 
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` 
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
      pinBtn.innerHTML = starSvg + (isPinned ? "Fixado" : "Fixar");
      pinBtn.style.padding = "4px 8px";
      pinBtn.style.fontSize = "0.75rem";
      pinBtn.style.borderRadius = "var(--radius-sm)";
      pinBtn.style.border = isPinned ? "1px solid var(--primary)" : "1px solid var(--border)";
      pinBtn.style.background = isPinned ? "var(--primary-glow)" : "transparent";
      pinBtn.style.color = isPinned ? "var(--primary)" : "var(--text-muted)";
      pinBtn.style.cursor = "pointer";
      pinBtn.style.transition = "var(--transition)";
      pinBtn.style.display = "inline-flex";
      pinBtn.style.alignItems = "center";
      pinBtn.style.justifyContent = "center";
      
      pinBtn.addEventListener("click", () => {
        const pinIdx = pinned.indexOf(project.name);
        if (pinIdx > -1) {
          pinned.splice(pinIdx, 1);
        } else {
          pinned.push(project.name);
        }
        renderAdminProjectsList();
      });
      
      // Hide Button
      const hideBtn = document.createElement("button");
      hideBtn.type = "button";
      const isHidden = config.hiddenRepos.includes(project.name);
      const eyeSvg = isHidden 
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      hideBtn.innerHTML = eyeSvg + (isHidden ? "Oculto" : "Mostrar");
      hideBtn.style.padding = "4px 8px";
      hideBtn.style.fontSize = "0.75rem";
      hideBtn.style.borderRadius = "var(--radius-sm)";
      hideBtn.style.border = isHidden ? "1px solid #ff5f56" : "1px solid var(--border)";
      hideBtn.style.background = isHidden ? "rgba(255, 95, 86, 0.15)" : "transparent";
      hideBtn.style.color = isHidden ? "#ff5f56" : "var(--text-muted)";
      hideBtn.style.cursor = "pointer";
      hideBtn.style.transition = "var(--transition)";
      hideBtn.style.display = "inline-flex";
      hideBtn.style.alignItems = "center";
      hideBtn.style.justifyContent = "center";
      
      hideBtn.addEventListener("click", () => {
        const hideIdx = config.hiddenRepos.indexOf(project.name);
        if (hideIdx > -1) {
          config.hiddenRepos.splice(hideIdx, 1);
        } else {
          config.hiddenRepos.push(project.name);
        }
        renderAdminProjectsList();
      });
      
      actionsDiv.append(pinBtn, hideBtn);
      row.append(nameSpan, actionsDiv);
      listContainer.append(row);
    }
  }

  function clearCacheAndReload() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("github-projects-cache")) {
        localStorage.removeItem(key);
      }
    }
    const cleanUrl = window.location.origin + window.location.pathname + "?v=" + Date.now();
    window.location.href = cleanUrl;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    elements.adminLoginError.style.display = "none";
    const password = elements.adminLoginPassword.value;
    
    const loginBtn = elements.adminLoginForm.querySelector("button[type='submit']");
    const originalText = loginBtn.textContent;
    loginBtn.textContent = "Desbloqueando...";
    loginBtn.disabled = true;
    
    try {
      const decrypted = await decryptText(config.encryptedToken, password);
      const isValid = await checkTokenValidity(decrypted, config.githubUsername, config.repoName);
      
      if (!isValid) {
        throw new Error("Token descriptografado é inválido ou sem acesso ao repositório.");
      }
      
      decryptedToken = decrypted;
      sessionStorage.setItem("github-projects-session-token", decrypted);
      
      // Decrypt the optional Groq key. There is no client-side public fallback.
      if (config.encryptedGroqKey) {
        try {
          decryptedGroqKey = await decryptText(config.encryptedGroqKey, password);
        } catch (e) {
          decryptedGroqKey = null;
        }
      } else {
        decryptedGroqKey = null;
      }
      if (decryptedGroqKey) {
        sessionStorage.setItem("github-projects-session-groq", decryptedGroqKey);
      } else {
        sessionStorage.removeItem("github-projects-session-groq");
      }
      
      adminPassword = password;
      sessionStorage.setItem("github-projects-session-password", password);
      elements.adminBtnIcon.innerHTML = UNLOCKED_SVG;
      showEditView();
    } catch (err) {
      elements.adminLoginError.textContent = err.message || "Senha incorreta ou token inválido.";
      elements.adminLoginError.style.display = "block";
    } finally {
      loginBtn.textContent = originalText;
      loginBtn.disabled = false;
    }
  }

  async function handleSetupSubmit(event) {
    event.preventDefault();
    elements.adminSetupError.style.display = "none";
    
    const token = elements.adminSetupToken.value.trim();
    const groqKey = elements.adminSetupGroqKey.value.trim();
    const password = elements.adminSetupPassword.value;
    const confirm = elements.adminSetupPasswordConfirm.value;
    
    if (password !== confirm) {
      elements.adminSetupError.textContent = "As senhas não coincidem.";
      elements.adminSetupError.style.display = "block";
      return;
    }
    
    const submitBtn = elements.adminSetupForm.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Validando e Configurando...";
    submitBtn.disabled = true;
    
    try {
      const isValid = await checkTokenValidity(token, config.githubUsername, config.repoName);
      if (!isValid) {
        throw new Error("Token inválido ou sem acesso ao repositório configurado.");
      }
      
      const encrypted = await encryptText(token, password);
      const encryptedGroqKey = groqKey ? await encryptText(groqKey, password) : "";
      
      config.encryptedToken = encrypted;
      config.encryptedGroqKey = encryptedGroqKey;
      
      await pushConfigToGithub(token);
      
      // Save configuration locally to bypass GitHub Pages build delays
      try {
        config.savedAt = Date.now();
        localStorage.setItem("github-projects-config-override", JSON.stringify(config));
      } catch (e) {}

      decryptedToken = token;
      sessionStorage.setItem("github-projects-session-token", token);
      decryptedGroqKey = groqKey || null;
      if (decryptedGroqKey) {
        sessionStorage.setItem("github-projects-session-groq", decryptedGroqKey);
      } else {
        sessionStorage.removeItem("github-projects-session-groq");
      }
      adminPassword = password;
      sessionStorage.setItem("github-projects-session-password", password);
      elements.adminBtnIcon.innerHTML = UNLOCKED_SVG;
      
      elements.adminSetupError.style.display = "none";
      alert("Configurado com sucesso! O site será recarregado em instantes.");
      clearCacheAndReload();
    } catch (err) {
      elements.adminSetupError.textContent = err.message || "Erro ao configurar.";
      elements.adminSetupError.style.display = "block";
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    elements.adminEditError.style.display = "none";
    elements.adminEditSuccess.style.display = "none";
    
    const newUsername = elements.adminGithubUsername.value.trim();
    const newRepo = elements.adminRepoName.value.trim();
    const newTitle = elements.adminSiteTitle.value.trim();
    const newDesc = elements.adminSiteDescription.value.trim();
    const newProfileImg = elements.adminProfileImageUrl.value.trim();
    const newForkUrl = elements.adminForkUrl.value.trim();
    const newCtaMode = elements.adminCtaMode.value;
    const newSortBy = elements.adminSortBy.value;
    const newIncludeForks = elements.adminIncludeForks.checked;
    const newIncludeArchived = elements.adminIncludeArchived.checked;
    const targetGroqKey = elements.adminGroqKey.value.trim();
    
    const changeToken = elements.adminChangeToken.value.trim();
    const changePass = elements.adminChangePassword.value;
    const changePassConfirm = elements.adminChangePasswordConfirm.value;
    
    let targetToken = decryptedToken;
    let targetPassword = adminPassword;
    
    if (changePass || changePassConfirm) {
      if (changePass !== changePassConfirm) {
        elements.adminEditError.textContent = "As novas senhas não coincidem.";
        elements.adminEditError.style.display = "block";
        return;
      }
      targetPassword = changePass;
    }
    
    if (changeToken) {
      targetToken = changeToken;
    }
    
    elements.adminSaveBtn.textContent = "Salvando no GitHub...";
    elements.adminSaveBtn.disabled = true;
    
    try {
      const isValid = await checkTokenValidity(targetToken, newUsername, newRepo);
      if (!isValid) {
        throw new Error("Token inválido ou repositório não encontrado com as novas configurações.");
      }
      
      config.githubUsername = newUsername;
      config.repoName = newRepo;
      config.siteTitle = newTitle;
      config.siteDescription = newDesc;
      config.profileImageUrl = newProfileImg;
      config.forkUrl = newForkUrl;
      config.ctaMode = newCtaMode;
      config.sortBy = newSortBy;
      config.includeForks = newIncludeForks;
      config.includeArchived = newIncludeArchived;
      
      const encrypted = await encryptText(targetToken, targetPassword);
      const encryptedGroqKey = targetGroqKey ? await encryptText(targetGroqKey, targetPassword) : "";
      config.encryptedToken = encrypted;
      config.encryptedGroqKey = encryptedGroqKey;
      
      await pushConfigToGithub(targetToken);
      
      // Save configuration locally to bypass GitHub Pages build delays
      try {
        config.savedAt = Date.now();
        localStorage.setItem("github-projects-config-override", JSON.stringify(config));
      } catch (e) {}

      decryptedToken = targetToken;
      sessionStorage.setItem("github-projects-session-token", targetToken);
      decryptedGroqKey = targetGroqKey || null;
      if (decryptedGroqKey) {
        sessionStorage.setItem("github-projects-session-groq", decryptedGroqKey);
      } else {
        sessionStorage.removeItem("github-projects-session-groq");
      }
      adminPassword = targetPassword;
      sessionStorage.setItem("github-projects-session-password", targetPassword);
      
      elements.adminEditSuccess.textContent = "Configurações salvas e publicadas! Reiniciando a página...";
      elements.adminEditSuccess.style.display = "block";
      
      setTimeout(() => {
        clearCacheAndReload();
      }, 2000);
      
    } catch (err) {
      elements.adminEditError.textContent = err.message || "Erro ao salvar alterações.";
      elements.adminEditError.style.display = "block";
    } finally {
      elements.adminSaveBtn.textContent = "Salvar Alterações";
      elements.adminSaveBtn.disabled = false;
    }
  }

  function handleLogout() {
    decryptedToken = null;
    adminPassword = null;
    decryptedGroqKey = null;
    sessionStorage.removeItem("github-projects-session-token");
    sessionStorage.removeItem("github-projects-session-groq");
    sessionStorage.removeItem("github-projects-session-password");
    elements.adminBtnIcon.innerHTML = LOCKED_SVG;
    closeAdminModal();
  }

  function formatCacheTime(dateValue) {
    if (!dateValue) return "N/A";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return "N/A";
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Sem data";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Sem data";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return "Sem data";
    }
  }



  function getLanguages(projects) {
    return [...new Set(projects.map((project) => project.language).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }

  function updateLanguageFilter() {
    const languages = getLanguages(state.projects);

    elements.languageFilter.innerHTML = '<option value="all">Todas</option>';

    for (const language of languages) {
      const option = document.createElement("option");
      option.value = language;
      option.textContent = language;
      elements.languageFilter.append(option);
    }
  }

  function updateStats() {
    const languages = getLanguages(state.projects);
    const releaseCount = state.projects.reduce((total, project) => total + project.releases.length, 0);

    elements.repoCount.textContent = state.projects.length;
    elements.releaseCount.textContent = releaseCount;
    elements.languageCount.textContent = languages.length;
  }

  function getFilteredProjects() {
    const search = state.search.trim().toLowerCase();
    const hidden = config.hiddenRepos || [];
    const pinned = config.pinnedRepos || [];

    const filtered = state.projects.filter((project) => {
      if (hidden.includes(project.name)) return false;
      const matchesSearch = !search || project.name.toLowerCase().includes(search);
      const matchesLanguage = state.language === "all" || project.language === state.language;
      return matchesSearch && matchesLanguage;
    });

    filtered.sort((a, b) => {
      const aPinned = pinned.includes(a.name);
      const bPinned = pinned.includes(b.name);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (aPinned && bPinned) {
        return pinned.indexOf(a.name) - pinned.indexOf(b.name);
      }
      return 0;
    });

    return filtered;
  }

  function createButton({ href, label, variant = "" }) {
    const link = document.createElement("a");
    link.className = `button ${variant}`.trim();
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = label;
    return link;
  }

  function renderProject(project) {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    const title = card.querySelector("h2");
    const description = card.querySelector(".project-description");
    const language = card.querySelector(".language-badge");
    const meta = card.querySelector(".project-meta");
    const actions = card.querySelector(".actions");

    // Highlight pinned project
    const pinned = config.pinnedRepos || [];
    if (pinned.includes(project.name)) {
      card.classList.add("pinned-card");
      const pinBadge = document.createElement("span");
      pinBadge.className = "pin-badge";
      pinBadge.innerHTML = `${PIN_SVG} Pinned`;
      card.prepend(pinBadge);
    }

    title.textContent = project.name;
    description.textContent = project.description || "Projeto sem descrição no GitHub.";
    language.textContent = project.language || "Sem linguagem";

    const updated = document.createElement("span");
    updated.innerHTML = `${CALENDAR_SVG} ${formatDate(project.updated_at)}`;
    meta.append(updated);

    if (project.commitCount !== undefined && project.commitCount !== null) {
      const commitsSpan = document.createElement("span");
      commitsSpan.innerHTML = `${COMMIT_SVG} ${project.commitCount} commit${project.commitCount !== 1 ? "s" : ""}`;
      meta.append(commitsSpan);
    }

    if (project.releases.length) {
      const release = document.createElement("span");
      release.innerHTML = `${TAG_SVG} ${project.releases.length} release${project.releases.length > 1 ? "s" : ""}`;
      meta.append(release);
    }

    if (project.stargazers_count > 0) {
      const stars = document.createElement("span");
      stars.innerHTML = `${STAR_SVG} ${project.stargazers_count}`;
      meta.append(stars);
    }

    if (project.forks_count > 0) {
      const forks = document.createElement("span");
      forks.innerHTML = `${FORK_SVG} ${project.forks_count}`;
      meta.append(forks);
    }

    if (project.open_issues_count > 0) {
      const issues = document.createElement("span");
      issues.innerHTML = `${ALERT_SVG} ${project.open_issues_count} issue${project.open_issues_count > 1 ? "s" : ""}`;
      meta.append(issues);
    }

    const sizeKB = project.size || 0;
    const size = document.createElement("span");
    size.innerHTML = `${PACKAGE_SVG} ${sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + " MB" : sizeKB + " KB"}`;
    meta.append(size);

    if (project.siteLink) {
      let label = "Live Demo";
      const repoNameLower = (project.name || "").toLowerCase();
      if (repoNameLower === "lootflow") {
        label = "Landing Page";
      } else if (repoNameLower === "craftserver") {
        label = "Live Demo";
      } else {
        if (project.siteLink.includes("github.io")) {
          label = "Live Demo";
        } else {
          label = "Acessar Site";
        }
      }
      actions.append(createButton({ href: project.siteLink, label: label, variant: "primary" }));
    }

    if (project.repoLink) {
      actions.append(createButton({ href: project.repoLink, label: "Source", variant: "" }));
    }

    for (const download of project.downloads) {
      actions.append(
          createButton({
            href: download.downloadUrl,
            label: `Baixar ${download.platform}`,
            variant: "download",
          })
      );
    }

    actions.append(createButton({ href: project.readmeLink, label: "README" }));

    return card;
  }

  function renderProjects() {
    const projects = getFilteredProjects();
    elements.projectGrid.replaceChildren(...projects.map(renderProject));

    if (!state.projects.length) {
      setStatus("Nenhum projeto público foi encontrado.");
      return;
    }

    if (!projects.length) {
      setStatus("Nenhum projeto corresponde aos filtros atuais.");
      return;
    }

    setStatus("");
  }

  async function loadProjects() {
    setupPageCopy();
    setStatus("Carregando projetos do GitHub...");

    try {
      const visitorToken = localStorage.getItem("github-visitor-token") || decryptedToken;
      const result = await window.GitHubProjects.fetchProjectsData(config, visitorToken);
      state.projects = result.projects;
      updateLanguageFilter();
      updateStats();
      renderProjects();
      loadAndGenerateBlog();

      if (result.cached && result.stale) {
        setStatus(`Mostrando cache salvo em ${formatCacheTime(result.savedAt)} porque a API do GitHub limitou as requisições. <a href="#" id="forceReloadBtn" style="color: var(--primary); text-decoration: underline; margin-left: 8px; font-weight: 600;">Atualizar agora</a>`, true);
        const forceBtn = document.querySelector("#forceReloadBtn");
        if (forceBtn) {
          forceBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearCacheAndReloadProjects();
          });
        }
      } else if (result.cached) {
        setStatus(`Mostrando cache local. Atualiza automaticamente depois de ${formatCacheTime(result.expiresAt)}. <a href="#" id="forceReloadBtn" style="color: var(--primary); text-decoration: underline; margin-left: 8px; font-weight: 600;">Atualizar agora</a>`, true);
        const forceBtn = document.querySelector("#forceReloadBtn");
        if (forceBtn) {
          forceBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearCacheAndReloadProjects();
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      const isRateLimit = error.status === 403;
      showRateLimitError(isRateLimit);
    }
  }

  function clearCacheAndReloadProjects() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("github-projects-cache")) {
        localStorage.removeItem(key);
      }
    }
    loadProjects();
  }

  function showRateLimitError(isRateLimit) {
    const hasVisitorToken = !!localStorage.getItem("github-visitor-token");
    
    let html = "";
    if (isRateLimit) {
      html = `
        <div style="text-align: center; padding: 20px;">
          <p style="margin-bottom: 12px; font-weight: 500; color: #ff5f56;">A API do GitHub limitou as requisições (Limite de IP atingido).</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
            Para atualizar os projetos agora e ignorar este limite, insira seu próprio <strong>GitHub Personal Access Token (PAT)</strong>:
          </p>
          <div style="display: flex; gap: 8px; max-width: 400px; margin: 0 auto; align-items: center;">
            <input type="password" id="visitorTokenInput" placeholder="github_pat_..." style="padding: 8px 12px; font-size: 0.85rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); color: var(--text);">
            <button id="visitorTokenSubmitBtn" class="button primary" style="padding: 8px 16px; font-size: 0.85rem;">Salvar</button>
          </div>
          ${hasVisitorToken ? `<a href="#" id="removeVisitorTokenLink" style="font-size: 0.8rem; color: #ff5f56; display: inline-block; margin-top: 12px; text-decoration: underline;">Remover token atual</a>` : ""}
        </div>
      `;
    } else {
      html = `
        <div style="text-align: center; padding: 20px;">
          <p style="margin-bottom: 12px; font-weight: 500; color: #ff5f56;">Não foi possível carregar os projetos agora. Verifique as configurações.</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
            Se o repositório for privado ou precisar de permissões especiais, insira um token de acesso válido:
          </p>
          <div style="display: flex; gap: 8px; max-width: 400px; margin: 0 auto; align-items: center;">
            <input type="password" id="visitorTokenInput" placeholder="github_pat_..." style="padding: 8px 12px; font-size: 0.85rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); color: var(--text);">
            <button id="visitorTokenSubmitBtn" class="button primary" style="padding: 8px 16px; font-size: 0.85rem;">Salvar</button>
          </div>
          ${hasVisitorToken ? `<a href="#" id="removeVisitorTokenLink" style="font-size: 0.8rem; color: #ff5f56; display: inline-block; margin-top: 12px; text-decoration: underline;">Remover token atual</a>` : ""}
        </div>
      `;
    }
    
    setStatus(html, true);
    
    const submitBtn = document.querySelector("#visitorTokenSubmitBtn");
    const tokenInput = document.querySelector("#visitorTokenInput");
    const removeLink = document.querySelector("#removeVisitorTokenLink");
    
    if (submitBtn && tokenInput) {
      submitBtn.addEventListener("click", () => {
        const token = tokenInput.value.trim();
        if (token) {
          localStorage.setItem("github-visitor-token", token);
          loadProjects();
        }
      });
      tokenInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          const token = tokenInput.value.trim();
          if (token) {
            localStorage.setItem("github-visitor-token", token);
            loadProjects();
          }
        }
      });
    }
    
    if (removeLink) {
      removeLink.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("github-visitor-token");
        loadProjects();
      });
    }
  }

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProjects();
  });

  elements.languageFilter.addEventListener("change", (event) => {
    state.language = event.target.value;
    renderProjects();
  });

  elements.themeToggle.addEventListener("click", toggleTheme);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

  const triggerCta = (event) => {
    event.preventDefault();
    const os = detectOs();
    showSetupInstructions(os, { downloaded: true });
    triggerDownload(os);
  };

  elements.forkCta.addEventListener("click", triggerCta);
  if (elements.headerCreateYours) {
    elements.headerCreateYours.addEventListener("click", triggerCta);
  }

  elements.fineprintCta.querySelector("a").addEventListener("click", (event) => {
    event.preventDefault();
    const os = detectOs();
    showSetupInstructions(os, { downloaded: true });
    triggerDownload(os);
  });

  document.querySelectorAll("[data-os]").forEach((button) => {
    button.addEventListener("click", () => {
      const os = button.dataset.os;
      showSetupInstructions(os, { downloaded: true });
      triggerDownload(os);
    });
  });

  // --- BLOG IA GENERATION ---
  function renderBlogPosts(posts) {
    if (!elements.blogGrid) return false;
    if (!Array.isArray(posts) || posts.length === 0) return false;

    elements.blogGrid.innerHTML = "";
    posts.forEach(post => {
      const card = document.createElement("article");
      card.className = "blog-card";

      const category = document.createElement("span");
      category.className = "blog-category";
      category.textContent = post.category || "Atualização";

      const title = document.createElement("h3");
      title.textContent = post.title || "Atualização";

      const date = document.createElement("span");
      date.style.fontSize = "0.75rem";
      date.style.color = "var(--text-muted)";
      date.style.display = "block";
      date.style.marginBottom = "8px";
      date.textContent = post.date || "";

      const content = document.createElement("div");
      content.style.fontSize = "0.9rem";
      content.style.lineHeight = "1.5";
      content.style.color = "var(--text-muted)";
      content.style.marginBottom = "12px";
      content.innerHTML = post.content || "";

      const link = document.createElement("a");
      link.className = "blog-link";
      link.href = post.link || "#top";
      link.textContent = post.project ? `Ver projeto: ${post.project} →` : "Ver detalhes →";

      card.append(category, title, date, content, link);
      elements.blogGrid.append(card);
    });
    return true;
  }

  async function loadAndGenerateBlog() {
    if (!elements.blogGrid) return;

    if (!decryptedGroqKey) {
      if (renderBlogPosts(config.blogPosts)) return;

      elements.blogGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 20px;">
          <p style="font-size: 0.95rem; font-weight: 500;">Blog de IA indisponível.</p>
          <p style="font-size: 0.85rem; margin-top: 4px;">Desbloqueie o painel admin e configure a chave Groq para gerar posts.</p>
        </div>
      `;
      return;
    }
    
    // Mostra o spinner de carregando enquanto a IA do Groq gera os posts
    elements.blogGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ai-blog-spinner" style="margin-bottom: 12px; color: var(--primary); display: inline-block;">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.78" x2="7.76" y2="16.93"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <p style="font-size: 0.95rem; font-weight: 500;">Gerando posts de notícias com IA...</p>
        <p style="font-size: 0.85rem; margin-top: 4px; color: var(--text-muted);">Analisando os commits mais recentes dos projetos...</p>
      </div>
    `;
    
    try {
      const visitorToken = localStorage.getItem("github-visitor-token") || decryptedToken;
      const commitsData = await fetchCommitsForBlog(visitorToken);
      
      if (!commitsData || commitsData.length === 0) {
        throw new Error("Nenhum commit público encontrado para alimentar o Blog de IA.");
      }
      
      const posts = await generateBlogPostsWithAI(decryptedGroqKey, commitsData);
      
      if (!posts || posts.length === 0) {
        throw new Error("O Groq não retornou posts válidos para esta conta.");
      }
      
      renderBlogPosts(posts);
    } catch (err) {
      elements.blogGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 20px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff5f56" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; display: inline-block;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p style="font-size: 0.95rem; font-weight: 500; color: #ff5f56;">Não foi possível carregar o blog de IA.</p>
          <p style="font-size: 0.85rem; margin-top: 4px;">${err.message}</p>
        </div>
      `;
    }
  }

  async function fetchCommitsForBlog(token) {
    const visibleProjects = state.projects.filter(p => !config.hiddenRepos.includes(p.name));
    const targetProjects = visibleProjects.slice(0, 8); // top 8 projects
    
    return Promise.all(targetProjects.map(async (project) => {
      try {
        const url = `https://api.github.com/repos/${config.githubUsername}/${project.name}/commits?per_page=5`;
        const response = await fetch(url, {
          headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": token ? `token ${token}` : ""
          }
        });
        if (!response.ok) return { name: project.name, commits: [] };
        const commits = await response.json();
        return {
          name: project.name,
          description: project.description || "Sem descrição",
          language: project.language || "N/A",
          commits: commits.map(c => c.commit.message)
        };
      } catch (e) {
        return { name: project.name, commits: [] };
      }
    }));
  }

  async function generateBlogPostsWithAI(groqKey, projectsData) {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const systemMessage = `Você é um jornalista de tecnologia experiente e redator técnico de um blog de desenvolvimento.
Com base nos commits e detalhes dos repositórios fornecidos, crie de 3 a 5 posts de blog dinâmicos, detalhados e interessantes sobre as novidades, atualizações de código e conquistas do desenvolvedor.
Escreva de forma profissional e cativante, em português do Brasil (pt-BR).
Cada post deve resumir as melhorias e novidades que os commits indicam, agrupando os commits logicamente ou descrevendo a evolução dos projetos. Seja criativo e informativo!

Você DEVE responder APENAS com um objeto JSON válido contendo uma chave "posts" cujo valor é um array de objetos de posts, sem formatações extras de markdown ou textos antes/depois do JSON.

Formato do JSON de resposta:
{
  "posts": [
    {
      "title": "Título criativo e chamativo do post",
      "date": "Data legível de publicação (ex: 4 de Junho de 2026)",
      "category": "Categoria do post (ex: Atualização, Lançamento, Refatoração, Feature)",
      "content": "Conteúdo detalhado do post em formato HTML simples (parágrafos <p>, negritos <strong>, etc.), explicando as novidades ou melhorias de código mostradas nos commits. Cada parágrafo deve ter substância.",
      "project": "Nome do projeto principal relacionado",
      "link": "Link relativo para a seção do projeto (ex: #top)"
    }
  ]
}
`;

    const userMessage = `Aqui estão os dados recentes dos projetos e seus commits:\n${JSON.stringify(projectsData, null, 2)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API do Groq: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content.trim();
    const parsed = JSON.parse(rawText);
    return parsed.posts || [];
  }

  // Admin listeners

  elements.adminBtn.addEventListener("click", openAdminModal);
  elements.adminClose.addEventListener("click", closeAdminModal);
  elements.adminBackdrop.addEventListener("click", closeAdminModal);
  document.querySelectorAll("[data-close-setup]").forEach((element) => {
    element.addEventListener("click", closeSetupModal);
  });
  elements.adminLoginForm.addEventListener("submit", handleLoginSubmit);
  elements.adminSetupForm.addEventListener("submit", handleSetupSubmit);
  elements.adminEditForm.addEventListener("submit", handleEditSubmit);
  elements.adminLogoutBtn.addEventListener("click", handleLogout);
  elements.adminResetConfigBtn.addEventListener("click", () => {
    elements.adminLoginForm.style.display = "none";
    elements.adminSetupForm.style.display = "flex";
    document.querySelector("#adminModalTitle").textContent = "Configurar Painel Admin (Reset)";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!elements.setupModal.hidden) {
        closeSetupModal();
      }
      if (!elements.adminModal.hidden) {
        closeAdminModal();
      }
    }
  });

  // Nav menu active link highlighter
  document.querySelectorAll(".nav-menu-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-menu-link").forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  applyTheme();
  if (decryptedToken) {
    elements.adminBtnIcon.innerHTML = UNLOCKED_SVG;
  }
  loadProjects();
})();
