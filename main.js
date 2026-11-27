/* =========================================================
   Halde® — motion layer
   GSAP + ScrollTrigger + Lenis (smooth scroll)
   ========================================================= */
(() => {
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
  const isMobile = () => innerWidth <= 760;
  const EASE = "expo.out";

  /* ---------------- Smooth scroll ---------------- */
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !reduce,
    wheelMultiplier: 0.95,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  history.scrollRestoration = "manual";
  scrollTo(0, 0);

  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      e.preventDefault();
      document.body.classList.remove("menu-open");
      lenis.start();
      const target = id === "#top" || id === "#" ? 0 : $(id);
      if (target !== null) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    })
  );

  /* ---------------- Text splitting helpers ---------------- */
  function splitWords(el, cls = "w") {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
            else {
              const s = document.createElement("span");
              s.className = cls;
              s.textContent = part;
              s.style.display = "inline-block";
              frag.appendChild(s);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("indent") && !n.classList.contains("inl")) walk(n);
      });
    };
    walk(el);
    return $$("." + cls, el);
  }

  function splitLines(el) {
    if (!el.dataset.src) el.dataset.src = el.innerHTML;
    el.innerHTML = el.dataset.src;
    const words = splitWords(el, "lw");
    const lines = [];
    let top = null;
    words.forEach((w) => {
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map((l) => `<span class="line"><span>${l.join(" ")}</span></span>`).join("");
    return $$(".line > span", el);
  }

  function splitChars(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((w) => `<span class="sw">${[...w].map((c) => `<span class="sc">${c}</span>`).join("")}</span>`)
      .join(" ");
    return $$(".sc", el);
  }

  /* ---------------- Fit giant wordmarks ---------------- */
  function fitWordmarks() {
    $$(".wordmark.fit").forEach((wm) => {
      const parent = wm.parentElement;
      const isHero = !!wm.closest(".hero");
      let avail = parent.clientWidth;
      if (isHero && !isMobile()) avail = Math.min(avail * 0.6, avail - $(".hero__aside").offsetWidth - 40);
      wm.style.fontSize = "100px";
      wm.style.fontSize = (100 * avail) / wm.scrollWidth + "px";
    });
    const p = $(".partners__title span");
    const host = p.parentElement;
    host.style.fontSize = "100px";
    host.style.fontSize = (100 * host.clientWidth * 0.98) / p.scrollWidth + "px";
  }

  /* ---------------- Footer curtain ---------------- */
  const footer = $(".footer");
  const main = $("main");
  function setupCurtain() {
    footer.classList.remove("is-curtain");
    main.style.marginBottom = "";
    if (footer.offsetHeight < innerHeight * 0.95 && !isMobile()) {
      footer.classList.add("is-curtain");
      main.style.marginBottom = footer.offsetHeight + "px";
    }
  }

  /* ---------------- Clock ---------------- */
  const clock = $("[data-clock]");
  const tick = () => {
    clock.textContent = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Europe/Copenhagen" }).format(new Date());
  };
  tick();
  setInterval(tick, 15000);

  /* ---------------- Cursor, magnetic, tilt ---------------- */
  const cursor = $(".cursor");
  const label = $(".cursor__label");
  const hoverImg = $(".hover-img");
  const hoverInner = $(".hover-img__inner");
  if (!isTouch) {
    const cx = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3" });
    const hx = gsap.quickTo(hoverImg, "x", { duration: 0.8, ease: "power3" });
    const hy = gsap.quickTo(hoverImg, "y", { duration: 0.8, ease: "power3" });
    const hr = gsap.quickTo(hoverImg, "rotation", { duration: 0.8, ease: "power3" });
    let lastX = 0;
    addEventListener("mousemove", (e) => {
      cursor.style.opacity = 1;
      cx(e.clientX); cy(e.clientY); hx(e.clientX); hy(e.clientY);
      hr(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    });
    document.addEventListener("mouseover", (e) => {
      const c = e.target.closest("[data-cursor]");
      const l = e.target.closest("a, button, summary, .pills li, .toggle");
      if (c) { label.textContent = c.dataset.cursor; cursor.classList.add("is-big"); cursor.classList.remove("is-link"); }
      else if (l) { cursor.classList.add("is-link"); cursor.classList.remove("is-big"); }
      else cursor.classList.remove("is-big", "is-link");
    });

    $$("[data-magnetic]").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener("mouseleave", () => { mx(0); my(0); });
    });

    $$(".tilt").forEach((el) => {
      gsap.set(el, { transformPerspective: 900 });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 12);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
      });
      el.addEventListener("mouseleave", () => { rx(0); ry(0); });
    });

    $$(".awards__list li").forEach((li) => {
      li.addEventListener("mouseenter", () => {
        hoverInner.style.backgroundImage = `url(${li.dataset.img})`;
        hoverImg.classList.add("is-on");
      });
      li.addEventListener("mouseleave", () => hoverImg.classList.remove("is-on"));
    });
  }

  /* ---------------- Nav ---------------- */
  const nav = $(".nav");
  lenis.on("scroll", ({ scroll, direction }) => {
    if (scroll < 120) nav.classList.remove("is-hidden");
    else nav.classList.toggle("is-hidden", direction === 1);
  });
  $(".nav__burger").addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    document.body.classList.contains("menu-open") ? lenis.stop() : lenis.start();
  });

  /* ---------------- Hero product stack ---------------- */
  const stack = $(".hero__stack");
  const cards = $$(".hero__card");
  const loopCards = cards.filter((c) => !c.classList.contains("flick"));
  const dots = $$(".hero__dots i");
  const names = ["Arc Chair — Oak / Black", "Dome Pendant — Matte White", "Shell Chair — Mustard", "Dot Side Table — White Birch", "Shell Chair — Chalk"];
  const nameEl = $("[data-hero-name]");
  let current = 0;
  let z = 20;

  function setDot(i) {
    dots.forEach((d, k) => {
      d.classList.remove("on");
      if (k === i) { void d.offsetWidth; d.classList.add("on"); }
    });
  }
  function showCard(i) {
    const card = loopCards[i];
    gsap.set(card, { zIndex: ++z });
    gsap.fromTo(card, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" });
    gsap.fromTo($("img", card), { scale: 1.35, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 1.8, ease: EASE });
    gsap.timeline()
      .to(nameEl, { yPercent: -110, duration: 0.45, ease: "power3.in" })
      .add(() => (nameEl.textContent = names[i]))
      .fromTo(nameEl, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: EASE });
    setDot(i);
  }
  const startHeroLoop = () => {
    setDot(0);
    setInterval(() => {
      current = (current + 1) % loopCards.length;
      showCard(current);
    }, 2600);
  };

  if (!isTouch) {
    const sx = gsap.quickTo(stack, "x", { duration: 1.2, ease: "power3" });
    const sy = gsap.quickTo(stack, "y", { duration: 1.2, ease: "power3" });
    const sr = gsap.quickTo(stack, "rotation", { duration: 1.2, ease: "power3" });
    $(".hero").addEventListener("mousemove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      sx(nx * 40); sy(ny * 24); sr(nx * 3);
    });
  }

  /* ---------------- Initial states ---------------- */
  const heroChars = $$(".hero .wordmark .ch");
  const introWords = splitWords($(".hero__intro"));
  gsap.set(heroChars, { yPercent: (i, el) => (el.classList.contains("reg") ? 320 : 115) });
  gsap.set(introWords, { opacity: 0, yPercent: 60 });
  gsap.set(".hero__year span", { yPercent: 110 });
  gsap.set([".hero__caption", ".hero__scroll", ".locale"], { opacity: 0 });
  gsap.set(nav, { yPercent: -120 });
  gsap.set(cards, { clipPath: "inset(0% 0% 0% 0%)" });
  gsap.set($$("img", stack), { scale: 1.15 });
  gsap.set(stack, { clipPath: "inset(41% 38% 41% 38%)" });

  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(() => {
    fitWordmarks();
    setupCurtain();
    runIntro();
    buildScroll();
  });

  /* ---------------- Intro ---------------- */
  function runIntro() {
    const num = $(".loader__num");
    const counter = { v: 0 };
    // rapid flicker through products while the frame opens up
    const order = [5, 6, 7, 8, 9, 1, 2, 3, 4];
    let f = 0;
    const flick = setInterval(() => gsap.set(cards[order[f++ % order.length]], { zIndex: ++z }), 140);
    const D = reduce ? 0.3 : 2.6;

    gsap.timeline()
      .to(counter, { v: 100, duration: D, ease: "power2.inOut", onUpdate: () => (num.textContent = Math.round(counter.v)) })
      .to(stack, { clipPath: "inset(0% 0% 0% 0%)", duration: D * 0.9, ease: "expo.inOut" }, D * 0.15)
      .add(() => {
        clearInterval(flick);
        gsap.set(cards[0], { zIndex: ++z });
        gsap.to($("img", cards[0]), { scale: 1, duration: 2, ease: EASE });
        cards.filter((c) => c.classList.contains("flick")).forEach((c) => gsap.set(c, { clipPath: "inset(100% 0% 0% 0%)" }));
      })
      .to(".loader__num", { yPercent: 100, duration: 0.8, ease: "power3.in" })
      .to(".loader__label", { opacity: 0, y: 10, duration: 0.5 }, "<")
      .add(() => {
        document.body.classList.remove("is-loading");
        $(".loader").remove();
        lenis.start();
      })
      .to(heroChars, { yPercent: 0, duration: 1.6, ease: EASE, stagger: 0.06 }, "-=0.2")
      .to(nav, { yPercent: 0, duration: 1.2, ease: EASE }, "<")
      .to(".hero__year span", { yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.08 }, "<0.2")
      .to(introWords, { opacity: 1, yPercent: 0, duration: 1, ease: "power3.out", stagger: 0.02 }, "<")
      .to([".hero__caption", ".hero__scroll", ".locale"], { opacity: 1, duration: 1, stagger: 0.1 }, "<0.3")
      .add(startHeroLoop, "+=1.4");
  }

  /* ---------------- Scroll choreography ---------------- */
  function buildScroll() {
    // progress bar
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: (s) => gsap.set(".progress span", { scaleX: s.progress }) });

    // Hero exit
    gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
      .to(".hero .wordmark", { yPercent: 40, ease: "none" }, 0)
      .to(".hero__stage", { y: -120, scale: 0.85, ease: "none" }, 0)
      .to(".hero__intro, .hero__caption, .hero__aside", { y: -60, opacity: 0, ease: "none" }, 0);

    // Scrub word highlight
    $$(".scrub-words").forEach((el) => {
      const words = splitWords(el);
      gsap.to(words, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 50%", scrub: 0.6 } });
    });
    // inline pill images inside the statement
    $$(".inl").forEach((pill) => {
      gsap.timeline({ scrollTrigger: { trigger: pill, start: "top 90%", end: "top 55%", scrub: 0.6 } })
        .to(pill, { clipPath: "inset(0% 0% 0% 0% round 999px)", ease: "none" })
        .to($("img", pill), { scale: 1, ease: "none" }, 0);
    });

    // Fade-up paragraphs
    $$(".fade-up").forEach((el) =>
      gsap.from(el, { y: 60, opacity: 0, duration: 1.4, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%" } })
    );

    // Char split headings
    $$(".split-chars").forEach((el) => {
      const chars = splitChars(el);
      gsap.from(chars, {
        yPercent: 115, rotate: 10, duration: 1.3, ease: EASE, stagger: 0.025,
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // Small section labels slide in
    $$(".h-sm").forEach((el) =>
      gsap.from(el, { x: -30, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: "top 90%" } })
    );

    // Line reveal headings
    $$(".reveal-lines").forEach((el) => {
      const lines = splitLines(el);
      gsap.from(lines, { yPercent: 110, rotate: 2, duration: 1.4, ease: EASE, stagger: 0.09, scrollTrigger: { trigger: el, start: "top 85%" } });
    });

    // Pills pop
    $$(".pills").forEach((ul) =>
      gsap.from(ul.children, { y: 24, opacity: 0, scale: 0.85, duration: 0.9, ease: "back.out(1.7)", stagger: 0.05, scrollTrigger: { trigger: ul, start: "top 90%" } })
    );

    // Image curtain reveal
    $$(".img-reveal").forEach((fig) => {
      const img = $("img", fig);
      gsap.timeline({
        scrollTrigger: { trigger: fig, start: "top 88%" },
        onComplete: () => { gsap.set(img, { clearProps: "transform" }); fig.classList.add("done"); },
      })
        .to(fig, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.out" })
        .to(img, { scale: 1, duration: 2, ease: "expo.out" }, 0);
    });
    $$(".cat__imgs figure:nth-child(2)").forEach((f) =>
      gsap.fromTo(f, { y: 80 }, { y: -40, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } })
    );

    // ZOOM — small frame grows to full screen
    const zoomStart = isMobile() ? "inset(30% 22% 30% 22% round 18px)" : "inset(28% 37% 28% 37% round 24px)";
    gsap.timeline({
      scrollTrigger: {
        trigger: ".zoom", start: "top top", end: "+=160%", pin: true, scrub: 0.8,
        onUpdate: (s) => $(".zoom").classList.toggle("is-full", s.progress > 0.8),
      },
    })
      .fromTo(".zoom__media", { clipPath: zoomStart }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 })
      .fromTo(".zoom__media img", { scale: 1.5 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
      .to(".zoom__text--l", { xPercent: -60, opacity: 0, ease: "power2.in", duration: 0.7 }, 0)
      .to(".zoom__text--r", { xPercent: 60, opacity: 0, ease: "power2.in", duration: 0.7 }, 0)
      .fromTo(".zoom__caption", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.8)
      .to({}, { duration: 0.25 });

    // Marquee — infinite + velocity
    const track = $(".marquee__track");
    track.innerHTML += track.innerHTML;
    const loop = gsap.to(track, { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      trigger: ".marquee", start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity();
        gsap.to(loop, { timeScale: self.direction * (1 + Math.min(Math.abs(v) / 300, 6)), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.2, ease: "power2.out" });
      },
    });
    gsap.to(".marquee__img", { rotate: 8, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true } });

    // Collection index + sticky preview
    const lis = $$(".cindex li");
    const prevs = $$(".cpreview img");
    let activeCat = 0;
    const setCat = (i) => {
      if (i === activeCat) return;
      prevs.forEach((p, k) => {
        p.classList.toggle("was-active", k === activeCat);
        p.classList.toggle("is-active", k === i);
      });
      lis.forEach((l, k) => l.classList.toggle("is-active", k === i));
      activeCat = i;
    };
    $$(".cat").forEach((cat, i) =>
      ScrollTrigger.create({ trigger: cat, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setCat(i) })
    );
    gsap.from(".cindex li", { x: -30, opacity: 0, duration: 1, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: ".cindex", start: "top 85%" } });

    // Selected pieces — horizontal with velocity skew
    const mm = gsap.matchMedia();
    mm.add("(min-width: 761px)", () => {
      const ptrack = $(".pieces__track");
      const pieces = $$(".piece");
      const idxEl = $("[data-piece-idx]");
      const dist = () => ptrack.scrollWidth - innerWidth;
      const skew = gsap.quickTo(pieces, "skewX", { duration: 0.5, ease: "power3" });
      const h = gsap.to(ptrack, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: ".pieces", start: "top top", end: () => "+=" + dist(),
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => {
            skew(gsap.utils.clamp(-6, 6, s.getVelocity() / -400));
            gsap.set(".pieces__progress span", { scaleX: s.progress });
            idxEl.textContent = String(Math.round(s.progress * (pieces.length - 1)) + 1).padStart(2, "0");
          },
        },
      });
      ScrollTrigger.addEventListener("scrollEnd", () => skew(0));
      pieces.forEach((p) => {
        gsap.fromTo($("img", p), { xPercent: -8, scale: 1.18 }, {
          xPercent: 8, scale: 1.18, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: h, start: "left right", end: "right left", scrub: true },
        });
        gsap.from(p, { y: 120, opacity: 0, rotate: 3, duration: 1.2, ease: EASE, scrollTrigger: { trigger: p, containerAnimation: h, start: "left 95%" } });
      });
    });
    mm.add("(max-width: 760px)", () => {
      const pin = $(".pieces__pin");
      pin.style.height = "auto";
      pin.style.padding = "12vh 0";
      const t = $(".pieces__track");
      t.style.width = "auto"; t.style.overflowX = "auto"; t.style.scrollSnapType = "x mandatory";
      $$(".piece").forEach((p) => (p.style.scrollSnapAlign = "start"));
    });

    // Numbers
    $$(".stat__num").forEach((el) => {
      const o = { v: 0 };
      gsap.to(o, { v: +el.dataset.count, duration: 2.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" }, onUpdate: () => (el.textContent = Math.round(o.v)) });
    });
    gsap.to(".stat__line", { scaleX: 1, duration: 1.4, ease: "expo.inOut", stagger: 0.12, scrollTrigger: { trigger: ".numbers__grid", start: "top 85%" } });
    gsap.from(".stat > *:not(.stat__line)", { y: 50, opacity: 0, duration: 1.3, ease: EASE, stagger: 0.05, scrollTrigger: { trigger: ".numbers__grid", start: "top 85%" } });

    // Awards rows
    gsap.from(".awards__list li", { y: 40, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.06, scrollTrigger: { trigger: ".awards__list", start: "top 85%" } });

    // Founders offset parallax
    gsap.fromTo(".founders .offset", { y: 120 }, { y: -40, ease: "none", scrollTrigger: { trigger: ".founders", start: "top bottom", end: "bottom top", scrub: true } });

    // Spaces — columns drift at different speeds
    $$(".spaces__col").forEach((col) =>
      gsap.fromTo(col, { y: 0 }, { y: +col.dataset.speed, ease: "none", scrollTrigger: { trigger: ".spaces", start: "top bottom", end: "bottom top", scrub: true } })
    );
    $$(".spaces__col figure").forEach((f) =>
      gsap.from(f, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: f, start: "top 95%" } })
    );

    // Partners title zoom
    gsap.fromTo(".partners__title span", { scale: 0.55, yPercent: 40, opacity: 0.2 }, {
      scale: 1, yPercent: 0, opacity: 1, ease: "none",
      scrollTrigger: { trigger: ".partners", start: "top bottom", end: "top 25%", scrub: 0.6 },
    });

    // Reflections — staggered lift
    $$(".quote").forEach((q, i) =>
      gsap.fromTo(q, { y: 80 + i * 40 }, { y: 0, ease: "none", scrollTrigger: { trigger: ".reflections__grid", start: "top bottom", end: "center center", scrub: true } })
    );

    // Process — pinned steps, snapping, dark theme
    const steps = $$(".step");
    const media = $$(".pm");
    const numEl = $(".process__num");
    gsap.set(steps[0], { opacity: 1 });
    const ptl = gsap.timeline({
      scrollTrigger: {
        trigger: ".process", start: "top top", end: () => "+=" + innerHeight * 2.4,
        pin: true, scrub: 0.8,
        snap: { snapTo: "labels", duration: { min: 0.3, max: 0.9 }, ease: "power2.inOut" },
        onUpdate: (self) => {
          const idx = Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1)));
          const txt = String(idx + 1).padStart(2, "0");
          if (numEl.textContent !== txt) {
            gsap.fromTo(numEl, { yPercent: self.direction > 0 ? 100 : -100 }, { yPercent: 0, duration: 0.7, ease: EASE });
            numEl.textContent = txt;
          }
        },
      },
    });
    ptl.addLabel("s0");
    for (let i = 1; i < steps.length; i++) {
      ptl.to(steps[i - 1], { opacity: 0, y: -40, duration: 0.4, ease: "power2.in" })
        .to(media[i], { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.inOut" }, "<")
        .fromTo($("img", media[i]), { scale: 1.3 }, { scale: 1, duration: 1, ease: "power3.out" }, "<")
        .to($("img", media[i - 1]), { scale: 1.1, duration: 1, ease: "none" }, "<")
        .to(".process__bar span", { scaleX: (i + 1) / steps.length, duration: 1, ease: "power2.inOut" }, "<")
        .fromTo(steps[i], { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.45")
        .addLabel("s" + i);
    }
    ScrollTrigger.create({ trigger: ".process", start: "top 55%", end: "bottom 45%", toggleClass: { targets: document.body, className: "theme-dark" } });

    // Pricing cards
    gsap.from(".plan", { y: 100, rotationX: -15, opacity: 0, duration: 1.4, ease: EASE, stagger: 0.12, scrollTrigger: { trigger: ".pricing__grid", start: "top 85%" } });

    // Journal subtle parallax
    $$(".post").forEach((p, i) =>
      gsap.fromTo(p, { y: i % 2 ? 120 : 40 }, { y: 0, ease: "none", scrollTrigger: { trigger: ".journal__grid", start: "top bottom", end: "center center", scrub: true } })
    );

    // CTA button
    gsap.from(".cta .btn-pill", { scale: 0.6, opacity: 0, duration: 1.2, ease: "back.out(1.7)", scrollTrigger: { trigger: ".cta .btn-pill", start: "top 92%" } });

    // FAQ rows
    gsap.from(".qa", { y: 30, opacity: 0, duration: 1, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: ".faq__list", start: "top 85%" } });

    // Footer reveal (curtain)
    const curtain = footer.classList.contains("is-curtain");
    const footTrig = curtain ? { trigger: main, start: "bottom 85%" } : { trigger: ".footer", start: "top 90%" };
    if (curtain) {
      gsap.fromTo(".footer__top", { y: -120, opacity: 0.3 }, { y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: main, start: "bottom bottom", end: () => "bottom " + (innerHeight - footer.offsetHeight) + "px", scrub: true } });
    }
    ScrollTrigger.create({ ...footTrig, toggleClass: { targets: ".locale", className: "is-off" } });

    addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ---------------- Pricing toggle ---------------- */
  const tBtns = $$(".toggle__btn");
  const tPill = $(".toggle__pill");
  const placePill = (btn, animate = true) => {
    tPill.style.transition = animate ? "" : "none";
    tPill.style.width = btn.offsetWidth + "px";
    tPill.style.transform = `translateX(${btn.offsetLeft - 6}px)`;
  };
  document.fonts.ready.then(() => placePill($(".toggle__btn.is-active"), false));
  tBtns.forEach((b) =>
    b.addEventListener("click", () => {
      tBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      placePill(b);
      const factor = b.dataset.mode === "trade" ? 0.8 : 1;
      $$("[data-price]").forEach((el) => {
        const o = { v: +el.textContent.replace(/,/g, "") };
        gsap.to(o, { v: Math.round(+el.dataset.price * factor), duration: 0.9, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en-US")) });
      });
    })
  );

  /* ---------------- FAQ accordion ---------------- */
  $$(".qa").forEach((d) => {
    const sum = $("summary", d);
    const body = $(".qa__a", d);
    sum.addEventListener("click", (e) => {
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.6, ease: "power3.inOut", onComplete: () => { d.open = false; ScrollTrigger.refresh(); } });
      } else {
        $$(".qa[open]").forEach((o) => o !== d && $("summary", o).click());
        d.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.7, ease: "power3.out", onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });

  /* ---------------- Resize ---------------- */
  let rT;
  let lastW = innerWidth;
  addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      if (innerWidth === lastW) return; // ignore mobile URL-bar height changes
      lastW = innerWidth;
      fitWordmarks();
      setupCurtain();
      $$(".reveal-lines").forEach(splitLines);
      placePill($(".toggle__btn.is-active"), false);
      ScrollTrigger.refresh();
    }, 200);
  });
})();
