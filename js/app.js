(function () {
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

  const elements = {
    brandName: document.querySelector("#brandName"),
    brandHandle: document.querySelector("#brandHandle"),
    forkCta: document.querySelector("#createYoursCta"),
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
    elements.heroDescription.textContent = config.siteDescription;
    elements.profileName.textContent = config.githubUsername;

    const avatarUrl = config.profileImageUrl || `https://github.com/${config.githubUsername}.png`;
    elements.profileImage.src = avatarUrl;
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
    elements.setupModal.style.display = "flex";
    document.body.classList.add("modal-open");
  }

  function closeSetupModal() {
    elements.setupModal.hidden = true;
    elements.setupModal.style.display = "none";
    document.body.classList.remove("modal-open");
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

    return state.projects.filter((project) => {
      const matchesSearch = !search || project.name.toLowerCase().includes(search);
      const matchesLanguage = state.language === "all" || project.language === state.language;
      return matchesSearch && matchesLanguage;
    });
  }

  const SVGS = {
    site: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>`,
    github: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
    download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    readme: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
  };

  const LANG_COLORS = {
    javascript: "#f1e05a",
    typescript: "#3178c6",
    html: "#e34c26",
    css: "#563d7c",
    python: "#3572a5",
    java: "#b07219",
    shell: "#89e051",
    go: "#00add8",
    rust: "#dea584"
  };

  function createButton({ href, label, type, variant = "" }) {
    const link = document.createElement("a");
    link.className = `button ${variant}`.trim();
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    
    const svgIcon = SVGS[type] || "";
    link.innerHTML = `${svgIcon}<span>${label}</span>`;
    return link;
  }

  function renderProject(project, index) {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    const title = card.querySelector("h2");
    const description = card.querySelector(".project-description");
    const language = card.querySelector(".language-badge");
    const meta = card.querySelector(".project-meta");
    const actions = card.querySelector(".actions");

    title.textContent = project.name;
    description.textContent = project.description || "Projeto sem descrição no GitHub.";

    // Render language badge with colored dot
    const langName = project.language || "Outro";
    const langColor = LANG_COLORS[langName.toLowerCase()] || "#8b5cf6";
    language.innerHTML = `
      <div class="lang-wrapper">
        <span class="lang-dot" style="background-color: ${langColor}"></span>
        <span>${langName}</span>
      </div>
    `;

    // Featured projects layout (mark first project or projets-github-pages as featured)
    const isMainRepo = project.name.toLowerCase() === "projetos-github-pages";
    const isFirst = index === 0;
    if (isMainRepo || isFirst) {
      card.classList.add("featured");
      const featuredIndicator = document.createElement("span");
      featuredIndicator.className = "meta-pill";
      featuredIndicator.style.borderColor = "var(--primary)";
      featuredIndicator.style.color = "var(--primary)";
      featuredIndicator.style.fontWeight = "700";
      featuredIndicator.innerHTML = "★ Destaque";
      card.querySelector(".card-title-row").prepend(featuredIndicator);
    }

    // Meta items
    const updated = document.createElement("span");
    updated.className = "meta-pill";
    updated.textContent = `Atualizado: ${formatDate(project.updated_at)}`;
    meta.append(updated);

    if (project.releases.length) {
      const release = document.createElement("span");
      release.className = "meta-pill";
      release.textContent = `${project.releases.length} Release${project.releases.length > 1 ? "s" : ""}`;
      meta.append(release);
    }

    // Action buttons
    if (project.siteLink) {
      actions.append(createButton({ href: project.siteLink, label: "Acessar site", type: "site", variant: "primary" }));
    }

    if (project.repoLink) {
      actions.append(createButton({ href: project.repoLink, label: "Ver no GitHub", type: "github", variant: "" }));
    }

    for (const download of project.downloads) {
      actions.append(
        createButton({
          href: download.downloadUrl,
          label: `Baixar ${download.platform}`,
          type: "download",
          variant: "download",
        })
      );
    }

    actions.append(createButton({ href: project.readmeLink, label: "README", type: "readme", variant: "" }));

    return card;
  }

  function renderProjects() {
    const projects = getFilteredProjects();
    elements.projectGrid.replaceChildren(...projects.map((proj, idx) => renderProject(proj, idx)));

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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.setupModal.hidden) {
      closeSetupModal();
    }
  });

  applyTheme();
  loadProjects();
})();
