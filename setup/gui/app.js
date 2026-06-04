const form = document.querySelector("#setupForm");
const output = document.querySelector("#output");
const submitButton = document.querySelector("#submitButton");
const siteLink = document.querySelector("#siteLink");
const githubUsername = document.querySelector("#githubUsername");
const repoName = document.querySelector("#repoName");
const siteTitle = document.querySelector("#siteTitle");
const siteDescription = document.querySelector("#siteDescription");
const profileImageUrl = document.querySelector("#profileImageUrl");
const profileImageFile = document.querySelector("#profileImageFile");
const ctaMode = document.querySelector("#ctaMode");

function setStatus(id, status) {
  const element = document.querySelector(id);
  element.textContent = status.ok ? status.label : status.label;
  element.className = status.ok ? "ok" : "bad";
}

async function toDataUrl(file) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function loadStatus() {
  const response = await fetch("/api/status");
  const status = await response.json();

  setStatus("#gitStatus", status.git);
  setStatus("#ghStatus", status.gh);
  setStatus("#authStatus", status.auth);

  if (status.config) {
    githubUsername.value = status.config.githubUsername || "";
    repoName.value = status.repoName || "projetos-github-pages";
    siteTitle.value = status.config.siteTitle || "";
    siteDescription.value = status.config.siteDescription || "";
    profileImageUrl.value = status.config.profileImageUrl?.startsWith("http") ? status.config.profileImageUrl : "";
    ctaMode.value = status.config.ctaMode || "top";
  }

  if (!status.git.ok || !status.gh.ok || !status.auth.ok) {
    output.textContent = status.help;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  output.textContent = "Configurando...\n";
  siteLink.hidden = true;

  try {
    const file = profileImageFile.files[0] || null;
    const payload = {
      githubUsername: githubUsername.value.trim(),
      repoName: repoName.value.trim(),
      siteTitle: siteTitle.value.trim(),
      siteDescription: siteDescription.value.trim(),
      profileImageUrl: profileImageUrl.value.trim(),
      ctaMode: ctaMode.value,
      imageFile: file
        ? {
            name: file.name,
            type: file.type,
            dataUrl: await toDataUrl(file),
          }
        : null,
    };

    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    output.textContent = result.log || "Finalizado.";

    if (result.siteUrl) {
      siteLink.href = result.siteUrl;
      siteLink.hidden = false;
    }

    if (!response.ok) {
      output.textContent += "\n\nRevise os pontos acima e tente novamente.";
    }
  } catch (error) {
    output.textContent = `Erro inesperado: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }
});

loadStatus().catch((error) => {
  output.textContent = `Nao foi possivel carregar o status: ${error.message}`;
});
