const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();
// Header shadow on scroll
const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 10);
});

// ===== Scroll progress bar (auto-insert) =====
(function addProgressBar(){
  const wrap = document.createElement("div");
  wrap.className = "progress-wrap";
  wrap.innerHTML = `<div class="progress-bar" id="scrollProgress"></div>`;
  document.body.prepend(wrap);
})();

const scrollProgress = () => {
  const el = document.getElementById("scrollProgress");
  if (!el) return;

  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

  el.style.width = `${pct}%`;
};

window.addEventListener("scroll", scrollProgress, { passive: true });
window.addEventListener("load", scrollProgress);

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
  // Make whole card clickable
  card.style.cursor = "pointer";
  card.addEventListener("click", (ev) => {
    // If user clicks a button link, don't open modal
    const isLink = ev.target.closest("a");
    if (isLink) return;
    openModal(p);
  });

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
  // reveal newly rendered project cards
document.querySelectorAll(".project-card").forEach(el => {
  el.classList.add("reveal");
  requestAnimationFrame(() => el.classList.add("show"));
});

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
// Scroll reveal (IntersectionObserver)
function setupReveal() {
  const targets = document.querySelectorAll(".section .card, .section-head, .hero-copy, .hero-card");
  targets.forEach(el => el.classList.add("reveal"));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => obs.observe(el));
}

window.addEventListener("load", () => {
  setupReveal();
});
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

function openModal(p){
  if (!projectModal) return;

  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  modalImg.src = p.image || "";
  modalImg.alt = p.imageAlt || p.title || "Project preview";
  modalTitle.textContent = p.title || "";
  modalDesc.textContent = p.description || "";

  // Tags
  modalTags.innerHTML = "";
  (p.tags || []).forEach(t => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = t;
    modalTags.appendChild(tag);
  });

  // Links (hide if empty)
  if (p.githubUrl) { modalGithub.href = p.githubUrl; modalGithub.style.display = "inline-flex"; }
  else { modalGithub.style.display = "none"; }

  if (p.excelUrl) { modalExcel.href = p.excelUrl; modalExcel.style.display = "inline-flex"; }
  else { modalExcel.style.display = "none"; }

  if (p.reportUrl) { modalReport.href = p.reportUrl; modalReport.style.display = "inline-flex"; }
  else { modalReport.style.display = "none"; }
}

function closeModal(){
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
// ===== Active section highlight (scroll position based) =====
function setupActiveNav(){
  const header = document.querySelector(".site-header");
  const headerH = () => (header ? header.offsetHeight : 0);

  const links = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
  const sections = links
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  function setActive(id){
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
  }

  function onScroll(){
    const offset = headerH() + 16;
    const scrollPos = window.scrollY + offset;
const nearBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

  if (nearBottom && sections.length){
    setActive(sections[sections.length - 1].id);
    return;
  }
    let currentId = sections[0]?.id || "home";
    for (const sec of sections){
      if (sec.offsetTop <= scrollPos) currentId = sec.id;
    }

    setActive(currentId);
  }

  // Update on scroll + on load + when resizing
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", () => {
    // If URL has a hash, honor it first
    const hash = location.hash?.replace("#", "");
    if (hash) setActive(hash);
    onScroll();
  });

  // Also update when clicking links (instant highlight)
  links.forEach(a => {
    a.addEventListener("click", () => {
      const id = a.getAttribute("href").replace("#", "");
      setActive(id);
    });
  });
}

setupActiveNav();


window.addEventListener("load", () => {
  setupActiveNav();
});
