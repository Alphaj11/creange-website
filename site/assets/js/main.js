/* =========================================================
   Maison Créange — interactions
   GSAP + ScrollTrigger (vendored), aucune autre dépendance.
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const motion = hasGsap && !reduceMotion;
  root.classList.toggle('motion', motion);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const store = (type) => {
    try { const s = window[type]; const k = '__mc'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; }
  };
  const local = store('localStorage');
  const session = store('sessionStorage');
  const isMobile = () => window.innerWidth < 761;

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     1. Rideau de transition entre les pages
     --------------------------------------------------------- */
  const curtain = $('.curtain');
  const arrivingFromSite = session && session.getItem('mc-nav') === '1';
  if (session) session.removeItem('mc-nav');

  function curtainOut(onDone) {
    if (!motion || !curtain) { onDone && onDone(); return; }
    root.classList.remove('is-arriving');
    gsap.set(curtain, { y: 0, yPercent: 0 });
    const tie = $('.curtain__mark', curtain);
    gsap.timeline({ onComplete: () => { gsap.set(curtain, { yPercent: 100 }); onDone && onDone(); } })
      .fromTo(tie, { opacity: 1, y: 0 }, { opacity: 0, y: -30, duration: .35, ease: 'power2.in' })
      .to(curtain, { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '<.05');
  }

  function curtainIn(href) {
    if (!motion || !curtain) { window.location.href = href; return; }
    const tie = $('.curtain__mark', curtain);
    gsap.timeline({ onComplete: () => { window.location.href = href; } })
      .fromTo(curtain, { y: 0, yPercent: 100 }, { y: 0, yPercent: 0, duration: .65, ease: 'expo.inOut' })
      .fromTo(tie, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out' }, '-=.2');
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (!/^https?:$/.test(url.protocol)) return;
    // ancre sur la même page : défilement doux
    if (url.pathname === window.location.pathname && url.hash) {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) {
        e.preventDefault();
        closeMenu(false);
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        history.pushState(null, '', url.hash);
        const focusable = target.matches('a,button,input,textarea,[tabindex]') ? target : null;
        if (!focusable) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
      }
      return;
    }
    if (url.pathname === window.location.pathname && !url.hash) { e.preventDefault(); closeMenu(false); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
    e.preventDefault();
    if (session) session.setItem('mc-nav', '1');
    curtainIn(url.href);
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted && curtain) {
      root.classList.remove('is-arriving');
      if (hasGsap) gsap.set(curtain, { yPercent: 100 });
    }
  });

  /* ---------------------------------------------------------
     2. Séquence d'introduction (accueil)
     --------------------------------------------------------- */
  const intro = $('[data-intro]');
  let introDone = Promise.resolve();

  function runIntro(onExit) {
    if (!intro) return Promise.resolve();
    // une seule fois par visite : rien en naviguant d'une page à l'autre ni en rechargeant
    const seenSession = session && session.getItem('mc-intro-s') === '1';
    if (!motion || arrivingFromSite || seenSession) {
      root.classList.add('no-intro');
      intro.remove();
      return Promise.resolve();
    }
    const seen = local && local.getItem('mc-intro') === '1';
    if (local) local.setItem('mc-intro', '1');
    if (session) session.setItem('mc-intro-s', '1');
    document.body.style.overflow = 'hidden';

    return new Promise((resolve) => {
      const mono = $('[data-intro-mono]', intro);
      const rings = $$('.intro__ring', intro);
      const cs = $$('.intro__c', intro);
      const shine = $('#ib-shine', intro);
      const year = $('.intro__year', intro);
      const door = $('[data-intro-door]', intro);
      const leafL = $('.intro__leaf--l', intro);
      const leafR = $('.intro__leaf--r', intro);
      const seam = $('.intro__seam', intro);
      const room = $('[data-intro-room]', intro);
      const view = $('[data-intro-view]', intro);
      const beam = $('.intro__beam', intro);
      const rack = $('[data-intro-rack]', intro);
      const words = $$('.intro__w > span', intro);
      const skip = $('[data-intro-skip]', intro);
      let exited = false;

      const finish = () => {
        document.body.style.overflow = '';
        intro.remove();
        resolve();
      };
      const exit = () => { if (!exited) { exited = true; if (onExit) onExit(); } };

      // ouverture de la porte : l'intérieur n'est visible que par l'embrasure
      const r = door.getBoundingClientRect();
      const W = window.innerWidth, H = window.innerHeight;
      const t = Math.max(0, r.top), b = Math.max(0, H - r.bottom), l = Math.max(0, r.left), rr = Math.max(0, W - r.right);
      // embrasure animée via un objet intermédiaire (interpolation fiable du clip-path)
      const cut = { t, r: W / 2, b, l: W / 2 };
      const drawCut = () => { room.style.clipPath = `inset(${cut.t}px ${cut.r}px ${cut.b}px ${cut.l}px)`; };
      drawCut();

      const tl = gsap.timeline({ onComplete: finish });
      // 1. le monogramme se grave dans le laiton
      tl.to(rings, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut', stagger: .12 }, .1)
        .to(cs, { opacity: 1, duration: .6, ease: 'power1.out' }, .32)
        .fromTo(shine, { attr: { x1: -1, x2: 0 } }, { attr: { x1: 1.2, x2: 2.2 }, duration: .8, ease: 'power2.inOut' }, .55)
        .fromTo(year, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .5, ease: 'power2.out' }, .62);

      if (seen) {
        // retour d'un visiteur (nouvelle visite) : seulement la signature
        tl.to(intro, { opacity: 0, duration: .5, ease: 'power2.inOut' }, 1.05)
          .add(exit, 1.1);
      } else {
        // 2. la porte sort de l'ombre, un filet de lumière filtre entre les battants
        tl.to(mono, { opacity: 0, scale: .86, duration: .4, ease: 'power2.in' }, 1.15)
          .to(door, { opacity: 1, duration: .45, ease: 'power1.out' }, 1.1)
          .to(seam, { opacity: 1, duration: .3, ease: 'power1.out' }, 1.35)
          // 3. les battants s'ouvrent vers l'intérieur
          .to(leafL, { rotateY: -100, duration: 1, ease: 'power3.inOut' }, 1.5)
          .to(leafR, { rotateY: 100, duration: 1, ease: 'power3.inOut' }, 1.5)
          .to(seam, { opacity: 0, duration: .3 }, 1.6)
          .to(cut, { r: rr, l, duration: .75, ease: 'power3.inOut', onUpdate: drawCut }, 1.5)
          // 4. la caméra franchit le seuil
          .to(door, { scale: 3.4, opacity: 0, duration: .95, ease: 'power2.in' }, 1.95)
          .to(cut, { t: 0, r: 0, b: 0, l: 0, duration: .8, ease: 'power2.in', onUpdate: drawCut }, 2.05)
          .fromTo(view, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 1.5)
          // 5. la lumière s'allume sur le costume
          .fromTo(beam, { opacity: 0 }, { opacity: 1, duration: .6, ease: 'power2.out' }, 2.05)
          .fromTo(rack, { y: 24, opacity: .45 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power2.out' }, 1.9)
          // 6. le titre
          .to(words, { yPercent: 0, y: 0, duration: .85, stagger: .1, ease: 'power4.out' }, 2.45)
          .to(intro, { opacity: 0, duration: .6, ease: 'power2.inOut' }, 3.45)
          .add(exit, 3.5);
        gsap.set(words, { yPercent: 110, y: 0 });
      }

      // passer : fondu immédiat, sans à-coup
      const skipNow = () => {
        if (exited) return;
        tl.kill();
        exit();
        gsap.to(intro, { opacity: 0, duration: .35, ease: 'power1.out', onComplete: finish });
      };
      skip.addEventListener('click', skipNow);
      window.addEventListener('keydown', function onKey(ev) {
        if (['Escape', 'Enter', ' '].includes(ev.key)) { skipNow(); window.removeEventListener('keydown', onKey); }
      });
      window.addEventListener('wheel', skipNow, { once: true, passive: true });
      window.addEventListener('touchmove', skipNow, { once: true, passive: true });
    });
  }

  /* ---------------------------------------------------------
     3. En-tête : thème selon la section, masquage au défilement
     --------------------------------------------------------- */
  const header = $('[data-header]');
  const themed = $$('[data-header-theme]');
  let lastY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    ticking = false;
    if (!header) return;
    const y = window.scrollY;
    const probe = header.offsetHeight / 2;
    let theme = 'dark';
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { theme = s.dataset.headerTheme; break; }
    }
    header.dataset.theme = theme;
    header.classList.toggle('is-solid', y > 40);
    const menuOpen = document.body.classList.contains('menu-open');
    if (!menuOpen) header.classList.toggle('is-hidden', y > lastY && y > 400 && !header.contains(document.activeElement));
    lastY = y;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateHeader); } }, { passive: true });
  updateHeader();

  /* ---------------------------------------------------------
     4. Menu mobile
     --------------------------------------------------------- */
  const toggle = $('.menu-toggle');
  const menu = $('#menu-mobile');

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    $('.menu-toggle__label', toggle).textContent = 'Fermer';
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    header.classList.remove('is-hidden');
    if (motion) {
      gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .7, ease: 'expo.inOut' });
      gsap.fromTo($$('.menu-mobile__list a', menu), { yPercent: 100 }, { yPercent: 0, duration: .8, stagger: .06, ease: 'power4.out', delay: .25 });
      gsap.fromTo($('.menu-mobile__foot', menu), { opacity: 0 }, { opacity: 1, duration: .6, delay: .55 });
    }
    const first = $('a', menu); if (first) first.focus({ preventScroll: true });
  }
  function closeMenu(restoreFocus = true) {
    if (!menu || menu.hidden) return;
    const done = () => {
      menu.hidden = true;
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
      updateHeader();
    };
    toggle.setAttribute('aria-expanded', 'false');
    $('.menu-toggle__label', toggle).textContent = 'Menu';
    if (motion) gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: .55, ease: 'expo.inOut', onComplete: done });
    else done();
    if (restoreFocus) toggle.focus();
  }
  if (toggle) {
    toggle.addEventListener('click', () => (toggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu()));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu();
      if (e.key === 'Tab' && toggle.getAttribute('aria-expanded') === 'true') {
        const items = [toggle, ...$$('a', menu)];
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 1180) closeMenu(false); });
  }

  const toTop = $('[data-to-top]');
  if (toTop) toTop.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); const b = $('.brand'); if (b) b.focus({ preventScroll: true }); });

  /* ---------------------------------------------------------
     5. La cravate compagnon : une vraie cravate en soie (photo détourée)
        qui accompagne le parcours. Physique de pendule amortie :
        la vitesse de défilement lui donne de l'élan, la gravité la ramène.
        Elle s'efface pendant les compositions photographiques.
     --------------------------------------------------------- */
  const companion = (() => {
    const el = $('[data-companion-el]');
    const swing = $('[data-companion-swing]');
    if (!el || !swing) return null;
    const sections = $$('[data-companion]');
    let angle = 0, vel = 0, y = -260, yTarget = -260, opacity = 0, lastScroll = window.scrollY, raf = 0, running = false;

    function wanted() {
      if (window.innerWidth <= 900) return false;
      const probe = window.innerHeight * .5;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) return s.dataset.companion !== 'off';
      }
      return !sections.length || true;
    }

    function frame() {
      const sy = window.scrollY;
      const dv = Math.max(-80, Math.min(80, sy - lastScroll));
      lastScroll = sy;
      const show = wanted();
      // position : suspendue à 22 % de la hauteur, ou remontée hors champ
      const h = el.offsetHeight || 160;
      yTarget = show ? window.innerHeight * .22 : -h - 40;
      y += (yTarget - y) * .075;
      opacity += ((show ? 1 : 0) - opacity) * .1;
      // pendule amorti : impulsion = défilement, rappel = gravité
      const impulse = -dv * .045;
      const acc = -0.055 * angle - 0.11 * vel + impulse * .12;
      vel += acc;
      angle += vel;
      angle = Math.max(-14, Math.min(14, angle));
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      swing.style.transform = `rotate(${angle.toFixed(2)}deg) skewX(${(angle * .18).toFixed(2)}deg)`;
      const settled = Math.abs(yTarget - y) < .5 && Math.abs(angle) < .02 && Math.abs(vel) < .01 && Math.abs((show ? 1 : 0) - opacity) < .01;
      raf = settled ? 0 : requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    return {
      start() {
        if (running) return; running = true;
        if (!motion) { el.style.display = 'none'; return; }
        window.addEventListener('scroll', kick, { passive: true });
        window.addEventListener('resize', kick);
        kick();
      },
    };
  })();

  /* ---------------------------------------------------------
     5 bis. Scènes photographiques pilotées par le défilement
     --------------------------------------------------------- */
  function readyImages() {
    $$('.product__img, .homme__img').forEach((img) => {
      const host = img.closest('.product, .homme__cam') || img;
      const ok = () => { host.classList.add('is-ready'); host.classList.remove('is-missing'); };
      const ko = () => { host.classList.add('is-missing'); };
      if (img.complete && img.naturalWidth) { (img.decode ? img.decode() : Promise.resolve()).then(ok, ok); return; }
      img.addEventListener('load', () => { (img.decode ? img.decode() : Promise.resolve()).then(ok, ok); }, { once: true });
      img.addEventListener('error', ko, { once: true });
    });
  }

  function scenes() {
    if (!motion) {
      $$('.scene .stage__decor--interieur').forEach((d) => { d.style.opacity = '0'; });
      return;
    }
    // la barre d'adresse mobile qui apparaît/disparaît ne doit pas recalculer les scènes
    ScrollTrigger.config({ ignoreMobileResize: true });

    const mm = gsap.matchMedia();
    // Même narration sur ordinateur et sur mobile : seules les distances,
    // les tailles et le rythme changent (m = composition mobile).
    mm.add({ desk: '(min-width: 901px)', mob: '(max-width: 900px)' }, (ctx) => {
      const m = ctx.conditions.mob;
      const st = (scene) => ({ trigger: scene, start: 'top top', end: 'bottom bottom', scrub: m ? .6 : 1.1 });

      // SCÈNE 01 : travelling avant à travers la porte de la boutique
      const entree = $('.scene--entree');
      if (entree) {
        const facade = $('.stage__decor--facade', entree);
        const inside = $('.stage__decor--interieur', entree);
        gsap.set(facade, { transformOrigin: m ? '58% 64%' : '49% 62%' });
        gsap.timeline({ scrollTrigger: st(entree) })
          .to($('.entree__copy', entree), { opacity: 0, y: m ? -30 : -40, duration: .22, ease: 'power1.in' }, .05)
          .to($('.scroll-cue', entree), { opacity: 0, duration: .1 }, 0)
          .to(facade, { scale: m ? 2.3 : 2.15, duration: .75, ease: 'power2.in' }, 0)
          .fromTo($('.stage__shade', facade), { opacity: 0 }, { opacity: 1, duration: m ? .4 : .3, ease: 'none' }, m ? .25 : .45)
          .fromTo(inside, { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1.08, duration: .45, ease: 'power2.out' }, .55)
          .to(facade, { opacity: 0, duration: .2, ease: 'none' }, .62)
          .fromTo($('[data-threshold]', entree), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .18, ease: 'power2.out' }, .7)
          .to($('[data-threshold]', entree), { opacity: 0, y: -18, duration: .12 }, .92);
      }

      // SCÈNE 02 : le costume se détache du portant et vient au premier plan
      const costume = $('.scene--costume');
      if (costume) {
        const decor = $('[data-cam]', costume);
        const prod = $('[data-product]', costume);
        const shadow = $('.product__shadow', prod);
        const img = $('.product__img', prod);
        const copy = $('[data-copy]', costume);
        const dots = $$('.hotspot__dot', costume);
        const cards = $$('.hotspot__card', costume);
        const tl = gsap.timeline({ scrollTrigger: st(costume) })
          .fromTo(decor, { scale: 1.6, transformOrigin: '50% 82%' }, { scale: 1.12, duration: 1, ease: 'none' }, 0)
          // départ : petit, flou, dans l'ombre du portant
          .fromTo(prod, m ? { xPercent: -70, yPercent: -10, scale: .42, rotate: -3 } : { xPercent: -95, yPercent: 8, scale: .38, rotate: -3 },
            { xPercent: 0, yPercent: 0, scale: 1, rotate: 0, duration: .46, ease: 'power2.inOut' }, 0)
          .fromTo(img, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power1.out' }, .04)
          .fromTo(shadow, { opacity: .15, scaleX: .4 }, { opacity: .9, scaleX: 1, duration: .45, ease: 'power2.inOut' }, 0)
          // légère rotation pour révéler la coupe, puis retour face
          .to(prod, { scaleX: .95, duration: .16, ease: 'sine.inOut' }, .48)
          .to(prod, { scaleX: 1, duration: .2, ease: 'sine.inOut' }, .66)
          .fromTo(copy, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12 }, .3);
        if (!m) {
          tl.to(dots, { opacity: 1, duration: .05, stagger: .06 }, .5)
            .fromTo(cards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .08, stagger: .07 }, .54);
        } else {
          // sur mobile, la caméra inspecte chaque détail l'un après l'autre
          tl.to(copy, { opacity: 0, y: -20, duration: .06 }, .53)
            .to(dots, { opacity: 1, duration: .04, stagger: .03 }, .54);
          cards.forEach((card, i) => {
            const t = .58 + i * .085;
            tl.fromTo(card, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .03 }, t)
              .to(dots[i], { scale: 1.6, duration: .03 }, t);
            if (i < cards.length - 1) tl.to(card, { opacity: 0, y: -12, duration: .03 }, t + .07).to(dots[i], { scale: 1, duration: .03 }, t + .07);
          });
        }
        tl.to([copy, prod], { opacity: 0, duration: .07 }, .93);
      }

      // SCÈNE 03 : la chemise quitte l'étagère
      const chemise = $('.scene--chemise');
      if (chemise) {
        const decor = $('[data-cam]', chemise);
        const prod = $('[data-product]', chemise);
        const img = $('.product__img', prod);
        const copy = $('[data-copy]', chemise);
        const loupes = $$('[data-loupe]', chemise);
        const tl = gsap.timeline({ scrollTrigger: st(chemise) })
          .fromTo(decor, { scale: 2.3, transformOrigin: '12% 36%' }, { scale: 1.8, x: '-3%', duration: 1, ease: 'none' }, 0)
          .fromTo(prod, m ? { xPercent: -75, yPercent: -45, scale: .34, rotate: 10 } : { xPercent: -150, yPercent: -55, scale: .3, rotate: 8 },
            { xPercent: 0, yPercent: 0, scale: 1, rotate: -5, duration: .5, ease: 'power2.inOut' }, 0)
          .to(prod, { rotate: -3, duration: .3, ease: 'sine.inOut' }, .5)
          .fromTo(img, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power1.out' }, .06)
          .fromTo(copy, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12 }, .3);
        if (m) tl.to(copy, { opacity: 0, y: -20, duration: .06 }, .56);
        tl.fromTo(loupes, { opacity: 0, y: 24, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .1, stagger: .1 }, m ? .6 : .55)
          .to([prod, copy, ...loupes], { opacity: 0, duration: .07 }, .93);
      }

      // SCÈNE 04 : la cravate descend de la vitrine et se balance sous son poids
      const acc = $('.scene--accessoires');
      if (acc) {
        const decor = $('[data-cam]', acc);
        const prod = $('[data-product]', acc);
        const swingEl = $('[data-swing]', acc);
        const vit = $$('[data-vitrine]', acc);
        gsap.timeline({ scrollTrigger: st(acc) })
          .fromTo(decor, { scale: 2.1, transformOrigin: '86% 72%' }, { scale: 1.7, x: '2%', duration: 1, ease: 'none' }, 0)
          .fromTo(prod, { yPercent: -110 }, { yPercent: 0, duration: .32, ease: 'power2.in' }, .02)
          // oscillation amortie à l'arrivée (gravité)
          .fromTo(swingEl, { rotate: 0 }, { rotate: 7, duration: .07, ease: 'sine.out' }, .34)
          .to(swingEl, { rotate: -4.5, duration: .09, ease: 'sine.inOut' })
          .to(swingEl, { rotate: 2.5, duration: .09, ease: 'sine.inOut' })
          .to(swingEl, { rotate: -1, duration: .08, ease: 'sine.inOut' })
          .to(swingEl, { rotate: 0, duration: .08, ease: 'sine.inOut' })
          .fromTo(vit, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: .22, stagger: .1, ease: 'power2.out' }, .2)
          .to(vit[0] || {}, { y: m ? -24 : -40, duration: .5, ease: 'none' }, .45)
          .to(vit[1] || {}, { y: m ? -50 : -80, duration: .5, ease: 'none' }, .45)
          .fromTo($('[data-copy]', acc), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .14 }, .36)
          .to(prod, { yPercent: -120, duration: .14, ease: 'power2.in' }, .86)
          .to([$('[data-copy]', acc), ...vit], { opacity: 0, duration: .07 }, .93);
      }

      // SCÈNE 05 : la paire glisse sur le plateau et pivote légèrement
      const shoes = $('.scene--chaussures');
      if (shoes) {
        const decor = $('[data-cam]', shoes);
        const prod = $('[data-product]', shoes);
        const img = $('.product__img', prod);
        const shadow = $('.product__shadow', prod);
        const copy = $('[data-copy]', shoes);
        const tl = gsap.timeline({ scrollTrigger: st(shoes) })
          .fromTo(decor, { scale: 1.5, transformOrigin: '40% 70%' }, { scale: 1.12, duration: 1, ease: 'none' }, 0)
          .fromTo($('.plinth', shoes), { rotateX: 70, opacity: 0 }, { rotateX: 58, opacity: 1, duration: .3, ease: 'power2.out' }, 0)
          .fromTo(prod, m ? { xPercent: 55, scale: .5 } : { xPercent: 60, scale: .55 },
            { xPercent: 0, scale: 1, duration: .5, ease: 'power3.inOut' }, 0)
          .fromTo(img, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power1.out' }, .04)
          // la lumière glisse sur le cuir : un reflet peint, pas un filtre
          .fromTo($('.product__glint', prod), { opacity: 0, xPercent: -60 }, { opacity: 1, xPercent: 0, duration: .16, ease: 'sine.inOut' }, .56)
          .to($('.product__glint', prod), { opacity: 0, xPercent: 60, duration: .2, ease: 'sine.inOut' }, .72)
          .fromTo(shadow, { opacity: .1, scaleX: .5 }, { opacity: .85, scaleX: 1, duration: .5, ease: 'power2.inOut' }, 0)
          .fromTo(copy, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12 }, .3);
        if (m) {
          // le texte long arrive en deux temps ; la paire recule pour lui laisser la place
          const a = $('[data-swap-a]', shoes);
          const b = $('[data-swap-b]', shoes);
          gsap.set(b, { opacity: 0, y: 16 });
          tl.to(a, { opacity: 0, y: -14, duration: .06 }, .58)
            .to(b, { opacity: 1, y: 0, duration: .08 }, .62)
            .to(prod, { yPercent: -14, scale: .86, duration: .14, ease: 'power2.inOut' }, .58);
        }
        tl.to([copy, prod], { opacity: 0, duration: .07 }, .94);
      }

      // SCÈNE 06 : le savoir-faire, composition éditoriale
      const atelier = $('.scene--atelier');
      if (atelier) {
        const portrait = $('[data-portrait]', atelier);
        const pimg = $('img', portrait);
        const lines = $$('.atelier__line > span', atelier);
        const kicker = $('.atelier__kicker', atelier);
        const details = $$('[data-detail]', atelier);
        const tape = $('.atelier__tape', atelier);
        const text = $('[data-at-text]', atelier);
        const tl = gsap.timeline({ scrollTrigger: st(atelier) })
          .fromTo(portrait, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .26, ease: 'power2.out' }, 0)
          .fromTo(pimg, { scale: 1.32 }, { scale: 1, duration: 1, ease: 'none' }, 0)
          .fromTo(kicker, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: .1 }, .12)
          .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: .14, stagger: .05, ease: 'power3.out' }, .14)
          .fromTo(details, { opacity: 0, y: m ? 50 : 90, scale: .92 }, { opacity: 1, y: 0, scale: 1, duration: .16, stagger: .07, ease: 'power2.out' }, m ? .24 : .28)
          .fromTo(tape, { scaleX: 0 }, { scaleX: 1, duration: .2, ease: 'power2.inOut' }, m ? .34 : .42);
        // profondeur : chaque gros plan dérive à sa propre vitesse
        details.forEach((d) => {
          const depth = parseFloat(d.dataset.depth || '-40') * (m ? .4 : 1);
          tl.to(d, { y: depth, duration: .5, ease: 'none' }, m ? .4 : .46);
        });
        if (m) {
          // troisième temps : le portrait s'assombrit, le texte prend la place
          tl.to([kicker, ...lines, ...details, tape], { opacity: 0, duration: .07, stagger: .01 }, .56)
            .to(portrait, { opacity: .28, duration: .1 }, .56)
            .fromTo(text, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12 }, .63);
        } else {
          tl.fromTo(text, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .14 }, .5);
        }
      }
      return () => {};
    });
  }

  /* ---------------------------------------------------------
     5 ter. Page À propos : visite éditoriale pilotée par le défilement
     --------------------------------------------------------- */
  function aboutScenes() {
    if (!document.body.classList.contains('page-about')) return;
    // emplacements réservés aux futures photographies : visibles avec ?emplacements
    const slots = $('[data-ab-slots]');
    if (slots && /[?&]emplacements\b/.test(location.search)) slots.hidden = false;
    if (!motion) return;

    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 901px)', mob: '(max-width: 900px)' }, (ctx) => {
      const m = ctx.conditions.mob;
      const st = (el) => ({ trigger: el, start: 'top top', end: 'bottom bottom', scrub: m ? .6 : 1 });

      // I. la façade : le regard s'approche de l'enseigne, le texte s'efface
      const hero = $('[data-ab="hero"]');
      if (hero) {
        gsap.timeline({ scrollTrigger: st(hero) })
          .fromTo($('[data-ab-media]', hero), { scale: 1.02 }, { scale: m ? 1.22 : 1.3, ease: 'none', duration: 1 }, 0)
          .to($('[data-ab-copy]', hero), { y: m ? -40 : -80, opacity: 0, ease: 'power1.in', duration: .4 }, .3)
          .to($('[data-ab-veil]', hero), { opacity: .75, ease: 'none', duration: .4 }, .6);
      }

      // II. 1875 : l'enseigne se découvre, l'année se remplit, puis la frise se trace
      const or = $('[data-ab="origins"]');
      if (or) {
        // l'enseigne et le titre se découvrent pendant que la scène arrive (aucun écran vide)
        gsap.timeline({ scrollTrigger: { trigger: or, start: 'top 85%', end: 'top top', scrub: m ? .6 : 1 } })
          .to($('[data-ab-sign]', or), { clipPath: 'inset(0 0 0% 0)', ease: 'power2.out', duration: .6 }, 0)
          .fromTo($('[data-ab-head]', or), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .4 }, .45);
        const tl = gsap.timeline({ scrollTrigger: st(or) });
        tl.fromTo($('[data-ab-sign] img', or), { scale: 1.15 }, { scale: 1, ease: 'none', duration: 1 }, 0)
          .to($('[data-ab-year]', or), { clipPath: 'inset(0 0% 0 0)', ease: 'none', duration: .32 }, 0)
          .fromTo($('[data-ab-lead]', or), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12 }, .06);
        if (m) {
          // le texte laisse la place à la frise, l'année s'estompe
          tl.to($('[data-ab-lead]', or), { opacity: 0, y: -24, duration: .08 }, .4)
            .to($('.ab-year', or), { opacity: .35, duration: .1 }, .4);
        }
        const t0 = m ? .44 : .36;
        tl.to($('[data-ab-line]', or), { '--line': 1, ease: 'none', duration: .3 }, t0);
        $$('[data-ab-stop]', or).forEach((li, i) => {
          tl.fromTo(li, { opacity: 0, y: m ? 0 : 20, x: m ? -14 : 0 }, { opacity: 1, y: 0, x: 0, duration: .1 }, t0 + .04 + i * .1);
        });
        tl.to({}, { duration: .08 });
      }

      // IV. l'atelier : la pièce s'éclaire, les détails gravitent, le mètre se déroule
      const cr = $('[data-ab="craft"]');
      if (cr) {
        const tl = gsap.timeline({ scrollTrigger: st(cr) });
        tl.fromTo($('[data-ab-piece]', cr), { opacity: .22, y: 70, scale: .94 }, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: .2 }, 0)
          .to($('[data-ab-chead] .ab-kicker', cr), { opacity: 1, duration: .08 }, .04)
          .fromTo($$('.ab-craft__l > span', cr), { yPercent: 110 }, { yPercent: 0, y: 0, stagger: .05, ease: 'power3.out', duration: .14 }, .06)
          .fromTo($('.ab-craft__tape', cr), { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: .2 }, .18);
        $$('[data-ab-detail]', cr).forEach((d, i) => {
          const depth = parseFloat(d.dataset.depth || '-40');
          tl.fromTo(d, { opacity: 0, y: -depth, scale: .9 }, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: .14 }, .2 + i * .07)
            .to(d, { y: depth * (m ? .4 : 1), ease: 'none', duration: .5 }, .36 + i * .07);
        });
        if (m) {
          tl.to($$('[data-ab-detail]', cr), { opacity: 0, duration: .08 }, .66)
            .to($('[data-ab-piece]', cr), { opacity: .3, duration: .1 }, .66)
            .fromTo($('[data-ab-ctext]', cr), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .1 }, .72);
        } else {
          tl.fromTo($('[data-ab-ctext]', cr), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .12 }, .56);
        }
        tl.to({}, { duration: .12 });
      }

      // III et V. plans superposés qui glissent à des vitesses différentes
      $$('[data-ab-speed]').forEach((el) => {
        const v = parseFloat(el.dataset.abSpeed) * (m ? .6 : 1);
        gsap.fromTo(el, { yPercent: -v }, { yPercent: v, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      return () => {};
    });
  }

  /* ---------------------------------------------------------
     5 quater. L'Homme Créange (accueil)
     Une silhouette en pied lue détail par détail. Tout l'état visible
     est une fonction pure de l'avancement : le défilement arrière
     rejoue exactement les mêmes images, sans rien laisser derrière lui.
     Un seul calque bouge (la caméra, transformation 2D, aucun filtre).
     --------------------------------------------------------- */
  function homme() {
    const stage = $('[data-homme]');
    if (!stage || !motion) return;
    const scene = stage.closest('.scene');
    const cam = $('[data-homme-cam]', stage);
    const img = $('.homme__img', cam);
    const glint = $('.homme__glint', cam);
    const scrim = $('.homme__scrim', stage);
    const svg = $('[data-homme-wires]', stage);
    const NS = 'http://www.w3.org/2000/svg';
    const step = (n) => $(`[data-homme-step="${n}"]`, stage);

    // L'image est chargée en avance (deux écrans avant la scène) puis décodée.
    const preload = () => { if (img.loading === 'lazy') img.loading = 'eager'; };
    ScrollTrigger.create({ trigger: scene, start: 'top 300%', once: true, onEnter: preload });
    window.addEventListener('load', () => setTimeout(preload, 1200), { once: true });

    // Plans de caméra : point de l'image (fx, fy) amené au point d'écran (sx, sy), au zoom z.
    // [ordinateur, mobile]
    const shots = {
      intro: [{ z: 1, fx: .5, fy: .53, sx: .5, sy: .52 }, { z: .74, fx: .5, fy: .55, sx: .5, sy: .4 }],
      costume: [{ z: 1.75, fx: .56, fy: .33, sx: .64, sy: .46 }, { z: 1.4, fx: .54, fy: .33, sx: .52, sy: .37 }],
      chemise: [{ z: 2.3, fx: .52, fy: .26, sx: .4, sy: .44 }, { z: 1.8, fx: .52, fy: .27, sx: .5, sy: .36 }],
      cravate: [{ z: 2.5, fx: .495, fy: .31, sx: .62, sy: .45 }, { z: 1.8, fx: .5, fy: .3, sx: .5, sy: .36 }],
      details: [{ z: 2, fx: .5, fy: .4, sx: .4, sy: .47 }, { z: 1.5, fx: .5, fy: .38, sx: .5, sy: .37 }],
      chaussures: [{ z: 1.9, fx: .41, fy: .89, sx: .6, sy: .56 }, { z: 1.55, fx: .42, fy: .86, sx: .5, sy: .42 }],
      final: [{ z: 1, fx: .5, fy: .53, sx: .63, sy: .52 }, { z: .74, fx: .5, fy: .55, sx: .5, sy: .38 }],
    };
    // Temps forts : [début du plan, fin du plan] sur l'avancement 0..1
    const beats = [
      ['intro', 0, .1], ['costume', .16, .27], ['chemise', .33, .43], ['cravate', .49, .59],
      ['details', .65, .75], ['chaussures', .81, .89], ['final', .95, 1],
    ];
    const notes = beats.slice(1, 6).map(([name, a, b]) => {
      const el = step(name);
      const pts = el.dataset.anchor.split(' ').map(Number);
      const anchors = [];
      for (let i = 0; i < pts.length; i += 2) anchors.push([pts[i], pts[i + 1]]);
      const wires = anchors.map(() => {
        const g = document.createElementNS(NS, 'g');
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('pathLength', '1');
        path.style.strokeDasharray = '1 1';
        const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('class', 'ring'); ring.setAttribute('r', '7');
        const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('class', 'dot'); dot.setAttribute('r', '2.6');
        g.append(path, ring, dot); svg.append(g);
        return { g, path, ring, dot };
      });
      return { name, a, b, el, anchors, wires, left: el.classList.contains('homme__note--left') };
    });
    const intro = step('intro');
    const sign = step('final');

    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const ramp = (p, a, b) => clamp01((p - a) / (b - a));
    const ease = (t) => t * t * (3 - 2 * t);
    // visibilité d'un élément : entre à [inA, inB], sort à [outA, outB]
    const life = (p, inA, inB, outA, outB) => Math.min(ramp(p, inA, inB), 1 - ramp(p, outA, outB));

    let mob = false, W = 0, H = 0, w0 = 0, h0 = 0, ready = false, last = -1;
    const measure = () => {
      mob = window.matchMedia('(max-width: 900px)').matches;
      W = stage.clientWidth; H = stage.clientHeight;
      w0 = cam.offsetWidth; h0 = cam.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    };

    const shotAt = (p) => {
      const k = mob ? 1 : 0;
      for (let i = 0; i < beats.length; i++) {
        const [n, a, b] = beats[i];
        if (p <= b || i === beats.length - 1) {
          if (p >= a || i === 0) return shots[n][k];
          const [pn, , pb] = beats[i - 1];
          const t = ease(ramp(p, pb, a)), A = shots[pn][k], B = shots[n][k];
          const z = Math.exp(Math.log(A.z) + (Math.log(B.z) - Math.log(A.z)) * t);
          const mix = (u, v) => u + (v - u) * t;
          return { z, fx: mix(A.fx, B.fx), fy: mix(A.fy, B.fy), sx: mix(A.sx, B.sx), sy: mix(A.sy, B.sy) };
        }
      }
      return shots.final[k];
    };

    const render = (p) => {
      last = p;
      const s = shotAt(p);
      // légère respiration d'entrée
      const z = s.z * (1 + .05 * (1 - ease(ramp(p, 0, .08))));
      const tx = s.sx * W - z * s.fx * w0, ty = s.sy * H - z * s.fy * h0;
      cam.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${z.toFixed(4)})`;
      cam.style.opacity = ease(ramp(p, 0, .05)).toFixed(3);

      const vi = life(p, .02, .05, .1, .13);
      intro.style.opacity = vi.toFixed(3);
      intro.style.visibility = vi > 0 ? 'visible' : 'hidden';
      const vs = ease(ramp(p, .93, .97));
      sign.style.opacity = vs.toFixed(3);
      sign.style.visibility = vs > 0 ? 'visible' : 'hidden';
      sign.style.translate = `0 ${(14 * (1 - vs)).toFixed(1)}px`;

      let scrimV = 0;
      notes.forEach((n) => {
        // le texte arrive un peu avant le plan, la ligne se trace ensuite ;
        // tout s'efface pendant que la note suivante apparaît
        const txt = life(p, n.a - .035, n.a - .005, n.b + .005, n.b + .035);
        const draw = ease(life(p, n.a - .02, n.a + .02, n.b, n.b + .025));
        scrimV = Math.max(scrimV, txt);
        n.el.style.opacity = txt.toFixed(3);
        n.el.style.visibility = txt > 0 ? 'visible' : 'hidden';
        n.el.style.translate = `0 ${(10 * (1 - ease(ramp(p, n.a - .035, n.a)))).toFixed(1)}px`;
        if (!ready || draw <= 0) { n.wires.forEach((w) => { w.g.style.display = 'none'; }); return; }
        const r = n.el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        const lab = n.el.firstElementChild.getBoundingClientRect();
        n.wires.forEach((w, i) => {
          const ax = tx + z * n.anchors[i][0] * w0, ay = ty + z * n.anchors[i][1] * h0;
          let d;
          if (mob) {
            // depuis le haut du texte, à gauche, puis vers le point du vêtement
            const x0 = r.left - sr.left + 2 + i * 14, y0 = r.top - sr.top - 14;
            d = `M${x0.toFixed(1)} ${y0.toFixed(1)} V${(y0 - 22).toFixed(1)} L${ax.toFixed(1)} ${ay.toFixed(1)}`;
          } else {
            const y0 = lab.top - sr.top + lab.height / 2 + i * 12;
            const x0 = n.left ? r.right - sr.left + 18 : r.left - sr.left - 18;
            const x1 = x0 + (n.left ? 34 : -34);
            d = `M${x0.toFixed(1)} ${y0.toFixed(1)} H${x1.toFixed(1)} L${ax.toFixed(1)} ${ay.toFixed(1)}`;
          }
          w.g.style.display = '';
          w.path.setAttribute('d', d);
          w.path.style.strokeDashoffset = (1 - draw).toFixed(4);
          const end = ease(ramp(draw, .82, 1));
          w.dot.setAttribute('cx', ax.toFixed(1)); w.dot.setAttribute('cy', ay.toFixed(1));
          w.ring.setAttribute('cx', ax.toFixed(1)); w.ring.setAttribute('cy', ay.toFixed(1));
          w.dot.style.opacity = end.toFixed(3);
          w.ring.style.opacity = (end * .55).toFixed(3);
          w.ring.setAttribute('r', (4 + 3 * end).toFixed(2));
        });
      });
      scrim.style.opacity = Math.max(scrimV, mob ? Math.max(vi, vs) : 0).toFixed(3);
      // lumière discrète sur le nœud de cravate
      glint.style.opacity = (life(p, .47, .52, .57, .61) * .9).toFixed(3);
    };

    const state = { p: 0 };
    measure();
    render(0);
    const onReady = () => { ready = true; render(last < 0 ? 0 : last); };
    if (cam.classList.contains('is-ready')) onReady();
    else new MutationObserver((list, obs) => { if (cam.classList.contains('is-ready')) { obs.disconnect(); onReady(); } }).observe(cam, { attributes: true, attributeFilter: ['class'] });

    gsap.to(state, {
      p: 1, ease: 'none',
      scrollTrigger: { trigger: scene, start: 'top top', end: 'bottom bottom', scrub: .7, invalidateOnRefresh: true },
      onUpdate: () => render(state.p),
    });
    ScrollTrigger.addEventListener('refreshInit', measure);
    ScrollTrigger.addEventListener('refresh', () => render(state.p));
  }

  /* ---------------------------------------------------------
     6. Animations de défilement
     --------------------------------------------------------- */
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
    el.dataset.splitDone = '1';
  }

  function heroIn() {
    const lines = $$('[data-hero-line]');
    const media = $('.hero__media, .page-hero__media');
    if (!motion) return;
    const tl = gsap.timeline();
    if (media) {
      const isPage = media.classList.contains('page-hero__media');
      tl.fromTo(media, { clipPath: isPage ? 'inset(100% 0 0 0)' : 'inset(0 0 0 100%)' }, { clipPath: 'inset(0% 0 0 0%)', duration: 1.4, ease: 'expo.inOut' })
        .fromTo($('img', media), { scale: 1.18 }, { scale: 1, duration: 2, ease: 'power3.out' }, '<');
    }
    lines.forEach((l, i) => {
      const inLine = l.parentElement.classList.contains('line');
      tl.fromTo(l, inLine ? { yPercent: 110, opacity: 1 } : { y: 24, opacity: 0 }, { yPercent: 0, y: 0, opacity: 1, duration: 1.1, ease: 'power4.out' }, .45 + i * .09);
    });
    // la parallaxe de la photo du hero
    if (media) {
      gsap.to($('picture', media), { yPercent: 12, ease: 'none', scrollTrigger: { trigger: media.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  function scrollAnimations() {
    $$('[data-split]').forEach(splitWords);
    if (!motion) return;

    $$('[data-split]').forEach((el) => {
      gsap.fromTo($$('.w > span', el), { yPercent: 110 }, {
        yPercent: 0, duration: 1.1, stagger: .045, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      });
    });

    $$('[data-reveal]').forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    $$('[data-reveal-img]').forEach((el) => {
      const img = $('img', el);
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
        .to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.35, ease: 'expo.inOut' })
        .fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, '<');
    });

    // parallaxe photographique maîtrisée
    $$('[data-parallax-wrap]').forEach((wrap) => {
      const pic = $('picture', wrap);
      if (!pic) return;
      gsap.set(pic, { scale: 1.12 });
      gsap.fromTo(pic, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-parallax]').forEach((el) => {
      gsap.fromTo(el, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // l'année 1875 se remplit au défilement
    $$('[data-year]').forEach((el) => {
      const wrap = el.parentElement;
      wrap.innerHTML = `<span class="y-outline">${el.textContent}</span><span class="y-fill" aria-hidden="true">${el.textContent}</span>`;
      gsap.to($('.y-fill', wrap), { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 80%', end: 'bottom 35%', scrub: true } });
    });

    // mètre de tailleur qui se déroule
    $$('[data-tape]:not(.atelier__tape):not(.ab-craft__tape)').forEach((svg) => {
      gsap.fromTo(svg, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: svg, start: 'top 92%', end: 'top 50%', scrub: true } });
    });

    // repères historiques
    $$('.heritage__line li').forEach((li, i) => {
      gsap.from(li, { opacity: 0, x: -20, duration: .9, delay: i * .15, ease: 'power3.out', scrollTrigger: { trigger: li.parentElement, start: 'top 85%', once: true } });
    });
  }

  // graduation du mètre (générée une fois, même sans animation)
  $$('[data-tape] .tape__ticks').forEach((g) => {
    const ns = 'http://www.w3.org/2000/svg';
    for (let x = 4, i = 0; x < 600; x += 6, i++) {
      const line = document.createElementNS(ns, 'line');
      const long = i % 10 === 0, mid = i % 5 === 0;
      line.setAttribute('x1', x); line.setAttribute('x2', x);
      line.setAttribute('y1', 6); line.setAttribute('y2', long ? 22 : mid ? 16 : 11);
      g.appendChild(line);
      if (long && i > 0) {
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', x + 2); t.setAttribute('y', 31); t.textContent = String(i / 10);
        g.appendChild(t);
      }
    }
  });

  /* ---------------------------------------------------------
     7. Compteurs (valeurs inchangées : 55, 25, 3.5)
     --------------------------------------------------------- */
  function counters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    els.forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const fmt = (v) => v.toFixed(dec);
      el.setAttribute('aria-label', fmt(end));
      if (!motion) { el.textContent = fmt(end); return; }
      el.textContent = fmt(0);
      const o = { v: 0 };
      gsap.to(o, {
        v: end, duration: 2.2, ease: 'power3.out',
        onUpdate: () => { el.textContent = fmt(o.v); },
        onComplete: () => { el.textContent = fmt(end); },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });
  }

  /* ---------------------------------------------------------
     8. Formulaire de contact — envoi réel, confirmation uniquement si succès
     --------------------------------------------------------- */
  const MSG = {
    required: 'Veuillez remplir tous les champs obligatoires.',
    sending: 'Envoi en cours…',
    success: 'Le message a été envoyé avec succès. Nous vous répondrons dans les meilleurs délais.',
    error: "Le message n'a pas pu être envoyé. Veuillez réessayer plus tard, ou appelez-nous au 04 68 34 29 27.",
    offline: "Vous semblez hors connexion : le message n'a pas été envoyé. Vérifiez votre connexion puis réessayez.",
  };
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  $$('[data-contact-form]').forEach((form) => {
    const status = $('.form-status', form);
    const btn = $('button[type="submit"]', form);
    const label = $('.btn__label', btn);
    const setStatus = (text, kind) => {
      status.hidden = !text;
      status.textContent = text || '';
      status.classList.toggle('is-error', kind === 'error');
      status.classList.toggle('is-success', kind === 'success');
    };
    const fieldOf = (input) => input.closest('.field');
    const validate = (input) => {
      let ok = true;
      if (input.type === 'checkbox') ok = !input.required || input.checked;
      else if (input.type === 'email') ok = emailOk(input.value.trim());
      else if (input.required) ok = input.value.trim().length > 0;
      const f = fieldOf(input);
      if (f) { f.classList.toggle('has-error', !ok); const err = $('.field__error', f); if (err) err.hidden = ok; }
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    $$('input[required], textarea[required]', form).forEach((i) => {
      i.addEventListener(i.type === 'checkbox' ? 'change' : 'blur', () => { if (i.getAttribute('aria-invalid')) validate(i); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const required = $$('input[required], textarea[required]', form);
      const results = required.map(validate);
      if (results.includes(false)) {
        setStatus(MSG.required, 'error');
        required[results.indexOf(false)].focus();
        return;
      }
      // piège anti-robots : on n'envoie rien et on n'affiche aucune confirmation
      if ($('input[name="_honey"]', form).value) return;
      if (!navigator.onLine) { setStatus(MSG.offline, 'error'); return; }

      const data = {};
      new FormData(form).forEach((v, k) => { data[k] = typeof v === 'string' ? v.trim() : v; });
      data._replyto = data.email;

      btn.disabled = true; label.textContent = MSG.sending; setStatus('', null);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      let sent = false;
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
          signal: ctrl.signal,
        });
        const json = await res.json().catch(() => ({}));
        sent = res.ok && (json.success === true || json.success === 'true');
      } catch (err) {
        sent = false;
      } finally {
        clearTimeout(timer);
        btn.disabled = false; label.textContent = 'Envoyer';
      }
      if (sent) {
        form.reset();
        $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
        setStatus(MSG.success, 'success');
      } else {
        setStatus(MSG.error, 'error');
      }
    });
  });

  /* ---------------------------------------------------------
     9. Carte Google Maps soumise à consentement
     --------------------------------------------------------- */
  const MAP_SRC = 'https://www.google.com/maps?q=9+rue+Maximilien+de+Sully,+66000+Perpignan,+France&z=17&output=embed';
  function loadMap(box) {
    const frame = $('[data-map-frame]', box);
    if (!frame || frame.firstChild) return;
    const iframe = document.createElement('iframe');
    iframe.src = MAP_SRC;
    iframe.title = 'Plan d\'accès : Maison Créange, 9 rue Maximilien de Sully, Perpignan';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
    const revoke = document.createElement('button');
    revoke.type = 'button'; revoke.className = 'map__revoke';
    revoke.textContent = 'Masquer la carte et retirer mon accord';
    revoke.addEventListener('click', () => {
      if (local) local.removeItem('mc-maps');
      frame.innerHTML = ''; box.classList.remove('is-loaded');
      const accept = $('[data-map-accept]', box); if (accept) accept.focus();
    });
    frame.appendChild(revoke);
    box.classList.add('is-loaded');
    if (hasGsap) ScrollTrigger.refresh();
  }
  $$('[data-map]').forEach((box) => {
    const accept = $('[data-map-accept]', box);
    if (local && local.getItem('mc-maps') === '1') loadMap(box);
    if (accept) accept.addEventListener('click', () => { if (local) local.setItem('mc-maps', '1'); loadMap(box); });
  });

  /* ---------------------------------------------------------
     Lancement
     --------------------------------------------------------- */
  $$('[data-split]').forEach(splitWords);
  counters();
  readyImages();

  if (!motion) {
    root.classList.remove('is-arriving');
    root.classList.add('no-intro');
    if (intro) intro.remove();
    scenes();
    aboutScenes();
    if (companion) companion.start();
    return;
  }

  scrollAnimations();
  scenes();
  aboutScenes();
  homme();

  const begin = () => {
    heroIn();
    ScrollTrigger.refresh();
    if (companion) companion.start();
  };

  if (arrivingFromSite) {
    curtainOut();
    setTimeout(begin, 280);
  } else if (intro && !root.classList.contains('no-intro')) {
    // le hero se dévoile pendant que l'intro remonte
    let heroStarted = false;
    const startHero = () => { if (!heroStarted) { heroStarted = true; heroIn(); } };
    introDone = runIntro(startHero);
    introDone.then(() => { startHero(); if (companion) companion.start(); ScrollTrigger.refresh(); });
  } else {
    if (intro) intro.remove();
    begin();
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
