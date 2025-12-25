// ===== Year =====
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Header shadow on scroll =====
const siteHeader = document.querySelector(".site-header");
window.addEventListener(
  "scroll",
  () => {
    if (!siteHeader) return;
    siteHeader.classList.toggle("scrolled", window.scrollY > 10);
  },
  { passive: true }
);

// ===== Scroll progress bar =====
function scrollProgress() {
  const el = document.getElementById("scrollProgress");
  if (!el) return;

  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

  el.style.width = `${pct}%`;
}
window.addEventListener("scroll", scrollProgress, { passive: true });
window.addEventListener("load", scrollProgress);

// ===== Mobile nav toggle =====
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

navToggle?.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

navMenu?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

// ===== Projects =====
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
  card.style.cursor = "pointer";

  card.addEventListener("click", (ev) => {
    const isLink = ev.target.closest("a");
    if (isLink) return;
    openModal(p);
  });

  const media = document.createElement("div");
  media.className = "project-media";
  media.style.position = "relative";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = safeText(p.imageAlt || p.title || "Project screenshot");
  img.src = p.image || "assets/og-cover.png";
  img.onerror = () => {
    img.src = "assets/og-cover.png";
  };

  media.appendChild(img);

  if (p.featured) {
    const ribbon = document.createElement("div");
    ribbon.className = "ribbon";
    ribbon.innerHTML = `<span>⭐ Featured</span>`;
    media.appendChild(ribbon);
    card.classList.add("featured");
  }

  const body = document.createElement("div");
  body.className = "project-body";

  const title = document.createElement("h3");
  title.className = "project-title";
  title.textContent = safeText(p.title);

  const desc = document.createElement("p");
  desc.className = "project-desc";
  desc.textContent = safeText(p.description);

  const metrics = document.createElement("div");
  metrics.className = "metrics";
  (p.metrics || []).slice(0, 4).forEach((m) => {
    const b = document.createElement("span");
    b.className = "metric";
    b.textContent = safeText(m);
    metrics.appendChild(b);
  });

  const tags = document.createElement("div");
  tags.className = "tags";
  (p.tags || []).slice(0, 6).forEach((t) => {
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
    a.rel = "noopener noreferrer";
    a.textContent = "GitHub Repo";
    btnRow.appendChild(a);
  }

  if (p.excelUrl) {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = p.excelUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Excel Dashboard";
    btnRow.appendChild(a);
  }

  if (p.reportUrl) {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = p.reportUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Report";
    btnRow.appendChild(a);
  }

  body.appendChild(title);
  body.appendChild(desc);
  if ((p.metrics || []).length) body.appendChild(metrics);
  if ((p.tags || []).length) body.appendChild(tags);
  body.appendChild(btnRow);

  card.appendChild(media);
  card.appendChild(body);

  return card;
}

function render(list) {
  if (!projectsGrid) return;
  projectsGrid.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = `<h3>No projects found</h3><p class="muted">Try a different search or filter.</p>`;
    projectsGrid.appendChild(empty);
    return;
  }

  list.forEach((p) => projectsGrid.appendChild(createProjectCard(p)));

  document.querySelectorAll(".project-card").forEach((el) => {
    el.classList.add("reveal");
    requestAnimationFrame(() => el.classList.add("show"));
  });
}

function applyFilters() {
  const q = (projectSearch?.value || "").trim().toLowerCase();
  const f = projectFilter?.value || "all";

  const filtered = projects.filter((p) => {
    const haystack = [p.title, p.description, ...(p.tags || []), p.category]
      .join(" ")
      .toLowerCase();

    const matchText = !q || haystack.includes(q);
    const matchFilter = f === "all" || (p.category || "").toLowerCase() === f;
    return matchText && matchFilter;
  });

  render(filtered);
}

