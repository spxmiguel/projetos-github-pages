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

  let decryptedToken = null;
  let adminPassword = null;

  const elements = {
    brandName: document.querySelector("#brandName"),
    brandHandle: document.querySelector("#brandHandle"),
    forkCta: document.querySelector("#forkCta"),
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
    elements.themeIcon.textContent = theme === "dark" ? "☀" : "◐";
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

  function setStatus(message) {
    elements.statusMessage.textContent = message;
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
  pinnedRepos: ${JSON.stringify(config.pinnedRepos || [])},
  hiddenRepos: ${JSON.stringify(config.hiddenRepos || [])},
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
    
    renderAdminProjectsList();
  }

  function renderAdminProjectsList() {
    const listContainer = document.querySelector("#adminProjectsList");
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    
    const sortedProjects = [...state.projects].sort((a, b) => a.name.localeCompare(b.name));
    
    if (sortedProjects.length === 0) {
      listContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem; padding: 8px;">Nenhum projeto carregado.</span>';
      return;
    }
    
    if (!config.pinnedRepos) config.pinnedRepos = [];
    if (!config.hiddenRepos) config.hiddenRepos = [];
    
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
      nameSpan.style.maxWidth = "55%";
      
      const actionsDiv = document.createElement("div");
      actionsDiv.style.display = "flex";
      actionsDiv.style.gap = "8px";
      
      // Pin Button
      const pinBtn = document.createElement("button");
      pinBtn.type = "button";
      const isPinned = config.pinnedRepos.includes(project.name);
      pinBtn.innerHTML = isPinned ? "⭐ Fixado" : "☆ Fixar";
      pinBtn.style.padding = "4px 8px";
      pinBtn.style.fontSize = "0.75rem";
      pinBtn.style.borderRadius = "var(--radius-sm)";
      pinBtn.style.border = isPinned ? "1px solid var(--primary)" : "1px solid var(--border)";
      pinBtn.style.background = isPinned ? "var(--primary-glow)" : "transparent";
      pinBtn.style.color = isPinned ? "var(--primary)" : "var(--text-muted)";
      pinBtn.style.cursor = "pointer";
      pinBtn.style.transition = "var(--transition)";
      
      pinBtn.addEventListener("click", () => {
        const pinIdx = config.pinnedRepos.indexOf(project.name);
        if (pinIdx > -1) {
          config.pinnedRepos.splice(pinIdx, 1);
        } else {
          config.pinnedRepos.push(project.name);
        }
        renderAdminProjectsList();
      });
      
      // Hide Button
      const hideBtn = document.createElement("button");
      hideBtn.type = "button";
      const isHidden = config.hiddenRepos.includes(project.name);
      hideBtn.innerHTML = isHidden ? "🙈 Oculto" : "👁️ Mostrar";
      hideBtn.style.padding = "4px 8px";
      hideBtn.style.fontSize = "0.75rem";
      hideBtn.style.borderRadius = "var(--radius-sm)";
      hideBtn.style.border = isHidden ? "1px solid #ff5f56" : "1px solid var(--border)";
      hideBtn.style.background = isHidden ? "rgba(255, 95, 86, 0.15)" : "transparent";
      hideBtn.style.color = isHidden ? "#ff5f56" : "var(--text-muted)";
      hideBtn.style.cursor = "pointer";
      hideBtn.style.transition = "var(--transition)";
      
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
      adminPassword = password;
      elements.adminBtnIcon.textContent = "🔓";
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
      
      config.encryptedToken = encrypted;
      
      await pushConfigToGithub(token);
      
      // Save configuration locally to bypass GitHub Pages build delays
      try {
        config.savedAt = Date.now();
        localStorage.setItem("github-projects-config-override", JSON.stringify(config));
      } catch (e) {}

      decryptedToken = token;
      adminPassword = password;
      elements.adminBtnIcon.textContent = "🔓";
      
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
      config.encryptedToken = encrypted;
      
      await pushConfigToGithub(targetToken);
      
      // Save configuration locally to bypass GitHub Pages build delays
      try {
        config.savedAt = Date.now();
        localStorage.setItem("github-projects-config-override", JSON.stringify(config));
      } catch (e) {}

      decryptedToken = targetToken;
      adminPassword = targetPassword;
      
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
    elements.adminBtnIcon.textContent = "🔒";
    closeAdminModal();
  }

  function formatCacheTime(dateValue) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateValue));
  }

  function formatDate(dateValue) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateValue));
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
      pinBadge.innerHTML = "📌 Fixado";
      card.querySelector(".card-head").prepend(pinBadge);
    }

    title.textContent = project.name;
    description.textContent = project.description || "Projeto sem descrição no GitHub.";
    language.textContent = project.language || "Sem linguagem";

    const updated = document.createElement("span");
    updated.textContent = `📅 ${formatDate(project.updated_at)}`;
    meta.append(updated);

    if (project.commitCount !== undefined && project.commitCount !== null) {
      const commitsSpan = document.createElement("span");
      commitsSpan.textContent = `💬 ${project.commitCount} commit${project.commitCount !== 1 ? "s" : ""}`;
      meta.append(commitsSpan);
    }

    if (project.releases.length) {
      const release = document.createElement("span");
      release.textContent = `🏷️ ${project.releases.length} release${project.releases.length > 1 ? "s" : ""}`;
      meta.append(release);
    }

    if (project.stargazers_count > 0) {
      const stars = document.createElement("span");
      stars.textContent = `⭐ ${project.stargazers_count}`;
      meta.append(stars);
    }

    if (project.forks_count > 0) {
      const forks = document.createElement("span");
      forks.textContent = `🍴 ${project.forks_count}`;
      meta.append(forks);
    }

    if (project.open_issues_count > 0) {
      const issues = document.createElement("span");
      issues.textContent = `⚠️ ${project.open_issues_count} issue${project.open_issues_count > 1 ? "s" : ""}`;
      meta.append(issues);
    }

    const sizeKB = project.size || 0;
    const size = document.createElement("span");
    size.textContent = sizeKB > 1024 ? `📦 ${(sizeKB / 1024).toFixed(1)} MB` : `📦 ${sizeKB} KB`;
    meta.append(size);

    if (project.siteLink) {
      actions.append(createButton({ href: project.siteLink, label: "Acessar site", variant: "primary" }));
    }

    if (project.repoLink) {
      actions.append(createButton({ href: project.repoLink, label: "Ver no GitHub", variant: "" }));
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
      const result = await window.GitHubProjects.fetchProjectsData(config);
      state.projects = result.projects;
      updateLanguageFilter();
      updateStats();
      renderProjects();

      if (result.cached && result.stale) {
        setStatus(`Mostrando cache salvo em ${formatCacheTime(result.savedAt)} porque a API do GitHub limitou as requisições.`);
      } else if (result.cached) {
        setStatus(`Mostrando cache local. Atualiza automaticamente depois de ${formatCacheTime(result.expiresAt)}.`);
      }
    } catch (error) {
      const isRateLimit = error.status === 403;
      setStatus(
        isRateLimit
          ? "A API do GitHub limitou as requisições e ainda não existe cache salvo neste navegador. Tente novamente mais tarde."
          : "Não foi possível carregar os projetos agora. Confira o usuário no js/config.js."
      );
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

  elements.forkCta.addEventListener("click", (event) => {
    event.preventDefault();
    const os = detectOs();
    showSetupInstructions(os, { downloaded: true });
    triggerDownload(os);
  });

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

  document.querySelectorAll("[data-close-setup]").forEach((element) => {
    element.addEventListener("click", closeSetupModal);
  });

  // Admin listeners
  elements.adminBtn.addEventListener("click", openAdminModal);
  elements.adminClose.addEventListener("click", closeAdminModal);
  elements.adminBackdrop.addEventListener("click", closeAdminModal);
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

  applyTheme();
  loadProjects();
})();
