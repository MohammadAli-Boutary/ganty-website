/* ============================================================
   GANTY — GSAP CHOREOGRAPHY
   ============================================================ */
(function () {
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* -------------------------------------------------- Lenis smooth scroll */
  function initLenis() {
    if (typeof Lenis === "undefined" || reduceMotion || isMobile) {
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const id = a.getAttribute("href");
          if (!id || id === "#" || id.length < 2) return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        });
      });
      return null;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1.05,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // refresh ScrollTrigger once layout is stable
    setTimeout(() => ScrollTrigger.refresh(), 120);

    // hash-link interception so anchor jumps still feel smooth
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#" || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.2 });
      });
    });

    window.lenis = lenis;
    return lenis;
  }

  /* -------------------------------------------------- helpers */
  const splitToWords = (el) => {
    if (!el) return [];
    const text = el.textContent.trim();
    el.textContent = "";
    const words = text.split(/(\s+)/);
    const spans = [];
    words.forEach((w) => {
      if (/^\s+$/.test(w)) {
        el.appendChild(document.createTextNode(" "));
      } else {
        const wrap = document.createElement("span");
        wrap.className = "reveal-mask";
        wrap.style.display = "inline-block";
        const inner = document.createElement("span");
        inner.className = "reveal-word";
        inner.textContent = w;
        wrap.appendChild(inner);
        el.appendChild(wrap);
        spans.push(inner);
      }
    });
    return spans;
  };

  /* -------------------------------------------------- preloader */
  function runPreloader() {
    const pre = document.querySelector(".preloader");
    const counter = document.querySelector(".preloader__counter");
    if (!pre) return Promise.resolve();

    return new Promise((resolve) => {
      let n = 0;
      const tick = () => {
        n += Math.random() * 9 + 2;
        if (n >= 100) {
          n = 100;
          counter.textContent = "100";
          setTimeout(finish, 220);
        } else {
          counter.textContent = String(Math.floor(n)).padStart(3, "0");
          setTimeout(tick, 60);
        }
      };
      tick();

      function finish() {
        gsap.to(pre, {
          y: "-100%",
          duration: 1.1,
          ease: "expo.inOut",
          onComplete: () => {
            pre.style.display = "none";
            resolve();
          },
        });
      }
    });
  }

  /* -------------------------------------------------- cursor */
  function initCursor() {
    if (isMobile) return;
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      gsap.to(dot, { x: mx, y: my, duration: 0.05, overwrite: true });
    });

    gsap.ticker.add(() => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    });

    document.querySelectorAll("[data-cursor=\"view\"]").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-view"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-view"));
    });
  }

  /* -------------------------------------------------- premium interaction layer */
  function initHeroAmbient() {
    if (isMobile || reduceMotion) return;
    const hero = document.querySelector(".hero");
    const bg = document.querySelector(".hero__bg");
    if (!hero || !bg) return;

    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      bg.style.setProperty("--mx", `${x}%`);
      bg.style.setProperty("--my", `${y}%`);
    });
  }

  function initMagneticControls(scope = document) {
    if (!canHover || reduceMotion) return;
    scope.querySelectorAll(".btn, .nav__cta, .filter-chip").forEach((el) => {
      if (el.dataset.magneticBound) return;
      el.dataset.magneticBound = "true";
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, {
          x: x * 0.16,
          y: y * 0.22,
          scale: 1.025,
          duration: 0.45,
          ease: "power3.out",
          overwrite: true,
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" });
      });
    });
  }

  function initEditorialHover(scope = document) {
    if (!canHover || reduceMotion) return;
    scope.querySelectorAll(".dream, .proj-card, .pd-gallery__item").forEach((card) => {
      if (card.dataset.editorialHoverBound) return;
      card.dataset.editorialHoverBound = "true";
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--rx", `${-py * 5}deg`);
        card.style.setProperty("--ry", `${px * 5}deg`);
        card.style.setProperty("--sx", `${(px + 0.5) * 100}%`);
        card.style.setProperty("--sy", `${(py + 0.5) * 100}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  function initImageReveals(scope = document) {
    if (reduceMotion) return;
    scope.querySelectorAll(".img-fade").forEach((img) => {
      if (img.dataset.revealBound) return;
      img.dataset.revealBound = "true";
      const target = img.closest(".dream, .proj-card, .pd-gallery__item, .about__photo, .pd-hero__media") || img;
      gsap.set(target, { clipPath: "inset(10% 0% 10% 0%)" });
      gsap.set(img, { scale: 1.08 });
      ScrollTrigger.create({
        trigger: target,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(target, {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.25,
            ease: "expo.out",
          });
          gsap.to(img, {
            scale: 1,
            duration: 1.45,
            ease: "power3.out",
          });
        },
      });
    });
  }

  function initSectionDrift(scope = document) {
    if (reduceMotion) return;
    scope.querySelectorAll(".stat, .contact__row, .pd-meta__item").forEach((el, index) => {
      if (el.dataset.driftBound) return;
      el.dataset.driftBound = "true";
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 88%" },
        y: 26,
        opacity: 0,
        filter: "blur(8px)",
        duration: 0.85,
        delay: Math.min(index * 0.025, 0.18),
        ease: "power3.out",
      });
    });
  }

  function initPageTransitions() {
    if (reduceMotion) return;
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash && url.pathname === window.location.pathname) return;
      if (!url.pathname.endsWith(".html") && url.pathname !== "/" && !url.pathname.endsWith("/")) return;
      e.preventDefault();
      document.body.classList.add("page-is-leaving");
      setTimeout(() => { window.location.href = url.href; }, 420);
    });
  }

  function initPremiumMotion(scope = document) {
    initMagneticControls(scope);
    initEditorialHover(scope);
    initImageReveals(scope);
    initSectionDrift(scope);
  }

  /* -------------------------------------------------- nav scroll */
  function initNav() {
    const nav = document.querySelector(".nav");
    ScrollTrigger.create({
      start: 80,
      end: 99999,
      onUpdate: (self) => {
        nav.classList.toggle("is-scrolled", self.scroll() > 60);
      },
    });

    const burger = document.querySelector(".nav__burger");
    const overlay = document.querySelector(".menu-overlay");
    if (!burger || !overlay) return;
    burger.addEventListener("click", () => {
      const open = !overlay.classList.contains("is-open");
      overlay.classList.toggle("is-open", open);
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      overlay.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("menu-is-open", open);
      if (open) {
        gsap.from(".menu-overlay__links li", {
          y: 60, opacity: 0, duration: 0.7, stagger: 0.08, delay: 0.25, ease: "power3.out",
        });
      }
    });
    overlay.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        overlay.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("menu-is-open");
      })
    );
  }

  /* -------------------------------------------------- hero */
  function initHero() {
    const lines = document.querySelectorAll(".hero__title-line .word");
    const eyebrow = document.querySelector(".hero__eyebrow");
    const sub = document.querySelector(".hero__sub");
    const ctas = document.querySelector(".hero__ctas");

    gsap.set(lines, { y: 140, opacity: 0 });

    const tl = gsap.timeline({ delay: isMobile ? 0 : 0.1 });
    tl.to(eyebrow, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0)
      .to(lines, {
        y: 0,
        opacity: 1,
        duration: isMobile ? 0.75 : 1.2,
        stagger: isMobile ? 0.04 : 0.09,
        ease: "power4.out",
      }, isMobile ? 0.05 : 0.15)
      .to(sub, { opacity: 1, duration: isMobile ? 0.55 : 0.9, ease: "power2.out" }, isMobile ? 0.35 : 0.7)
      .to(ctas, { opacity: 1, duration: isMobile ? 0.55 : 0.8, ease: "power2.out" }, isMobile ? 0.45 : 0.85);

    // hero parallax
    if (isMobile || reduceMotion) return;
    const bg = document.querySelector(".hero__bg");
    const noise = document.querySelector(".hero__noise");
    gsap.to(bg, {
      yPercent: 22,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(noise, {
      yPercent: 10,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__inner", {
      yPercent: -10,
      opacity: 0.4,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  /* -------------------------------------------------- marquee */
  function initMarquee() {
    const track = document.querySelector(".marquee__track");
    if (!track) return;
    // duplicate so the loop is seamless
    const html = track.innerHTML;
    track.innerHTML = html + html;
    const totalW = track.scrollWidth / 2;
    gsap.to(track, {
      x: -totalW,
      duration: 35,
      ease: "none",
      repeat: -1,
    });
  }

  /* -------------------------------------------------- section heads */
  function initSectionHeads() {
    document.querySelectorAll(".section-head__title").forEach((title) => {
      const words = splitToWords(title);
      gsap.set(words, { y: "120%" });
      ScrollTrigger.create({
        trigger: title,
        start: "top 82%",
        onEnter: () =>
          gsap.to(words, {
            y: "0%",
            duration: 1.1,
            stagger: 0.07,
            ease: "power4.out",
          }),
      });
    });

    document.querySelectorAll(".section-head__rule").forEach((rule) => {
      gsap.set(rule, { scaleX: 0 });
      ScrollTrigger.create({
        trigger: rule,
        start: "top 90%",
        onEnter: () =>
          gsap.to(rule, { scaleX: 1, duration: 1, ease: "power3.out", delay: 0.3 }),
      });
    });

    document.querySelectorAll("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 85%" },
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
    });
  }

  /* -------------------------------------------------- stats counter */
  function initStats() {
    document.querySelectorAll(".stat").forEach((stat) => {
      const numEl = stat.querySelector(".stat__num .val");
      if (!numEl) return;
      const final = +numEl.dataset.to;
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: stat,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            v: final,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => { numEl.textContent = Math.floor(obj.v); },
          });
        },
      });
    });
  }

  /* -------------------------------------------------- service tilt */
  function initServiceTilt() {
    if (isMobile) return;
    document.querySelectorAll(".service").forEach((card) => {
      card.style.transformStyle = "preserve-3d";
      card.style.perspective = "800px";
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotationY: px * 10,
          rotationX: -py * 10,
          duration: 0.6,
          ease: "power2.out",
        });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.8, ease: "power2.out" });
      });
    });

    // staggered reveal
    gsap.from(".service", {
      scrollTrigger: { trigger: ".services__grid", start: "top 80%" },
      y: 60,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
    });
  }

  /* -------------------------------------------------- work — editorial list */
  function initWork() {
    const rows = gsap.utils.toArray(".work-row");
    if (!rows.length) return;

    gsap.from(rows, {
      scrollTrigger: { trigger: ".work-list", start: "top 80%" },
      y: 40,
      opacity: 0,
      duration: 0.85,
      stagger: 0.08,
      ease: "power3.out",
    });
  }

  /* -------------------------------------------------- timeline (pinned scroll-driven) */
  function initTimeline() {
    const pin = document.querySelector(".timeline__pin");
    const track = document.querySelector(".timeline__track");
    const nodes = gsap.utils.toArray(".tl-node");
    const progress = document.querySelector(".timeline__progress");
    const featureYear = document.querySelector(".timeline__feature-year");
    const featureLabel = document.querySelector(".timeline__feature-label");
    if (!pin || !track || !nodes.length) return;

    // total horizontal distance to travel = track width minus viewport
    const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const st = ScrollTrigger.create({
      trigger: pin,
      pin: true,
      start: "top top",
      end: () => "+=" + (getDistance() + window.innerHeight * 0.4),
      scrub: true,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        const distance = getDistance();
        // move track
        gsap.set(track, { x: -distance * p });

        // progress line fill from left edge to center
        if (progress) {
          gsap.set(progress, { scaleX: p, transformOrigin: "left center" });
        }

        // find which node is closest to the viewport center
        const cx = window.innerWidth / 2;
        let activeIdx = 0;
        let bestDist = Infinity;
        nodes.forEach((n, i) => {
          const r = n.getBoundingClientRect();
          const nx = r.left + r.width / 2;
          const d = Math.abs(nx - cx);
          if (d < bestDist) { bestDist = d; activeIdx = i; }
        });

        nodes.forEach((n, i) => n.classList.toggle("is-active", i === activeIdx));

        const activeNode = nodes[activeIdx];
        const year = activeNode.dataset.year;
        const label = activeNode.dataset.label;
        if (featureYear && featureYear.textContent !== year) {
          gsap.fromTo(featureYear,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
          featureYear.textContent = year;
        }
        if (featureLabel && featureLabel.textContent !== label) {
          gsap.fromTo(featureLabel,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.05 });
          featureLabel.textContent = label;
        }
      },
    });
  }

  /* -------------------------------------------------- dreams */
  function initDreams() {
    gsap.from(".dream", {
      scrollTrigger: { trigger: ".dreams__grid", start: "top 78%" },
      y: 60,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: "power3.out",
    });
  }

  /* -------------------------------------------------- contact */
  function initContact() {
    gsap.from(".form", {
      scrollTrigger: { trigger: ".form", start: "top 80%" },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });
  }

  /* -------------------------------------------------- BG D parallax */
  function initVisionParallax() {
    gsap.to(".vm__bg-d", {
      yPercent: -20,
      ease: "none",
      scrollTrigger: { trigger: ".vm", start: "top bottom", end: "bottom top", scrub: true },
    });
  }

  /* -------------------------------------------------- images fade */
  function initImgFade() {
    document.querySelectorAll(".img-fade").forEach((img) => {
      const mark = () => img.classList.add("is-loaded");
      if (img.complete) mark();
      else img.addEventListener("load", mark, { once: true });
    });
  }

  /* -------------------------------------------------- form */
  function initForm() {
    const form = document.querySelector(".form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      const original = btn.querySelector(".btn__label").textContent;
      btn.querySelector(".btn__label").textContent = "Sent ✓";
      gsap.fromTo(btn, { scale: 0.96 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
      setTimeout(() => {
        btn.querySelector(".btn__label").textContent = original;
        form.reset();
      }, 2400);
    });
  }

  /* -------------------------------------------------- boot */
  document.addEventListener("DOMContentLoaded", async () => {
    initLenis();
    initImgFade();
    initCursor();
    initNav();
    initHeroAmbient();
    initPageTransitions();
    initMarquee();
    initSectionHeads();
    initStats();
    initServiceTilt();
    initWork();
    initTimeline();
    initDreams();
    initVisionParallax();
    initContact();
    initForm();
    initPremiumMotion();
    await runPreloader();
    initHero();
    ScrollTrigger.refresh();
  });

  document.addEventListener("ganty:content-rendered", (event) => {
    initPremiumMotion(event.detail?.scope || event.target || document);
    initImgFade();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
