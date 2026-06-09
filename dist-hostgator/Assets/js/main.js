/* ================================================================
   UNITECH — Landing Page interactions
   Vanilla JS, zero deps
   ================================================================ */
(function () {
  'use strict';

  // ---------- 1. YEAR ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- 2. HEADER ON SCROLL ----------
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- 3. MOBILE MENU ----------
  const menuBtn = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = menuBtn.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      mobileMenu.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('no-scroll', isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menuBtn.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  // ---------- 4. SCROLL REVEAL ----------
  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealItems.forEach(el => io.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }

  // ---------- 5. COUNTER ANIMATIONS ----------
  const counters = document.querySelectorAll('.counter');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const duration = 1600;
    const start = performance.now();
    const formatter = new Intl.NumberFormat('pt-BR');
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(target * eased);
      el.textContent = formatter.format(value);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatter.format(target);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => counterIO.observe(c));
  } else {
    counters.forEach(animateCounter);
  }

  // ---------- 6. PHONE MASK ----------
  const phoneInputs = document.querySelectorAll('[data-mask="phone"]');
  const maskPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return '(' + digits;
    if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    if (digits.length <= 10) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
  };
  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = maskPhone(e.target.value);
    });
  });

  // ---------- 7. FORM HANDLING ----------
  const modal = document.getElementById('successModal');
  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };
  if (modal) {
    modal.querySelector('.modal__close').addEventListener('click', closeModal);
    modal.querySelector('.modal__overlay').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  const validateField = (field) => {
    const value = field.value.trim();
    if (field.hasAttribute('required') && !value) return false;
    if (field.type === 'email' && value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }
    if (field.type === 'tel' && value) {
      return value.replace(/\D/g, '').length >= 10;
    }
    if (field.type === 'checkbox' && field.hasAttribute('required')) {
      return field.checked;
    }
    return true;
  };

  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
      let valid = true;
      let firstInvalid = null;

      fields.forEach(field => {
        const ok = validateField(field);
        field.style.borderColor = ok ? '' : 'var(--red)';
        if (!ok && !firstInvalid) firstInvalid = field;
        if (!ok) valid = false;
      });

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Fire tracking events (GTM dataLayer + Meta Pixel placeholders)
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'generate_lead',
          form_id: form.dataset.form,
          form_location: form.dataset.form === 'hero' ? 'hero' : 'cta_final'
        });
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Lead', { source: form.dataset.form });
        }
      } catch (_) {}

      // Persist lead to admin (best-effort; never block UX)
      try {
        const fd = new FormData(form);
        const payload = {
          name:    fd.get('name')    || '',
          company: fd.get('company') || '',
          email:   fd.get('email')   || '',
          phone:   fd.get('phone')   || '',
          needs:   fd.get('needs')   || '',
          source:  form.dataset.form || 'unknown',
          utms:    Object.fromEntries(
            ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']
              .map(k => [k, new URLSearchParams(location.search).get(k) || ''])
              .filter(([,v]) => v)
          )
        };
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      } catch (_) {}

      // UI feedback
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Enviando…</span>';

      // Redirect to thank-you page (give 350ms for keepalive fetch to flush)
      setTimeout(() => {
        window.location.assign('/obrigado.html');
      }, 350);
    });

    // Clear error on input
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => { field.style.borderColor = ''; });
      field.addEventListener('change', () => { field.style.borderColor = ''; });
    });
  });

  // ---------- 8. BUTTON SHINE FOLLOW MOUSE ----------
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--mx', x + '%');
      btn.style.setProperty('--my', y + '%');
    });
  });

  // ---------- 9. SMOOTH ANCHOR (offset for sticky header) ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerOffset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ---------- 10. TODOS OS CTAs (a.btn) → abrem o widget flutuante do RD Station ----------
  // Estratégia robusta: localizar o botão flutuante em qualquer canto + dispatch
  // de eventos sintéticos completos (mousedown → mouseup → click).

  let rdWidgetRef = null;

  function isInBottomCorner(rect) {
    const w = window.innerWidth, h = window.innerHeight;
    const inBottom = (h - rect.bottom) < 120 || (h - rect.top) < 200;
    const inLeftOrRight = rect.left < 140 || (w - rect.right) < 140;
    return inBottom && inLeftOrRight;
  }

  function looksLikeChatButton(el) {
    const s = getComputedStyle(el);
    if (s.position !== 'fixed') return false;
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    if (r.width < 30 || r.width > 220) return false;
    if (r.height < 30 || r.height > 220) return false;
    if (!isInBottomCorner(r)) return false;
    return true;
  }

  function scoreWidget(el) {
    // Maior score = melhor candidato
    let s = 0;
    const c = (el.className || '').toString().toLowerCase();
    const i = (el.id || '').toLowerCase();
    const all = c + ' ' + i;
    if (/bricks/.test(all)) s += 50;
    if (/rdstation|rd-conversas|rdsm/.test(all)) s += 30;
    if (/whatsapp|chat|conversa/.test(all)) s += 20;
    if (el.tagName === 'IFRAME') s += 10;
    if (el.shadowRoot) s += 15;
    return s;
  }

  function findRdWidget() {
    // 1) Conhecidos por classe/id
    const known = document.querySelector(
      'bricks-component, [class*="bricks" i], [id*="bricks" i], ' +
      '[class*="rdstation" i], [id*="rdstation" i], ' +
      '[class*="rd-conversas" i], [id*="rd-conversas" i], ' +
      '[class*="rdsm" i], [id*="rdsm" i], ' +
      'iframe[src*="bricks" i], iframe[src*="rdstation" i], iframe[src*="rd.services" i]'
    );
    if (known) return known;

    // 2) Brute force: todos position:fixed em canto, pegando o de maior score
    const candidates = Array.from(document.querySelectorAll('div, button, a, iframe, [role="button"]'))
      .filter(looksLikeChatButton);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => scoreWidget(b) - scoreWidget(a));
    return candidates[0];
  }

  function fireClick(el) {
    // Dispara sequência completa (mousedown, mouseup, click) c/ PointerEvent
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0, buttons: 1 };
    try { el.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent('mousedown', opts)); } catch (_) {}
    try { el.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 })); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent('mouseup', { ...opts, buttons: 0 })); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 })); } catch (_) {}
    try { el.click(); } catch (_) {}
  }

  function openRdWhatsApp() {
    // 1) APIs globais
    try {
      if (window.RDStationConversas?.openConversation)   { window.RDStationConversas.openConversation(); return true; }
      if (window.RDStationConversas?.toggleConversation) { window.RDStationConversas.toggleConversation(); return true; }
      if (window.RDStationConversas?.open)               { window.RDStationConversas.open(); return true; }
      if (window._bricks?.openConversation)              { window._bricks.openConversation(); return true; }
      if (window.bricks?.open)                           { window.bricks.open(); return true; }
    } catch (_) {}

    // 2) Localiza widget (com cache)
    if (!rdWidgetRef || !document.contains(rdWidgetRef)) {
      rdWidgetRef = findRdWidget();
    }
    if (!rdWidgetRef) return false;

    try {
      // 2a) Shadow DOM — procura botão dentro
      if (rdWidgetRef.shadowRoot) {
        const inner = rdWidgetRef.shadowRoot.querySelector(
          'button, [role="button"], [class*="launcher"], [class*="button"]'
        );
        if (inner) { fireClick(inner); return true; }
      }

      // 2b) Botão interno
      const innerBtn = rdWidgetRef.querySelector?.('button, [role="button"], a');
      if (innerBtn && innerBtn !== rdWidgetRef) {
        fireClick(innerBtn);
        return true;
      }

      // 2c) iframe: postMessage + click
      if (rdWidgetRef.tagName === 'IFRAME') {
        try { rdWidgetRef.contentWindow?.postMessage({ type: 'bricks-open' }, '*'); } catch (_) {}
        try { rdWidgetRef.contentWindow?.postMessage({ type: 'open' }, '*'); } catch (_) {}
        fireClick(rdWidgetRef);
        return true;
      }

      // 2d) Click direto
      fireClick(rdWidgetRef);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Observa o DOM até o widget aparecer (carrega async via GTM/RD)
  function watchForWidget() {
    rdWidgetRef = findRdWidget();
    if (rdWidgetRef) return;
    const obs = new MutationObserver(() => {
      rdWidgetRef = findRdWidget();
      if (rdWidgetRef) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    // Para de procurar depois de 30s
    setTimeout(() => obs.disconnect(), 30000);
  }
  watchForWidget();

  function nativeFallback(link) {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        const headerOffset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    } else if (href.startsWith('http')) {
      window.open(href, link.target || '_blank', 'noopener');
    } else if (href) {
      window.location.href = href;
    }
  }

  document.querySelectorAll('a.btn').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('tel:')) return;

    link.addEventListener('click', (e) => {
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'cta_click',
          cta_text: (link.textContent || '').trim().slice(0, 80),
          cta_href: href,
          location: window.location.pathname
        });
      } catch (_) {}

      e.preventDefault();
      if (openRdWhatsApp()) return;

      // Widget ainda carregando: espera até 3s
      const start = Date.now();
      const poll = setInterval(() => {
        if (openRdWhatsApp()) { clearInterval(poll); return; }
        if (Date.now() - start > 3000) {
          clearInterval(poll);
          nativeFallback(link);
        }
      }, 100);
    });
  });

  // ---------- 11. BACKGROUND VIDEO — autoplay loop, pause when offscreen ----------
  document.querySelectorAll('.invisible-cost__bg-video, .invisible-cost__video, .invisible-cost__video-bg').forEach(video => {
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.controls = false;

    const tryPlay = () => {
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };

    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) tryPlay();
          else video.pause();
        });
      }, { threshold: 0.1 });
      vio.observe(video);
    } else {
      tryPlay();
    }
  });

  // ---------- 12. PRODUCT SHOWCASE — tabs + featured rotation ----------
  document.querySelectorAll('[data-showcase]').forEach(initShowcase);

  function initShowcase(showcase) {
    const tabs   = showcase.querySelectorAll('.showcase__tab');
    const panels = showcase.querySelectorAll('.showcase__panel');
    let autoTimer = null;
    let isHovered = false;
    const ROTATE_MS = 3500;

    const getActivePanel = () => showcase.querySelector('.showcase__panel.is-active') || panels[0];

    // Cache initial name/spec for each panel's first product
    panels.forEach(panel => {
      const nameEl = panel.querySelector('.showcase__name');
      const specEl = panel.querySelector('.showcase__spec');
      if (nameEl) nameEl.dataset.initialName = nameEl.textContent.trim();
      if (specEl) specEl.dataset.initialSpec = specEl.textContent.trim();
      panel.dataset.activeIdx = '0';
    });

    function setFeatured(panel, rawIdx) {
      const heroImgs = panel.querySelectorAll('.showcase__hero-img');
      const thumbs   = panel.querySelectorAll('.showcase__thumb');
      const nameEl   = panel.querySelector('.showcase__name');
      const specEl   = panel.querySelector('.showcase__spec');
      const total = heroImgs.length;
      if (!total) return;
      const idx = ((rawIdx % total) + total) % total;

      heroImgs.forEach(img => img.classList.toggle('is-active', Number(img.dataset.idx) === idx));
      thumbs.forEach(t   => t.classList.toggle('is-active',   Number(t.dataset.idx)   === idx));

      const thumb = panel.querySelector('.showcase__thumb[data-idx="' + idx + '"]');
      if (thumb && nameEl && specEl) {
        const newName = thumb.dataset.name || nameEl.dataset.initialName;
        const newSpec = thumb.dataset.spec || specEl.dataset.initialSpec;
        nameEl.style.transition = 'opacity .2s';
        specEl.style.transition = 'opacity .2s';
        nameEl.style.opacity = '0';
        specEl.style.opacity = '0';
        setTimeout(function () {
          nameEl.textContent = newName;
          specEl.textContent = newSpec;
          nameEl.style.opacity = '1';
          specEl.style.opacity = '1';
        }, 180);
      }
      panel.dataset.activeIdx = String(idx);
    }

    function startAuto() {
      stopAuto();
      if (isHovered) return;
      autoTimer = setInterval(function () {
        const panel = getActivePanel();
        if (!panel) return;
        const cur = parseInt(panel.dataset.activeIdx || '0', 10);
        setFeatured(panel, cur + 1);
      }, ROTATE_MS);
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    // Tab click → switch panel
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const cat = tab.dataset.cat;
        tabs.forEach(function (t) {
          const active = (t === tab);
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          const match = (p.dataset.panel === cat);
          p.classList.toggle('is-active', match);
          if (match) p.removeAttribute('hidden');
          else p.setAttribute('hidden', '');
        });
        startAuto();
      });
    });

    // Thumb click → swap featured
    showcase.querySelectorAll('.showcase__thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        const panel = thumb.closest('.showcase__panel');
        if (!panel) return;
        setFeatured(panel, parseInt(thumb.dataset.idx, 10));
        startAuto();
      });
    });

    // Prev / Next arrow click → step ±1 (loops via modulo in setFeatured)
    showcase.querySelectorAll('.showcase__arrow').forEach(function (arrow) {
      arrow.addEventListener('click', function () {
        const panel = arrow.closest('.showcase__panel');
        if (!panel) return;
        const dir = parseInt(arrow.dataset.dir, 10) || 1;
        const cur = parseInt(panel.dataset.activeIdx || '0', 10);
        setFeatured(panel, cur + dir);
        startAuto();
      });
    });

    // Pause on hover
    showcase.addEventListener('mouseenter', function () { isHovered = true;  stopAuto(); });
    showcase.addEventListener('mouseleave', function () { isHovered = false; startAuto(); });

    // Kick it off immediately + also when visible
    startAuto();
    if ('IntersectionObserver' in window) {
      const sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) startAuto();
          else stopAuto();
        });
      }, { threshold: 0.05 });
      sio.observe(showcase);
    }
  }

})();
