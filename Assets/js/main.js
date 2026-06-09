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
        window.location.assign('/obrigado');
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

  // ---------- 10. WHATSAPP CLICK — força abrir o widget flutuante do RD Station ----------
  // Procura o iframe/botão do widget e dispara click. Se não achar (widget ainda
  // carregando), aguarda até 2s. Fallback final: abre wa.me em nova aba.
  function findRdWhatsAppEl() {
    // Possíveis seletores do widget do RD Station Conversas
    const selectors = [
      '.bricks-widget',
      '.bricks-widget-iframe',
      'iframe[src*="rdstation"]',
      'iframe[src*="rdmkt"]',
      'iframe[src*="rd.services"]',
      'iframe[id^="rd-"]',
      '[data-rd-conversas]',
      '#rd-widget',
      '.rdsm-floating',
      '.rd-floating-button',
      'iframe[title*="WhatsApp" i]',
      'iframe[title*="conversas" i]'
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return null;
  }

  function openRdWhatsApp() {
    const el = findRdWhatsAppEl();
    if (!el) return false;
    try {
      // iframe: dá foco. Botão: click.
      if (el.tagName === 'IFRAME') {
        el.focus();
        // Tenta clicar no iframe (alguns widgets respondem)
        try { el.contentWindow?.document?.body?.click?.(); } catch (_) {}
      } else {
        el.click();
      }
      return true;
    } catch (_) { return false; }
  }

  document.querySelectorAll('a[href*="wa.me"], [data-rd-whatsapp]').forEach(link => {
    link.addEventListener('click', (e) => {
      // Tracking
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'whatsapp_click', location: window.location.pathname });
      } catch (_) {}

      // Tenta abrir widget RD agora
      if (openRdWhatsApp()) {
        e.preventDefault();
        return;
      }

      // Widget pode estar carregando — espera até 1.5s antes de cair pro wa.me
      e.preventDefault();
      const start = Date.now();
      const poll = setInterval(() => {
        if (openRdWhatsApp()) {
          clearInterval(poll);
          return;
        }
        if (Date.now() - start > 1500) {
          clearInterval(poll);
          // Fallback: abre wa.me em nova aba
          window.open(link.href, '_blank', 'noopener');
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
