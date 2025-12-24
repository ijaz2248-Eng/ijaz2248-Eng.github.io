const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
navToggle?.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open ? "true" : "false");
});
navMenu?.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const projectsGrid = document.getElementById("projectsGrid");
const projectSearch = document.getElementById("projectSearch");
const projectFilter = document.getElementById("projectFilter");

let projects = [];

function uniq(arr) {
  return [...new Set(arr)];
}

function safeText(s) {
  return String(s ?? "");
}

function createProjectCard(p) {
  const card = document.createElement("article");
  card.className = "card project-card";

  const media = document.createElement("div");
  media.className = "project-media";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = safeText(p.imageAlt || p.title || "Project screenshot");
  img.src = p.image || "";
  media.appendChild(img);

  const body = document.createElement("div");
  body.className = "project-body";

  const title = document.createElement("h3");
  title.className = "project-title";
  title.textContent = safeText(p.title);

  const desc = document.createElement("p");
  desc.className = "project-desc";
  desc.textContent = safeText(p.description);

  const tags = document.createElement("div");
  tags.className = "tags";
  (p.tags || []).slice(0, 6).forEach(t => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = safeText(t);
    tags.appendChild(tag);
  });

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";

  if (p.githubUrl) {
    const a = document.createElement("a");
    a.className = "btn primary";
    a.href = p.githubUrl;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = "GitHub Repo";
    btnRow.appendChild(a);
  }

  if (p.excelUrl) {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = p.excelUrl;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = "Excel Dashboard";
    btnRow.appendChild(a);
  }

  if (p.reportUrl) {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = p.reportUrl;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = "Report";
    btnRow.appendChild(a);
  }

  body.appendChild(title);
  body.appendChild(desc);
  if ((p.tags || []).length) body.appendChild(tags);
  body.appendChild(btnRow);

  card.appendChild(media);
  card.appendChild(body);

  return card;
}

function render(list) {
  projectsGrid.innerHTML = "";
  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = `<h3>No projects found</h3><p class="muted">Try a different search or filter.</p>`;
    projectsGrid.appendChild(empty);
    return;
  }
  list.forEach(p => projectsGrid.appendChild(createProjectCard(p)));
}

function applyFilters() {
  const q = (projectSearch?.value || "").trim().toLowerCase();
  const f = projectFilter?.value || "all";

  const filtered = projects.filter(p => {
    const haystack = [
      p.title, p.description, ...(p.tags || []), p.category
    ].join(" ").toLowerCase();

    const matchText = !q || haystack.includes(q);
    const matchFilter = f === "all" || (p.category || "").toLowerCase() === f;
    return matchText && matchFilter;
  });

  render(filtered);
}

async function init() {
  try {
    const res = await fetch("data/projects.json", { cache: "no-store" });
    projects = await res.json();

    // Fill filter dropdown (categories)
    const categories = uniq(
      projects.map(p => (p.category || "").toLowerCase()).filter(Boolean)
    ).sort();

    categories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c[0].toUpperCase() + c.slice(1);
      projectFilter.appendChild(opt);
    });

    render(projects);

    projectSearch?.addEventListener("input", applyFilters);
    projectFilter?.addEventListener("change", applyFilters);
  } catch (e) {
    projectsGrid.innerHTML = `<div class="card">
      <h3>Could not load projects</h3>
      <p class="muted">Check that <code>data/projects.json</code> exists and is valid JSON.</p>
    </div>`;
  }
}

init();
