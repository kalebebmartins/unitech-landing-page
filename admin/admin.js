/* ================================================================
   UNITECH ADMIN — Vanilla JS, no framework
   ================================================================ */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const els = {
    loginScreen: $('#loginScreen'),
    loginForm:   $('#loginForm'),
    loginError:  $('#loginError'),
    dashboard:   $('#dashboard'),
    meName:      $('#meName'),
    meRole:      $('#meRole'),
    logoutBtn:   $('#logoutBtn'),
    toast:       $('#toast'),

    contentForm: $('#contentForm'),
    contentSave: $('#contentSave'),

    scriptsHead: $('#scriptsHead'),
    scriptsFooter: $('#scriptsFooter'),
    scriptsSave: $('#scriptsSave'),

    leadsTable:  $('#leadsTable tbody'),
    leadsCount:  $('#leadsCount'),
    leadsEmpty:  $('#leadsEmpty'),
    leadsRefresh:$('#leadsRefresh'),
    leadsExport: $('#leadsExport'),

    usersList:   $('#usersList'),
    userAddBtn:  $('#userAddBtn'),
    userAddForm: $('#userAddForm'),
    userAddCancel: $('#userAddCancel'),
    myPwdForm:   $('#myPwdForm')
  };

  let me = null;
  let leadsCache = [];

  // ---------- UTILITIES ----------
  async function api(path, opts = {}) {
    const init = {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      credentials: 'same-origin'
    };
    if (opts.body) init.body = JSON.stringify(opts.body);
    const res = await fetch(path, init);
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const err = new Error(data?.error || 'request_failed');
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  function toast(msg, isError = false) {
    els.toast.textContent = msg;
    els.toast.classList.toggle('is-error', isError);
    els.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { els.toast.hidden = true; }, 2800);
  }

  function fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function escapeHTML(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---------- AUTH ----------
  async function checkSession() {
    try {
      const { user } = await api('/api/auth/me');
      me = user;
      enterDashboard();
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    els.dashboard.hidden = true;
    els.loginScreen.hidden = false;
    setTimeout(() => $('#login-user')?.focus(), 50);
  }

  async function enterDashboard() {
    els.loginScreen.hidden = true;
    els.dashboard.hidden = false;
    els.meName.textContent = me.username;
    els.meRole.textContent = me.role || 'admin';
    await Promise.all([loadContent(), loadScripts(), loadLeads(), loadUsers()]);
  }

  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginError.hidden = true;
    const fd = new FormData(els.loginForm);
    const btn = els.loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Entrando…';
    console.log('[admin] login submit', { user: fd.get('username') });
    try {
      const { user } = await api('/api/auth/login', {
        method: 'POST',
        body: { username: fd.get('username'), password: fd.get('password') }
      });
      console.log('[admin] login ok', user);
      me = user;
      els.loginForm.reset();
      await enterDashboard();
    } catch (e) {
      console.error('[admin] login failed', e);
      const msg = e.status === 401
        ? 'Usuário ou senha inválidos.'
        : e.status
          ? `Erro ${e.status}: ${e.message || 'request_failed'}`
          : `Erro de rede: ${e.message || 'verifique sua conexão'}`;
      els.loginError.textContent = msg;
      els.loginError.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });

  els.logoutBtn.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    me = null;
    showLogin();
  });

  // ---------- TABS ----------
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      $$('.nav-btn').forEach(b => b.classList.toggle('is-active', b === btn));
      $$('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.panel === tab));
      if (tab === 'leads') loadLeads();
      if (tab === 'users') loadUsers();
    });
  });

  // ---------- CONTENT (LP texts) ----------
  async function loadContent() {
    try {
      const c = await api('/api/content');
      Object.entries(c).forEach(([key, val]) => {
        const el = els.contentForm.querySelector(`[name="${key}"]`);
        if (el) el.value = val;
      });
    } catch (e) {
      console.warn('loadContent failed:', e.message);
    }
  }

  els.contentSave.addEventListener('click', async () => {
    const fd = new FormData(els.contentForm);
    const map = {};
    for (const [k, v] of fd.entries()) map[k] = String(v || '').trim();
    els.contentSave.disabled = true;
    try {
      await api('/api/content', { method: 'POST', body: map });
      toast('Textos salvos!');
    } catch (e) {
      toast('Erro ao salvar textos', true);
    } finally {
      els.contentSave.disabled = false;
    }
  });

  // ---------- SCRIPTS (head/footer) ----------
  async function loadScripts() {
    try {
      const s = await api('/api/scripts');
      els.scriptsHead.value = s.head || '';
      els.scriptsFooter.value = s.footer || '';
    } catch (e) {
      console.warn('loadScripts failed:', e.message);
    }
  }

  els.scriptsSave.addEventListener('click', async () => {
    els.scriptsSave.disabled = true;
    try {
      await api('/api/scripts', {
        method: 'POST',
        body: { head: els.scriptsHead.value, footer: els.scriptsFooter.value }
      });
      toast('Scripts atualizados!');
    } catch (e) {
      toast('Erro ao salvar scripts', true);
    } finally {
      els.scriptsSave.disabled = false;
    }
  });

  // ---------- LEADS ----------
  async function loadLeads() {
    try {
      const { leads } = await api('/api/leads');
      leadsCache = leads;
      renderLeads(leads);
    } catch (e) {
      console.warn('loadLeads failed:', e.message);
    }
  }

  function renderLeads(leads) {
    els.leadsTable.innerHTML = '';
    if (!leads.length) {
      els.leadsEmpty.hidden = false;
      els.leadsCount.hidden = true;
      return;
    }
    els.leadsEmpty.hidden = true;
    els.leadsCount.textContent = leads.length;
    els.leadsCount.hidden = false;

    const rows = leads.map(l => `
      <tr data-id="${escapeHTML(l.id)}">
        <td>${fmtDate(l.ts)}</td>
        <td><strong>${escapeHTML(l.name)}</strong></td>
        <td>${escapeHTML(l.company)}</td>
        <td><a href="mailto:${escapeHTML(l.email)}">${escapeHTML(l.email)}</a></td>
        <td>${escapeHTML(l.phone)}</td>
        <td>${escapeHTML(l.qty)}</td>
        <td>${escapeHTML(l.source)}</td>
        <td><button class="btn btn--danger" data-action="del-lead" data-id="${escapeHTML(l.id)}">Excluir</button></td>
      </tr>
    `).join('');
    els.leadsTable.innerHTML = rows;
  }

  els.leadsTable.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="del-lead"]');
    if (!btn) return;
    if (!confirm('Excluir este lead?')) return;
    const id = btn.dataset.id;
    try {
      await api(`/api/leads?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      toast('Lead removido.');
      await loadLeads();
    } catch {
      toast('Erro ao excluir', true);
    }
  });

  els.leadsRefresh.addEventListener('click', loadLeads);

  els.leadsExport.addEventListener('click', () => {
    if (!leadsCache.length) { toast('Sem leads pra exportar', true); return; }
    const headers = ['data', 'nome', 'empresa', 'email', 'telefone', 'quantidade', 'marcas', 'mensagem', 'origem'];
    const rows = leadsCache.map(l => [
      new Date(l.ts).toISOString(), l.name, l.company, l.email, l.phone, l.qty, l.brands || '', l.help || '', l.source
    ]);
    const csv = [headers, ...rows].map(r =>
      r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unitech-leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- USERS ----------
  async function loadUsers() {
    try {
      const { users } = await api('/api/users');
      renderUsers(users);
    } catch (e) {
      console.warn('loadUsers failed:', e.message);
    }
  }

  function renderUsers(users) {
    els.usersList.innerHTML = users.map(u => {
      const isMe = me && u.username === me.username;
      return `
        <li>
          <strong>${escapeHTML(u.username)}</strong>
          <span class="tag">${escapeHTML(u.role || 'admin')}</span>
          ${isMe ? '<span class="you">(você)</span>' : ''}
          ${!isMe ? `<button class="btn btn--danger right" data-action="del-user" data-u="${escapeHTML(u.username)}">Remover</button>` : ''}
        </li>
      `;
    }).join('');
  }

  els.usersList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="del-user"]');
    if (!btn) return;
    const u = btn.dataset.u;
    if (!confirm(`Remover o usuário "${u}"?`)) return;
    try {
      await api(`/api/users?username=${encodeURIComponent(u)}`, { method: 'DELETE' });
      toast('Usuário removido.');
      await loadUsers();
    } catch (err) {
      toast(err.payload?.error === 'need_at_least_one_admin'
        ? 'Não dá pra remover o último admin.'
        : 'Erro ao remover', true);
    }
  });

  els.userAddBtn.addEventListener('click', () => {
    els.userAddForm.hidden = false;
    els.userAddForm.querySelector('input[name="username"]').focus();
  });
  els.userAddCancel.addEventListener('click', () => {
    els.userAddForm.hidden = true;
    els.userAddForm.reset();
  });

  els.userAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(els.userAddForm);
    try {
      await api('/api/users', {
        method: 'POST',
        body: { username: fd.get('username'), password: fd.get('password'), role: 'admin' }
      });
      toast('Usuário criado.');
      els.userAddForm.reset();
      els.userAddForm.hidden = true;
      await loadUsers();
    } catch (err) {
      const msg = err.payload?.error === 'user_exists' ? 'Usuário já existe.' :
                  err.payload?.error === 'invalid_input' ? 'Dados inválidos (usuário 3-40 chars, senha 8+).' :
                  'Erro ao criar usuário';
      toast(msg, true);
    }
  });

  els.myPwdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(els.myPwdForm);
    try {
      await api('/api/users', { method: 'PATCH', body: { password: fd.get('password') } });
      toast('Senha atualizada.');
      els.myPwdForm.reset();
    } catch {
      toast('Erro ao atualizar senha', true);
    }
  });

  // ---------- INIT ----------
  checkSession();

})();
