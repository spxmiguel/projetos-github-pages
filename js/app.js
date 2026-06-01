(function () {
  const config = window.PORTFOLIO_CONFIG;
  const state = {
    projects: [],
    search: "",
    language: "all",
  };

  const elements = {
    brandName: document.querySelector("#brandName"),
    brandHandle: document.querySelector("#brandHandle"),
    profileLink: document.querySelector("#profileLink"),
    heroTitle: document.querySelector("#heroTitle"),
    heroDescription: document.querySelector("#heroDescription"),
    repoCount: document.querySelector("#repoCount"),
    releaseCount: document.querySelector("#releaseCount"),
    languageCount: document.querySelector("#languageCount"),
    searchInput: document.querySelector("#searchInput"),
    languageFilter: document.querySelector("#languageFilter"),
    statusMessage: document.querySelector("#statusMessage"),
    projectGrid: document.querySelector("#projectGrid"),
    template: document.querySelector("#projectCardTemplate"),
  };

  function setupPageCopy() {
    document.title = config.siteTitle;
    elements.brandName.textContent = config.siteTitle;
    elements.brandHandle.textContent = `@${config.githubUsername}`;
    elements.profileLink.href = `https://github.com/${config.githubUsername}`;
    elements.heroTitle.textContent = config.siteTitle;
    elements.heroDescription.textContent = config.siteDescription;
  }

  function setStatus(message) {
    elements.statusMessage.textContent = message;
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

    title.textContent = project.name;
    description.textContent = project.description || "Projeto sem descrição no GitHub.";
    language.textContent = project.language || "Sem linguagem";

    const updated = document.createElement("span");
    updated.textContent = `Atualizado ${formatDate(project.updated_at)}`;
    meta.append(updated);

    if (project.releases.length) {
      const release = document.createElement("span");
      release.textContent = `${project.releases.length} release${project.releases.length > 1 ? "s" : ""}`;
      meta.append(release);
    }

    if (project.siteLink) {
      actions.append(createButton({ href: project.siteLink, label: "Acessar site", variant: "primary" }));
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
      state.projects = await window.GitHubPortfolio.fetchPortfolioData(config);
      updateLanguageFilter();
      updateStats();
      renderProjects();
    } catch (error) {
      const isRateLimit = error.status === 403;
      setStatus(
        isRateLimit
          ? "A API do GitHub limitou as requisições no momento. Tente recarregar a página em alguns minutos."
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

  loadProjects();
})();
