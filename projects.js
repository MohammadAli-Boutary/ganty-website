/* ============================================================
   GANTY - PROJECTS LISTING (CMS data + filter + counts)
   ============================================================ */
(function () {
  const grid = document.querySelector(".proj-grid");
  const chips = document.querySelectorAll(".filter-chip");
  if (!grid) return;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const normalizeAsset = (src) => String(src || "").replace(/^\/+/, "");
  const stripTags = (value) => String(value || "").replace(/<[^>]*>/g, "");

  function projectCard(project, index) {
    const isComing = Boolean(project.comingSoon);
    const tag = isComing ? "div" : "a";
    const href = isComing ? "" : ` href="${escapeHtml(project.url || "#")}"`;
    const classes = [
      "proj-card",
      project.featured ? "proj-card--feature" : "",
      isComing ? "is-coming" : "",
    ].filter(Boolean).join(" ");
    const number = String(index + 1).padStart(2, "0");
    const year = project.year ? ` — ${escapeHtml(project.year)}` : "";
    const plainTitle = String(project.title || "");
    const styledTitle = String(project.titleHtml || "");
    const title = styledTitle && stripTags(styledTitle) === plainTitle
      ? styledTitle
      : escapeHtml(plainTitle);

    return `
      <${tag} class="${classes}"${href} data-cat="${escapeHtml(project.categoryKey)}" data-cursor="view">
        ${isComing ? '<span class="proj-card__soon">Case Study Soon</span>' : ""}
        <img class="img-fade" src="${escapeHtml(normalizeAsset(project.image))}" alt="${escapeHtml(project.alt || project.title)}" loading="lazy"/>
        <div class="proj-card__meta">
          <div class="proj-card__top">
            <span class="proj-card__cat">${escapeHtml(project.category)}</span>
            <span class="proj-card__num">${number}${year}</span>
          </div>
          <div class="proj-card__bottom">
            <h3 class="proj-card__name">${title}</h3>
            <span class="proj-card__sub">${escapeHtml(project.subtitle)}</span>
          </div>
        </div>
      </${tag}>`;
  }

  async function loadProjects() {
    try {
      const response = await fetch("data/projects.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Projects data returned ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.projects)) throw new Error("Projects data is missing a projects array");
      grid.innerHTML = data.projects.map(projectCard).join("");
    } catch (error) {
      console.warn("Using static project cards because CMS data could not load.", error);
    }
  }

  function initImgFade(scope) {
    scope.querySelectorAll(".img-fade").forEach((img) => {
      const mark = () => img.classList.add("is-loaded");
      if (img.complete) mark();
      else img.addEventListener("load", mark, { once: true });
    });
  }

  function initCardCursor(scope) {
    const ring = document.querySelector(".cursor-ring");
    if (!ring || window.matchMedia("(max-width: 900px)").matches) return;
    scope.querySelectorAll('[data-cursor="view"]').forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-view"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-view"));
    });
  }

  function initFilters() {
    const cards = Array.from(document.querySelectorAll(".proj-card"));
    if (!cards.length) return;

    const counts = { all: cards.length };
    cards.forEach((card) => {
      const cat = card.dataset.cat;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    document.querySelectorAll("[data-count]").forEach((el) => {
      const key = el.dataset.count;
      el.textContent = counts[key] != null ? `(${counts[key]})` : "(0)";
    });

    const originalFeature = new WeakMap();
    cards.forEach((card) => originalFeature.set(card, card.classList.contains("proj-card--feature")));

    function rebalance(visible) {
      cards.forEach((card) => {
        card.classList.toggle("proj-card--feature", originalFeature.get(card));
        card.classList.remove("proj-card--solo");
      });

      const total = visible.length;
      if (total === 0 || total === cards.length) return;
      if (total === 1) {
        visible[0].classList.remove("proj-card--feature");
        visible[0].classList.add("proj-card--solo");
        return;
      }

      const featuresNeeded = (3 - (total % 3)) % 3;
      const pattern = [];
      for (let i = 0; i < featuresNeeded; i++) pattern.push("F", "N");
      while (pattern.length < total) pattern.push("N");

      visible.forEach((card) => card.classList.remove("proj-card--feature"));
      visible.forEach((card, index) => {
        if (pattern[index] === "F") card.classList.add("proj-card--feature");
      });
    }

    function applyFilter(filter) {
      const visible = [];
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.cat === filter;
        card.classList.toggle("is-hidden", !match);
        if (match) visible.push(card);
      });

      rebalance(visible);

      if (window.gsap) {
        gsap.fromTo(visible,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.04 });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((item) => item.classList.remove("is-active"));
        chip.classList.add("is-active");
        applyFilter(chip.dataset.filter);
      });
    });

    if (window.gsap) {
      gsap.fromTo(cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power3.out", delay: 0.15 });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await loadProjects();
    initImgFade(grid);
    initCardCursor(grid);
    initFilters();
  });
})();
