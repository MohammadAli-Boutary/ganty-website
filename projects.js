/* ============================================================
   GANTY — PROJECTS LISTING (filter + counts)
   ============================================================ */
(function () {
  const cards = document.querySelectorAll(".proj-card");
  const chips = document.querySelectorAll(".filter-chip");
  if (!cards.length) return;

  // ---------- counts
  const counts = { all: cards.length };
  cards.forEach((c) => {
    const cat = c.dataset.cat;
    counts[cat] = (counts[cat] || 0) + 1;
  });
  document.querySelectorAll("[data-count]").forEach((el) => {
    const k = el.dataset.count;
    if (counts[k] != null) el.textContent = `(${counts[k]})`;
  });

  // ---------- filter
  function applyFilter(filter) {
    const visible = [];
    cards.forEach((c) => {
      const match = filter === "all" || c.dataset.cat === filter;
      if (match) {
        c.classList.remove("is-hidden");
        visible.push(c);
      } else {
        c.classList.add("is-hidden");
      }
    });

    // rebalance layout so leftovers never look orphaned
    rebalance(visible);

    if (window.gsap) {
      gsap.fromTo(visible,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.04 });
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  // Reset feature-class to whatever it was at load, then re-decide based on visible count
  const originalFeature = new WeakMap();
  cards.forEach((c) => originalFeature.set(c, c.classList.contains("proj-card--feature")));

  function rebalance(visible) {
    // reset all to original feature state
    cards.forEach((c) => {
      c.classList.toggle("proj-card--feature", originalFeature.get(c));
      c.classList.remove("proj-card--solo");
    });

    const N = visible.length;
    if (N === 0) return;

    // if everything is visible, keep the original layout intact
    if (N === cards.length) return;

    if (N === 1) {
      // lone card spans full row
      visible[0].classList.remove("proj-card--feature");
      visible[0].classList.add("proj-card--solo");
      return;
    }

    // Compute features needed so every row sums to 3 cols.
    // Feature = 2 cols, Normal = 1 col. Total cols = N + F. Must be divisible by 3.
    const F = (3 - (N % 3)) % 3;
    // Build a layout pattern: F chunks of "FN" then the rest as "NNN" triples.
    // Features go FIRST so the most prominent images lead the page.
    const pattern = [];
    for (let i = 0; i < F; i++) pattern.push("F", "N");
    while (pattern.length < N) pattern.push("N");

    // strip all features on visible set, then re-apply per pattern
    visible.forEach((c) => c.classList.remove("proj-card--feature"));
    for (let i = 0; i < N; i++) {
      if (pattern[i] === "F") visible[i].classList.add("proj-card--feature");
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      applyFilter(chip.dataset.filter);
    });
  });

  // ---------- card entry animation on load (does NOT hide cards if anim fails)
  if (window.gsap) {
    gsap.fromTo(cards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power3.out", delay: 0.15 }
    );
  }
})();
