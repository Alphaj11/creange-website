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
  if (motion) root.classList.add('motion');

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
    gsap.set(curtain, { yPercent: 0 });
    const tie = $('.curtain__tie', curtain);
    gsap.timeline({ onComplete: () => { gsap.set(curtain, { yPercent: 100 }); onDone && onDone(); } })
      .fromTo(tie, { opacity: 1, y: 0 }, { opacity: 0, y: -30, duration: .35, ease: 'power2.in' })
      .to(curtain, { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '<.05');
  }

  function curtainIn(href) {
    if (!motion || !curtain) { window.location.href = href; return; }
    const tie = $('.curtain__tie', curtain);
    gsap.timeline({ onComplete: () => { window.location.href = href; } })
      .fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: .65, ease: 'expo.inOut' })
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
    if (!motion || arrivingFromSite) {
      root.classList.add('no-intro');
      return Promise.resolve();
    }
    const seen = local && local.getItem('mc-intro') === '1';
    if (local) local.setItem('mc-intro', '1');
    document.body.style.overflow = 'hidden';

    return new Promise((resolve) => {
      const knot = $('.intro__knot', intro);
      const blade = $('.intro__blade', intro);
      const tieBox = $('.intro__tie', intro);
      const letters = $$('.intro__word > span', intro);
      const maison = $('.intro__maison > span', intro);
      const since = $('.intro__since > span', intro);
      const skip = $('[data-intro-skip]', intro);

      // Nouage : la lame remonte sous le nœud, puis le nœud se resserre et la soie retombe.
      gsap.set(blade, { yPercent: 34, rotate: -4, opacity: 0 });
      gsap.set(knot, { scaleX: 1.34, scaleY: .74, rotate: 6, opacity: 0 });
      gsap.set(tieBox, { y: -14 });
      gsap.set(letters, { yPercent: 115 });
      gsap.set([maison, since], { yPercent: 120 });

      const finish = () => {
        document.body.style.overflow = '';
        intro.remove();
        resolve();
      };

      const tl = gsap.timeline({ onComplete: finish });
      if (seen) {
        // version courte pour les visiteurs déjà venus
        tl.to([knot, blade], { opacity: 1, duration: .25 })
          .to(blade, { yPercent: 0, rotate: 0, duration: .6, ease: 'power3.out' }, 0)
          .to(knot, { scaleX: 1, scaleY: 1, rotate: 0, duration: .55, ease: 'power3.out' }, .15)
          .to(tieBox, { y: 0, duration: .6, ease: 'power2.out' }, 0)
          .to(letters, { yPercent: 0, duration: .6, stagger: .025, ease: 'power4.out' }, .2)
          .to(maison, { yPercent: 0, duration: .5, ease: 'power3.out' }, .3)
          .to(intro, { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '+=.2')
          .add(() => onExit && onExit(), '<.1');
      } else {
        tl.to(knot, { opacity: 1, duration: .5, ease: 'power1.out' }, .1)
          .to(blade, { opacity: 1, duration: .4, ease: 'power1.out' }, .35)
          // la lame est tirée vers le haut à travers le nœud
          .to(blade, { yPercent: 0, duration: 1.15, ease: 'power3.inOut' }, .35)
          .to(tieBox, { y: 0, duration: 1.3, ease: 'power2.inOut' }, .35)
          // le nœud se resserre en fin de geste
          .to(knot, { scaleX: 1, scaleY: 1, duration: .75, ease: 'power4.out' }, 1.15)
          .to(knot, { rotate: 0, duration: .9, ease: 'power3.out' }, 1.1)
          // la soie retombe sous son propre poids : oscillation amortie
          .to(blade, { rotate: 2.2, duration: .32, ease: 'sine.out' }, 1.35)
          .to(blade, { rotate: -1, duration: .42, ease: 'sine.inOut' })
          .to(blade, { rotate: 0, duration: .5, ease: 'sine.inOut' })
          .to(maison, { yPercent: 0, duration: .7, ease: 'power3.out' }, 1.45)
          .to(letters, { yPercent: 0, duration: .9, stagger: .05, ease: 'power4.out' }, 1.5)
          .to(since, { yPercent: 0, duration: .6, ease: 'power3.out' }, 2.05)
          .to(intro, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 3.0)
          .add(() => onExit && onExit(), 3.15);
      }

      const skipNow = () => { if (tl.progress() < .97) tl.progress(1); };
      skip.addEventListener('click', skipNow);
      intro.addEventListener('click', skipNow);
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
      const light = 1 + Math.max(-.06, Math.min(.08, angle * .006));
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      swing.style.transform = `rotate(${angle.toFixed(2)}deg) skewX(${(angle * .18).toFixed(2)}deg)`;
      swing.style.filter = `brightness(${light.toFixed(3)})`;
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
  function scenes() {
    if (!motion) {
      $$('.scene .stage__decor--interieur').forEach((d) => { d.style.opacity = '0'; });
      return;
    }
    const mm = gsap.matchMedia();

    mm.add('(min-width: 901px) and (min-height: 521px)', () => {
      const scrub = { scrub: 1.1, start: 'top top', end: 'bottom bottom' };
      const st = (scene) => ({ trigger: scene, ...scrub });

      // SCÈNE 01 : travelling avant à travers la porte de la boutique
      const entree = $('.scene--entree');
      if (entree) {
        const facade = $('.stage__decor--facade', entree);
        const inside = $('.stage__decor--interieur', entree);
        gsap.set(facade, { transformOrigin: '49% 62%' });
        gsap.timeline({ scrollTrigger: st(entree) })
          .to($('.entree__copy', entree), { opacity: 0, y: -40, duration: .22, ease: 'power1.in' }, .05)
          .to($('.scroll-cue', entree), { opacity: 0, duration: .1 }, 0)
          .to(facade, { scale: 2.15, duration: .75, ease: 'power2.in' }, 0)
          .to($('img', facade), { filter: 'brightness(.55) saturate(.9) blur(3px)', duration: .3, ease: 'none' }, .45)
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
        gsap.timeline({ scrollTrigger: st(costume) })
          .fromTo(decor, { scale: 1.6, transformOrigin: '50% 82%' }, { scale: 1.12, duration: 1, ease: 'none' }, 0)
          // départ : petit, flou, dans l'ombre du portant
          .fromTo(prod, { xPercent: -95, yPercent: 8, scale: .38, rotateY: -24, z: -500 },
            { xPercent: 0, yPercent: 0, scale: 1, rotateY: 0, z: 0, duration: .48, ease: 'power2.inOut' }, 0)
          .fromTo(img, { filter: 'blur(5px) brightness(.45) drop-shadow(0 10px 10px rgba(5,10,20,.3))' },
            { filter: 'blur(0px) brightness(1) drop-shadow(0 34px 34px rgba(5,10,20,.55))', duration: .4, ease: 'power1.out' }, .06)
          .fromTo(shadow, { opacity: .15, scaleX: .4 }, { opacity: .9, scaleX: 1, duration: .45, ease: 'power2.inOut' }, 0)
          // légère rotation pour révéler la coupe, puis retour face
          .to(prod, { rotateY: 9, duration: .16, ease: 'sine.inOut' }, .5)
          .to(prod, { rotateY: 0, duration: .2, ease: 'sine.inOut' }, .68)
          .fromTo($('[data-copy]', costume), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .14 }, .32)
          .to($$('.hotspot__dot', costume), { opacity: 1, duration: .05, stagger: .06 }, .5)
          .fromTo($$('.hotspot__card', costume), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .08, stagger: .07 }, .54)
          .to([prod, $('[data-copy]', costume), $('.hotspots', costume)], { opacity: 0, duration: .08 }, .93);
      }

      // SCÈNE 03 : la chemise quitte l'étagère
      const chemise = $('.scene--chemise');
      if (chemise) {
        const decor = $('[data-cam]', chemise);
        const prod = $('[data-product]', chemise);
        const img = $('.product__img', prod);
        gsap.timeline({ scrollTrigger: st(chemise) })
          .fromTo(decor, { scale: 2.3, transformOrigin: '12% 36%' }, { scale: 1.8, x: '-3%', duration: 1, ease: 'none' }, 0)
          .fromTo(prod, { xPercent: -150, yPercent: -55, scale: .3, rotateX: 58, rotateZ: 8, z: -400 },
            { xPercent: 0, yPercent: 0, scale: 1, rotateX: 18, rotateZ: -5, z: 0, duration: .5, ease: 'power2.inOut' }, 0)
          .to(prod, { rotateX: 10, duration: .3, ease: 'sine.inOut' }, .5)
          .fromTo(img, { filter: 'blur(4px) brightness(.5) drop-shadow(0 8px 8px rgba(5,10,20,.3))' },
            { filter: 'blur(0px) brightness(1.02) drop-shadow(0 40px 36px rgba(5,10,20,.55))', duration: .4, ease: 'power1.out' }, .08)
          .fromTo($('[data-copy]', chemise), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .14 }, .3)
          .fromTo($$('[data-loupe]', chemise), { opacity: 0, y: 24, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .1, stagger: .1 }, .55)
          .to([prod, $('[data-copy]', chemise), ...$$('[data-loupe]', chemise)], { opacity: 0, duration: .08 }, .93);
      }

      // SCÈNE 04 : la cravate descend de la vitrine et se balance sous son poids
      const acc = $('.scene--accessoires');
      if (acc) {
        const decor = $('[data-cam]', acc);
        const prod = $('[data-product]', acc);
        const swingEl = $('[data-swing]', acc);
        gsap.timeline({ scrollTrigger: st(acc) })
          .fromTo(decor, { scale: 2.1, transformOrigin: '86% 72%' }, { scale: 1.7, x: '2%', duration: 1, ease: 'none' }, 0)
          .fromTo(prod, { yPercent: -110 }, { yPercent: 0, duration: .32, ease: 'power2.in' }, .02)
          // oscillation amortie à l'arrivée (gravité)
          .fromTo(swingEl, { rotate: 0 }, { rotate: 7, duration: .07, ease: 'sine.out' }, .34)
          .to(swingEl, { rotate: -4.5, duration: .09, ease: 'sine.inOut' })
          .to(swingEl, { rotate: 2.5, duration: .09, ease: 'sine.inOut' })
          .to(swingEl, { rotate: -1, duration: .08, ease: 'sine.inOut' })
          .to(swingEl, { rotate: 0, duration: .08, ease: 'sine.inOut' })
          .fromTo($$('[data-vitrine]', acc), { opacity: 0, y: 60, rotateY: -8 }, { opacity: 1, y: 0, rotateY: 0, duration: .22, stagger: .1, ease: 'power2.out' }, .2)
          .to($$('[data-vitrine]', acc)[0] || {}, { y: -40, duration: .5, ease: 'none' }, .45)
          .to($$('[data-vitrine]', acc)[1] || {}, { y: -80, duration: .5, ease: 'none' }, .45)
          .fromTo($('[data-copy]', acc), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .14 }, .36)
          .to(prod, { yPercent: -120, duration: .14, ease: 'power2.in' }, .86)
          .to([$('[data-copy]', acc), ...$$('[data-vitrine]', acc)], { opacity: 0, duration: .08 }, .93);
      }

      // SCÈNE 05 : la paire glisse sur le plateau et pivote légèrement
      const shoes = $('.scene--chaussures');
      if (shoes) {
        const decor = $('[data-cam]', shoes);
        const prod = $('[data-product]', shoes);
        const img = $('.product__img', prod);
        const shadow = $('.product__shadow', prod);
        gsap.timeline({ scrollTrigger: st(shoes) })
          .fromTo(decor, { scale: 1.5, transformOrigin: '40% 70%' }, { scale: 1.12, duration: 1, ease: 'none' }, 0)
          .fromTo($('.plinth', shoes), { rotateX: 70, opacity: 0 }, { rotateX: 58, opacity: 1, duration: .3, ease: 'power2.out' }, 0)
          .fromTo(prod, { xPercent: 60, z: -600, scale: .55, rotateY: -28 }, { xPercent: 0, z: 0, scale: 1, rotateY: -8, duration: .5, ease: 'power3.inOut' }, 0)
          .to(prod, { rotateY: 10, duration: .35, ease: 'sine.inOut' }, .52)
          // la lumière glisse sur le cuir pendant la rotation
          .fromTo(img, { filter: 'brightness(.5) contrast(1) drop-shadow(0 10px 10px rgba(5,10,20,.3))' },
            { filter: 'brightness(1.04) contrast(1.04) drop-shadow(0 26px 22px rgba(5,10,20,.6))', duration: .45, ease: 'power1.out' }, .05)
          .to(img, { filter: 'brightness(1.14) contrast(1.08) drop-shadow(0 26px 22px rgba(5,10,20,.6))', duration: .16, ease: 'sine.inOut' }, .6)
          .to(img, { filter: 'brightness(1) contrast(1.03) drop-shadow(0 26px 22px rgba(5,10,20,.6))', duration: .2, ease: 'sine.inOut' }, .76)
          .fromTo(shadow, { opacity: .1, scaleX: .5 }, { opacity: .85, scaleX: 1, duration: .5, ease: 'power2.inOut' }, 0)
          .fromTo($('[data-copy]', shoes), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .14 }, .3)
          .to([prod, $('[data-copy]', shoes)], { opacity: 0, duration: .08 }, .94);
      }
      return () => {};
    });

    // Mobile / tablette : pas de scène bloquée, le vêtement avance pendant que la scène traverse l'écran
    mm.add('(max-width: 900px), (max-height: 520px)', () => {
      $$('.scene').forEach((scene) => {
        const decor = $('[data-cam], .stage__decor--facade', scene);
        const prod = $('[data-product]', scene);
        if (decor) gsap.fromTo(decor, { scale: 1.25 }, { scale: 1.05, ease: 'none', scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true } });
        if (prod) gsap.fromTo(prod, { scale: .8, y: 50, opacity: .3 }, { scale: 1, y: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: scene, start: 'top 85%', end: 'top 25%', scrub: true } });
        $$('[data-copy], [data-loupe], [data-vitrine], .hotspot__card', scene).forEach((el) => {
          gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
        });
      });
      return () => {};
    });
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
    $$('[data-tape]').forEach((svg) => {
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

  if (!motion) {
    root.classList.remove('is-arriving');
    root.classList.add('no-intro');
    if (intro) intro.remove();
    scenes();
    if (companion) companion.start();
    return;
  }

  scrollAnimations();
  scenes();

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