async function initProjects() {
  if (!projectsGrid) return;

  // Loading placeholder (better UX)
  projectsGrid.innerHTML = `
    <div class="card">
      <h3>Loading projects…</h3>
      <p class="muted">Fetching previews</p>
    </div>
  `;

  try {
    // Use stable version so browser can cache; bump v= when you update JSON
    const url = "data/projects.json?v=9";
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} while loading ${url}`);
    }

    const text = await res.text();

    try {
      projects = JSON.parse(text);
    } catch (jsonErr) {
      console.error("Invalid JSON in data/projects.json:", jsonErr);
      throw new Error("Invalid JSON in data/projects.json (check commas/brackets).");
    }

    projects.sort((a, b) => (b.featured === true) - (a.featured === true));

    const categories = uniq(
      projects.map((p) => (p.category || "").toLowerCase()).filter(Boolean)
    ).sort();

    // reset filter options (keep "All")
    if (projectFilter) {
      projectFilter
        .querySelectorAll("option:not([value='all'])")
        .forEach((o) => o.remove());
      categories.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c[0].toUpperCase() + c.slice(1);
        projectFilter.appendChild(opt);
      });
    }

    render(projects);

    projectSearch?.addEventListener("input", applyFilters);
    projectFilter?.addEventListener("change", applyFilters);
  } catch (e) {
    console.error(e);
    projectsGrid.innerHTML = `<div class="card">
      <h3>Could not load projects</h3>
      <p class="muted">Check <code>data/projects.json</code> path and refresh.</p>
    </div>`;
  }
}
initProjects();

// ===== Scroll reveal (IntersectionObserver) =====
function setupReveal() {
  const targets = document.querySelectorAll(
    ".section .card, .section-head, .hero-copy, .hero-card"
  );
  targets.forEach((el) => el.classList.add("reveal"));

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("show");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => obs.observe(el));
}
window.addEventListener("load", setupReveal);

// ===== Modal Logic =====
const projectModal = document.getElementById("projectModal");
const modalClose = document.getElementById("modalClose");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalTags = document.getElementById("modalTags");
const modalGithub = document.getElementById("modalGithub");
const modalExcel = document.getElementById("modalExcel");
const modalReport = document.getElementById("modalReport");

function openModal(p) {
  if (!projectModal) return;

  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (modalImg) {
    modalImg.src = p.image || "assets/og-cover.png";
    modalImg.alt = p.imageAlt || p.title || "Project preview";
    modalImg.onerror = () => (modalImg.src = "assets/og-cover.png");
  }
  if (modalTitle) modalTitle.textContent = p.title || "";
  if (modalDesc) modalDesc.textContent = p.description || "";

  if (modalTags) {
    modalTags.innerHTML = "";
    (p.tags || []).forEach((t) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = t;
      modalTags.appendChild(tag);
    });
  }

  if (modalGithub) {
    if (p.githubUrl) {
      modalGithub.href = p.githubUrl;
      modalGithub.style.display = "inline-flex";
    } else {
      modalGithub.style.display = "none";
    }
  }
  if (modalExcel) {
    if (p.excelUrl) {
      modalExcel.href = p.excelUrl;
      modalExcel.style.display = "inline-flex";
    } else {
      modalExcel.style.display = "none";
    }
  }
  if (modalReport) {
    if (p.reportUrl) {
      modalReport.href = p.reportUrl;
      modalReport.style.display = "inline-flex";
    } else {
      modalReport.style.display = "none";
    }
  }
}

function closeModal() {
  if (!projectModal) return;
  projectModal.classList.remove("open");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

modalClose?.addEventListener("click", closeModal);
projectModal?.addEventListener("click", (e) => {
  const target = e.target;
  if (target?.dataset?.close === "true") closeModal();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ===== Active section highlight in navbar =====
function setupActiveNav() {
  const header = document.querySelector(".site-header");
  const links = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));

  function getSections() {
    return links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  }

  function setActive(id) {
    links.forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === `#${id}`)
    );
  }

  function headerOffset() {
    return (header ? header.offsetHeight : 0) + 18;
  }

  function onScroll() {
    const sections = getSections();
    if (!sections.length) return;

    const nearBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6;

    if (nearBottom) {
      setActive(sections[sections.length - 1].id);
      return;
    }

    const markerY = headerOffset();
    let current = sections[0];

    for (const sec of sections) {
      const r = sec.getBoundingClientRect();
      if (r.top <= markerY && r.bottom > markerY) {
        current = sec;
        break;
      }
      if (r.top <= markerY) current = sec;
    }

    setActive(current.id);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", onScroll);

  links.forEach((a) => {
    a.addEventListener("click", () => {
      const id = a.getAttribute("href").replace("#", "");
      setActive(id);
    });
  });

  onScroll();
}
setupActiveNav();

// ===== Back to top fallback =====
document.querySelectorAll('a[href="#top"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
