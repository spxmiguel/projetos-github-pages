(function () {
  const API_BASE = "https://api.github.com";
  const PAGE_SIZE = 100;
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const CACHE_VERSION = 2;

  function getCacheKey(config) {
    const username = (config.githubUsername || "").toLowerCase();
    const parts = [
      "github-projects-cache",
      CACHE_VERSION,
      username,
      config.includeForks ? "forks" : "no-forks",
      config.includeArchived ? "archived" : "no-archived",
      config.sortBy || "updated",
    ];

    return parts.join(":");
  }

  function readCache(config, { allowExpired = false } = {}) {
    try {
      const rawCache = localStorage.getItem(getCacheKey(config));

      if (!rawCache) {
        return null;
      }

      const cache = JSON.parse(rawCache);
      const isExpired = Date.now() - cache.savedAt > CACHE_TTL_MS;

      if (isExpired && !allowExpired) {
        return null;
      }

      return {
        projects: cache.projects || [],
        savedAt: cache.savedAt,
        expiresAt: cache.savedAt + CACHE_TTL_MS,
        stale: isExpired,
      };
    } catch (error) {
      return null;
    }
  }

  function writeCache(config, projects) {
    try {
      localStorage.setItem(
        getCacheKey(config),
        JSON.stringify({
          savedAt: Date.now(),
          projects,
        })
      );
    } catch (error) {
      // Cache is optional. The site still works if storage is unavailable.
    }
  }

  async function requestJson(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      const error = new Error(`GitHub API retornou ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async function fetchAllPages(url) {
    const items = [];
    let page = 1;

    while (true) {
      const separator = url.includes("?") ? "&" : "?";
      const pageUrl = `${url}${separator}per_page=${PAGE_SIZE}&page=${page}`;
      const pageItems = await requestJson(pageUrl);

      items.push(...pageItems);

      if (pageItems.length < PAGE_SIZE) {
        return items;
      }

      page += 1;
    }
  }

  function normalizeAsset(asset) {
    const name = asset.name || "";
    const lowerName = name.toLowerCase();
    let platform = null;

    if (/\b(win|windows|\.exe|\.msi)\b/.test(lowerName)) {
      platform = "Windows";
    } else if (/\b(mac|macos|darwin|\.dmg|\.pkg)\b/.test(lowerName)) {
      platform = "Mac";
    }

    return platform
      ? {
          platform,
          name,
          downloadUrl: asset.browser_download_url,
          size: asset.size,
        }
      : null;
  }

  function findReadmeLink(repo) {
    return `${repo.html_url}#readme`;
  }

  function findSiteLink(repo) {
    // Only use the homepage if it appears to be a GitHub Pages URL.
    // This avoids arbitrary links (e.g., a README link) being used as the project site.
    if (repo.homepage && /^https?:\/\//i.test(repo.homepage) && repo.homepage.includes('.github.io')) {
      return repo.homepage;
    }

    // If the repository has GitHub Pages enabled, construct the default URL.
    if (repo.has_pages) {
      return `https://${repo.owner.login}.github.io/${repo.name}/`;
    }

    // Otherwise, no explicit site link.
    return null;
  }

  function decodeBase64(content) {
    const normalized = content.replace(/\n/g, "");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function findReadmeSiteLink(readmeText, repo) {
    const links = [...readmeText.matchAll(/(?:\[[^\]]+\]\((https?:\/\/[^)\s]+)\))|(https?:\/\/[^\s)<>"']+)/gi)]
      .map((match) => match[1] || match[2])
      .map((url) => url.replace(/[.,;:!?]+$/, ""))
      .filter(Boolean);

    return (
      links.find((url) => url.includes(`${repo.owner.login}.github.io`)) ||
      links.find((url) => !url.includes("github.com") && !url.match(/\.(png|jpe?g|gif|svg|webp)$/i)) ||
      null
    );
  }

  async function fetchReadmeSiteLink(repo) {
    try {
      const readme = await requestJson(`${API_BASE}/repos/${repo.full_name}/readme`);
      const readmeText = decodeBase64(readme.content || "");
      return findReadmeSiteLink(readmeText, repo);
    } catch (error) {
      return null;
    }
  }

  async function fetchRepoReleases(repo) {
    const releases = await requestJson(`${API_BASE}/repos/${repo.full_name}/releases`);
    const officialReleases = releases.filter((release) => !release.draft);
    const downloads = [];

    for (const release of officialReleases) {
      for (const asset of release.assets || []) {
        const normalized = normalizeAsset(asset);

        if (normalized) {
          downloads.push({
            ...normalized,
            releaseName: release.name || release.tag_name,
            publishedAt: release.published_at,
          });
        }
      }
    }

    const preferredDownloads = ["Windows", "Mac"]
      .map((platform) => downloads.find((download) => download.platform === platform))
      .filter(Boolean);

    return {
      releases: officialReleases,
      downloads: preferredDownloads,
    };
  }

  async function fetchFreshProjectsData(config) {
    const username = config.githubUsername;
    const sort = config.sortBy || "updated";
    const repos = await fetchAllPages(`${API_BASE}/users/${username}/repos?sort=${sort}`);
    const visibleRepos = repos.filter((repo) => {
      if (!config.includeForks && repo.fork) return false;
      if (!config.includeArchived && repo.archived) return false;
      return !repo.private;
    });

    const enrichedRepos = await Promise.all(
      visibleRepos.map(async (repo) => {
        const directSiteLink = findSiteLink(repo);
        const readmeSiteLink = directSiteLink ? null : await fetchReadmeSiteLink(repo);

        try {
          const releaseData = await fetchRepoReleases(repo);

          return {
            ...repo,
            // Prefer explicit homepage or GitHub Pages detected via API
            // If none, construct default GitHub Pages URL for the repo
            siteLink: directSiteLink || `https://${config.githubUsername}.github.io/${repo.name}/`,
            readmeLink: findReadmeLink(repo),
            repoLink: repo.html_url,
            releases: releaseData.releases,
            downloads: releaseData.downloads,
            releasesError: null,
          };
        } catch (error) {
          return {
            ...repo,
            siteLink: directSiteLink || readmeSiteLink,
            readmeLink: findReadmeLink(repo),
            releases: [],
            downloads: [],
            releasesError: error,
          };
        }
      })
    );

    return enrichedRepos;
  }

  async function fetchProjectsData(config) {
    const cached = readCache(config);

    if (cached) {
      return {
        projects: cached.projects,
        cached: true,
        stale: false,
        savedAt: cached.savedAt,
        expiresAt: cached.expiresAt,
      };
    }

    try {
      const projects = await fetchFreshProjectsData(config);
      writeCache(config, projects);

      return {
        projects,
        cached: false,
        stale: false,
        savedAt: Date.now(),
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
    } catch (error) {
      const staleCache = readCache(config, { allowExpired: true });

      if (staleCache) {
        return {
          projects: staleCache.projects,
          cached: true,
          stale: true,
          savedAt: staleCache.savedAt,
          expiresAt: staleCache.expiresAt,
          error,
        };
      }

      throw error;
    }
  }

  window.GitHubProjects = {
    fetchProjectsData,
  };
})();
