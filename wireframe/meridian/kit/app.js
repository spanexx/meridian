/* MERIDIAN wireframe kit — theme, shell, shared behaviors */

/* 1. Tailwind remap — semantic tokens so light/dark both work */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        slate: {
          50: 'var(--c-50)', 100: 'var(--c-100)', 200: 'var(--c-200)', 300: 'var(--c-300)',
          400: 'var(--c-400)', 500: 'var(--c-500)', 600: 'var(--c-600)', 700: 'var(--c-700)',
          800: 'var(--c-800)', 900: 'var(--c-900)', 950: 'var(--c-950)',
        },
        emerald: { 300: 'var(--e-300)', 400: 'var(--e-400)', 500: 'var(--e-500)' },
        violet:  { 300: 'var(--v-300)', 400: 'var(--v-400)', 500: 'var(--v-500)' },
        amber:   { 300: 'var(--a-300)', 400: 'var(--a-400)', 500: 'var(--a-500)' },
        rose:    { 300: 'var(--r-300)', 400: 'var(--r-400)', 500: 'var(--r-500)' },
        blue:    { 300: 'var(--b-300)', 400: 'var(--b-400)', 500: 'var(--b-500)' },
      },
    },
  },
};

/* 2. Shell config — pages set window.MERIDIAN_SHELL = { active: 'dashboard' }.
   `base` is the relative prefix back to the wireframe root; defaults to '../'
   for normal top-level pages (e.g. /opportunities/index.html) and must be
   set to '../../' (etc.) on nested pages like /community-detail/settings/. */
const ACTIVE = (window.MERIDIAN_SHELL && window.MERIDIAN_SHELL.active) || '';
const BASE = (window.MERIDIAN_SHELL && window.MERIDIAN_SHELL.base) || '../';
const NAV = [
  { s: 'Platform' },
  { id: 'dashboard', l: 'Dashboard', i: 'layout-dashboard' },
  { id: 'opportunities', l: 'Opportunities', i: 'lightbulb' },
  { id: 'executions', l: 'Executions', i: 'zap' },
  { id: 'pool', l: 'Capital Pool', i: 'banknote' },
  { s: 'Community' },
  { id: 'communities', l: 'Communities', i: 'users' },
  { id: 'members', l: 'Members', i: 'user' },
  { id: 'governance', l: 'Governance', i: 'vote' },
  { id: 'payouts', l: 'Payouts', i: 'circle-dollar-sign' },
  { s: 'Account' },
  { id: 'notifications', l: 'Notifications', i: 'bell' },
  { id: 'settings', l: 'Settings', i: 'settings' },
  { id: 'profile', l: 'Your Profile', i: 'user' },
];
const NOTIFS = [
  { i: 'vote', t: 'O-2051 needs 1 more vote', time: '2m', href: 'opportunity-detail/index.html' },
  { i: 'package', t: 'E-1042 · Size 10.5 sold on GOAT', time: '1h', href: 'execution-detail/index.html' },
  { i: 'banknote', t: 'Reserve ratio at 18.2% — healthy', time: '3h', href: 'pool/index.html' },
  { i: 'circle-dollar-sign', t: 'Payout preview updated · E-1039', time: '5h', href: 'payouts/index.html' },
];
const USER = { initials: 'AC', name: 'Alex Chen', role: 'Vetter · T3' };

/* 3. Theme */
const THEME_KEY = 'meridian-theme';
const theme = () => localStorage.getItem(THEME_KEY) || 'dark';
function setTheme(t, save) {
  document.documentElement.dataset.theme = t;
  if (save) localStorage.setItem(THEME_KEY, t);
  document.querySelectorAll('[data-theme-toggle]').forEach(b => {
    b.innerHTML = t === 'dark' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
  });
  document.querySelectorAll('[data-theme-choice]').forEach(b => {
    const on = b.dataset.themeChoice === t;
    b.setAttribute('aria-pressed', String(on));
    const check = b.querySelector('[data-choice-check]');
    if (check) check.style.opacity = on ? '1' : '0';
  });
  lucide.createIcons();
}

/* 4. Toast */
let toastBox = null;
function toast(msg, type = 'info') {
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'toast-box';
    document.body.appendChild(toastBox);
  }
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  const icon = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-circle' : 'info';
  el.innerHTML = '<i data-lucide="' + icon + '" class="w-4 h-4 flex-shrink-0"></i><span>' + msg + '</span>';
  toastBox.appendChild(el);
  lucide.createIcons();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}
window.toast = toast;

/* 5. Menus (dropdowns) */
const openMenus = new Set();
let activeMenuAnchor = null; // { btn, menu } for reposition-on-resize/scroll
function closeMenus() { 
  openMenus.forEach(m => { 
    m.style.animation = 'menuOut 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => { m.hidden = true; m.style.animation = ''; }, 150);
  }); 
  openMenus.clear(); 
  activeMenuAnchor = null; 
}
function positionMenu(btn, menu) {
  const r = btn.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 8;
  // Measure with the menu already visible so real (clamped) width/height are used.
  const menuW = Math.min(menu.offsetWidth || 260, vw - pad * 2);
  const menuH = Math.min(menu.offsetHeight || 200, vh - pad * 2);
  // Position the menu: try to anchor so the menu's right edge sits near the
  // button's right edge, but always stay fully within the viewport.
  let left = r.right - menuW;
  left = Math.max(pad, Math.min(left, vw - menuW - pad));
  // If there's no room below, open above; if no room above either, clamp to top.
  let top = r.bottom + pad;
  if (top + menuH > vh - pad) top = r.top - menuH - pad;
  top = Math.max(pad, Math.min(top, vh - menuH - pad));
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}
function toggleMenu(btn, id) {
  const menu = document.getElementById(id);
  if (!menu) return;
  if (!menu.hidden) { menu.hidden = true; openMenus.delete(menu); activeMenuAnchor = null; return; }
  closeMenus();
  menu.hidden = false;
  openMenus.add(menu);
  activeMenuAnchor = { btn, menu };
  positionMenu(btn, menu);
}
// Keep the open menu correctly placed if the viewport changes (resize, mobile
// keyboard, orientation change) instead of letting it drift off-screen.
window.addEventListener('resize', () => {
  if (activeMenuAnchor) positionMenu(activeMenuAnchor.btn, activeMenuAnchor.menu);
});

/* 6. Modals */
function closeModals() { document.querySelectorAll('.modal-overlay:not([hidden])').forEach(m => { m.hidden = true; }); }

/* 7. Tabs */
function initTabs(group) {
  group.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('[data-tab]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      if (group.dataset.panelGroup) {
        // Panels are marked with the same data-panel-group value directly on
        // themselves (not nested inside the tab strip), so this must be a
        // compound attribute selector, not a descendant combinator — a
        // space here silently matches nothing and every tab click becomes
        // a dead click that only re-styles the tab strip.
        document.querySelectorAll('[data-panel-group="' + group.dataset.panelGroup + '"][data-panel]').forEach(p => {
          p.hidden = p.dataset.panel !== btn.dataset.tab;
        });
      }
    });
  });
}

/* 8. Lists: filter tabs + category dropdown + live search + pagination + skeleton + empty */
function initList(scope) {
  // Tabs, search, category-dropdown may live outside the [data-list] scope.
  // Walk up to the nearest section/main/body so we can still find them.
  const host = scope.closest('section, main, body') || document;
  const skeleton = scope.querySelector('[data-skeleton]');
  const body = scope.querySelector('[data-list-body]');
  const rows = Array.from(scope.querySelectorAll('[data-filterable]'));
  const empty = scope.querySelector('[data-empty]');
  const searchInput = host.querySelector('[data-search]');
  const tabBtns = Array.from(host.querySelectorAll('[data-filter-tab]'));
  const catBtns = Array.from(host.querySelectorAll('[data-filter-category]'));
  const pageInfo = scope.querySelector('[data-page-num]');
  const prevBtn = scope.querySelector('[data-page-prev]');
  const nextBtn = scope.querySelector('[data-page-next]');
  const pageSize = parseInt(scope.dataset.pageSize || '8', 10);

  const state = { tab: 'all', category: 'all', q: '', page: 1 };

  if (skeleton && body) {
    setTimeout(() => {
      skeleton.hidden = true;
      body.hidden = false;
      render();
    }, 550);
  } else if (body) {
    body.hidden = false;
  }

  scope.addEventListener('list:refresh', render);

  function visible() {
    return rows.filter(r => {
      if (state.tab !== 'all' && r.dataset.status !== state.tab) return false;
      if (state.category !== 'all' && r.dataset.category !== state.category) return false;
      if (state.q && !r.textContent.toLowerCase().includes(state.q)) return false;
      return true;
    });
  }
  function render() {
    if (skeleton && !skeleton.hidden) return;
    const list = visible();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    if (state.page > pages) state.page = pages;
    const slice = list.slice((state.page - 1) * pageSize, state.page * pageSize);
    rows.forEach(r => { r.hidden = true; });
    slice.forEach(r => { r.hidden = false; });
    if (empty) empty.hidden = list.length > 0;
    if (pageInfo) pageInfo.textContent = state.page + ' / ' + pages;
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= pages;
  }

  tabBtns.forEach(b => b.addEventListener('click', () => {
    tabBtns.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
    b.classList.add('active');
    b.setAttribute('aria-selected', 'true');
    state.tab = b.dataset.filterTab;
    state.page = 1;
    render();
  }));
  catBtns.forEach(b => b.addEventListener('click', () => {
    catBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.category = b.dataset.filterCategory;
    state.page = 1;
    render();
    closeMenus();
  }));
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.q = searchInput.value.trim().toLowerCase();
      state.page = 1;
      render();
    });
  }
  if (prevBtn) prevBtn.addEventListener('click', () => { if (state.page > 1) { state.page--; render(); } });
  if (nextBtn) nextBtn.addEventListener('click', () => { state.page++; render(); });
}

/* 9. Chart tabs */
function initCharts(group) {
  group.querySelectorAll('[data-chart]').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('[data-chart]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('[data-chart-set]').forEach(g => {
        g.hidden = g.dataset.chartSet !== btn.dataset.chart;
      });
      closeMenus();
    });
  });
}

/* 10. Stepper */
function initStepper(stepper) {
  const steps = Array.from(stepper.querySelectorAll('[data-step]'));
  const panels = document.querySelectorAll('[data-step-panels] [data-step-panel]');
  const nextBtns = document.querySelectorAll('[data-step-next]');
  const prevBtns = document.querySelectorAll('[data-step-prev]');
  const finalLabel = stepper.dataset.finalLabel || 'Submit';
  let current = 0;

  function goTo(i) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, idx) => {
      s.classList.toggle('active', idx === current);
      s.classList.toggle('done', idx < current);
    });
    panels.forEach((p, idx) => { p.hidden = idx !== current; });
    prevBtns.forEach(b => { b.disabled = current === 0; });
    nextBtns.forEach(b => {
      b.innerHTML = current === steps.length - 1
        ? '<i data-lucide="check" class="w-4 h-4"></i> ' + finalLabel
        : 'Next <i data-lucide="chevron-right" class="w-4 h-4"></i>';
    });
    lucide.createIcons();
  }
  steps.forEach((s, idx) => s.addEventListener('click', () => goTo(idx)));
  nextBtns.forEach(b => b.addEventListener('click', () => {
    if (current === steps.length - 1) {
      if (stepper.dataset.onComplete) {
        window[stepper.dataset.onComplete]();
      }
    } else {
      goTo(current + 1);
    }
  }));
  prevBtns.forEach(b => b.addEventListener('click', () => goTo(current - 1)));
  goTo(0);
}

/* 11. Votes */
function initVotes() {
  document.querySelectorAll('[data-vote]').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('[data-vote-group]');
      if (!group) return;
      group.querySelectorAll('[data-vote]').forEach(b => b.classList.remove('active', 'approve', 'reject'));
      btn.classList.add('active', btn.dataset.voteType);
      const scope = group.closest('[data-tally-scope]') || document;
      const aEl = scope.querySelector('[data-count-approve]');
      const rEl = scope.querySelector('[data-count-reject]');
      const bar = scope.querySelector('[data-vote-bar]');
      if (btn.dataset.voteType === 'approve' && aEl) aEl.textContent = parseInt(aEl.textContent, 10) + 1;
      if (btn.dataset.voteType === 'reject' && rEl) rEl.textContent = parseInt(rEl.textContent, 10) + 1;
      if (bar && aEl && rEl) {
        const a = parseInt(aEl.textContent, 10), r = parseInt(rEl.textContent, 10);
        bar.style.width = Math.round((a / (a + r)) * 100) + '%';
      }
      toast(btn.dataset.voteType === 'approve' ? 'Vote recorded — approve' : 'Vote recorded — reject', 'success');
    });
  });
}

/* 12. Switches, theme choice, copy, accordion, comments, upload, mark-read, signout, auth */
function initSwitches() {
  document.querySelectorAll('[data-toggle]').forEach(t => {
    t.addEventListener('click', () => {
      const on = t.getAttribute('aria-checked') === 'true';
      t.setAttribute('aria-checked', String(!on));
      toast(on ? 'Turned off' : 'Turned on', 'info');
    });
  });
}
function initThemeChoice() {
  document.querySelectorAll('[data-theme-choice]').forEach(b => {
    b.addEventListener('click', () => {
      setTheme(b.dataset.themeChoice, true);
      toast('Theme set to ' + (b.dataset.themeChoice === 'dark' ? 'dark' : 'light'), 'success');
    });
  });
  document.querySelectorAll('[data-theme-toggle]').forEach(b => {
    b.addEventListener('click', () => {
      setTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'dark' : 'light', true);
    });
  });
}
function initCopy() {
  document.querySelectorAll('[data-copy]').forEach(b => {
    b.addEventListener('click', () => {
      const v = b.dataset.copy || location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(v).then(() => toast('Copied to clipboard', 'success'));
      } else {
        toast('Copy not supported in this browser', 'error');
      }
    });
  });
}
function initAccordions() {
  document.querySelectorAll('[data-accordion]').forEach(acc => {
    acc.querySelectorAll('[data-accordion-toggle]').forEach(t => {
      t.addEventListener('click', () => {
        const item = t.closest('[data-accordion-item]');
        const wasOpen = !item.querySelector('[data-accordion-panel]').hidden;
        acc.querySelectorAll('[data-accordion-item]').forEach(it => {
          it.querySelector('[data-accordion-panel]').hidden = true;
          it.querySelector('[data-accordion-chevron]').classList.remove('open');
        });
        if (!wasOpen) {
          item.querySelector('[data-accordion-panel]').hidden = false;
          item.querySelector('[data-accordion-chevron]').classList.add('open');
        }
      });
    });
  });
}
function initComments() {
  document.querySelectorAll('[data-comment-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('[data-comment-input]');
      const text = input.value.trim();
      if (!text) return;
      const list = form.closest('[data-comments]').querySelector('[data-comment-list]');
      const item = document.createElement('div');
      item.className = 'flex items-start gap-3 p-3 rounded-lg';
      item.style.background = 'var(--bg-overlay)';
      item.innerHTML = '<div class="avatar" style="background:var(--gradient-violet);">AC</div>' +
        '<div class="flex-1"><div class="text-sm"><span class="font-medium">Alex Chen</span> <span class="text-xs text-slate-500">· Vetter T3 · Just now</span></div>' +
        '<div class="text-xs text-slate-500 mt-0.5">' + text.replace(/</g, '&lt;') + '</div></div>';
      list.prepend(item);
      const empty = form.closest('[data-comments]').querySelector('[data-comments-empty]');
      if (empty) empty.hidden = true;
      input.value = '';
      toast('Comment posted', 'success');
    });
  });
}
function initUpload() {
  document.querySelectorAll('[data-upload-zone]').forEach(zone => {
    const input = document.getElementById(zone.dataset.uploadInput);
    const name = document.getElementById(zone.dataset.uploadName);
    if (!input) return;
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag');
      if (input.files && e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        if (name) name.textContent = e.dataTransfer.files[0].name;
        toast('Image attached: ' + e.dataTransfer.files[0].name, 'success');
      }
    });
    input.addEventListener('change', () => {
      if (name && input.files.length) {
        name.textContent = input.files[0].name;
        toast('Image attached: ' + input.files[0].name, 'success');
      }
    });
  });
}
function initMarkRead() {
  document.querySelectorAll('[data-mark-read]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-notif-item]').forEach(it => {
        it.dataset.read = 'true';
        it.dataset.status = 'read';
        const dot = it.querySelector('[data-unread-dot]');
        if (dot) dot.remove();
        const badge = it.querySelector('[data-unread-badge]');
        if (badge) badge.textContent = 'Read';
      });
      document.querySelectorAll('[data-list]').forEach(scope => scope.dispatchEvent(new Event('list:refresh')));
      const count = document.querySelector('[data-unread-count]');
      if (count) count.textContent = '0';
      toast('All notifications marked as read', 'success');
    });
  });
}
function initSignout() {
  document.querySelectorAll('[data-signout]').forEach(b => {
    b.addEventListener('click', () => {
      toast('Signing out…', 'info');
      setTimeout(() => { location.href = BASE + 'login/index.html'; }, 500);
    });
  });
}
function initAuthForms() {
  document.querySelectorAll('[data-auth-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const target = form.dataset.redirect || '../dashboard/index.html';
      toast(form.dataset.success || 'Welcome back', 'success');
      setTimeout(() => { location.href = target; }, 700);
    });
  });
}

/* 13. Shell */
function mountShell() {
  const host = document.getElementById('app-shell');
  if (!host) return;
  const nav = NAV.map(it => it.s
    ? '<div class="nav-section">' + it.s + '</div>'
    : '<a href="' + BASE + it.id + '/index.html" class="nav-item' + (it.id === ACTIVE ? ' active' : '') + '"><i data-lucide="' + it.i + '" class="nav-icon"></i>' + it.l + '</a>'
  ).join('');
  const notifs = NOTIFS.map(n =>
    '<a href="' + BASE + n.href + '" class="menu-item"><i data-lucide="' + n.i + '" class="w-4 h-4 text-slate-500"></i>' +
    '<span class="flex-1 min-w-0"><span class="block text-sm truncate">' + n.t + '</span><span class="block text-[11px] text-slate-500">' + n.time + '</span></span></a>'
  ).join('');
  host.innerHTML =
    '<div class="mobile-bar">' +
      '<button class="icon-btn" data-sidebar-toggle aria-label="Open menu"><i data-lucide="menu" class="w-5 h-5"></i></button>' +
      '<a href="' + BASE + 'index.html" class="flex items-center gap-2"><div class="w-7 h-7 rounded-md flex items-center justify-center" style="background: var(--gradient-violet);"><i data-lucide="diamond" class="w-3.5 h-3.5 text-white"></i></div><span class="text-sm font-semibold tracking-tight">MERIDIAN</span></a>' +
      '<button class="icon-btn" data-theme-toggle aria-label="Toggle theme"><i data-lucide="moon" class="w-4 h-4"></i></button>' +
    '</div>' +
    '<div class="sidebar-backdrop" hidden data-sidebar-backdrop></div>' +
    '<aside class="sidebar">' +
      '<a href="' + BASE + 'index.html" class="flex items-center gap-2.5 mb-2 px-2">' +
        '<div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--gradient-violet);"><i data-lucide="diamond" class="w-4 h-4 text-white"></i></div>' +
        '<div><div class="text-sm font-semibold tracking-tight">MERIDIAN</div><div class="text-[10px] uppercase tracking-widest text-slate-500">Collective Arbitrage</div></div>' +
      '</a>' +
      nav +
      '<div class="nav-section">Quick Actions</div>' +
      '<a href="' + BASE + 'submit-signal/index.html" class="nav-item"><i data-lucide="plus-circle" class="nav-icon"></i>Submit Signal</a>' +
      '<div class="mt-auto pt-4 border-t" style="border-color: var(--border-subtle);">' +
        '<div class="flex items-center justify-around px-2 py-1.5">' +
          '<button class="icon-btn" data-dropdown="notifMenu" title="Notifications"><i data-lucide="bell" class="w-4 h-4"></i></button>' +
          '<button class="icon-btn" data-theme-toggle title="Toggle theme"><i data-lucide="moon" class="w-4 h-4"></i></button>' +
          '<button class="icon-btn" data-dropdown="avatarMenu" title="Account"><i data-lucide="user" class="w-4 h-4"></i></button>' +
        '</div>' +
        '<a href="' + BASE + 'profile/index.html" class="nav-item mt-1">' +
          '<div class="avatar" style="background: var(--gradient-violet);">' + USER.initials + '</div>' +
          '<div class="flex-1 min-w-0"><div class="text-sm text-slate-100 truncate">' + USER.name + '</div><div class="text-[10px] uppercase tracking-wider text-violet-300">' + USER.role + '</div></div>' +
        '</a>' +
      '</div>' +
    '</aside>' +
    '<div class="menu" id="notifMenu" hidden>' +
      '<div class="menu-head">Notifications</div>' +
      notifs +
      '<a href="' + BASE + 'notifications/index.html" class="menu-item menu-foot">View all notifications</a>' +
    '</div>' +
    '<div class="menu" id="avatarMenu" hidden>' +
      '<div class="menu-head">' + USER.name + ' · ' + USER.role + '</div>' +
      '<a href="' + BASE + 'profile/index.html" class="menu-item"><i data-lucide="user" class="w-4 h-4"></i>Your Profile</a>' +
      '<a href="' + BASE + 'settings/index.html" class="menu-item"><i data-lucide="settings" class="w-4 h-4"></i>Settings</a>' +
      '<div class="menu-sep"></div>' +
      '<button class="menu-item menu-danger" data-signout><i data-lucide="log-out" class="w-4 h-4"></i>Sign out</button>' +
    '</div>';
}

/* 13b. Mobile sidebar drawer */
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('[data-sidebar-backdrop]');
  const toggleBtn = document.querySelector('[data-sidebar-toggle]');
  if (!sidebar) return;
  const close = () => {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.hidden = true;
  };
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      if (backdrop) backdrop.hidden = !open;
    });
  }
  if (backdrop) backdrop.addEventListener('click', close);
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // Reset drawer state on resize past the desktop breakpoint.
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      if (window.innerWidth >= 1280) close();
    });
  });
}

/* 14. Global clicks */
document.addEventListener('click', e => {
  const d = e.target.closest('[data-dropdown]');
  if (d) { e.stopPropagation(); toggleMenu(d, d.dataset.dropdown); return; }
  const o = e.target.closest('[data-modal-open]');
  if (o) { const m = document.getElementById(o.dataset.modalOpen); if (m) m.hidden = false; return; }
  const c = e.target.closest('[data-modal-close]');
  if (c) { c.closest('.modal-overlay').hidden = true; return; }
  const ov = e.target.closest('.modal-overlay');
  if (ov && e.target === ov) ov.hidden = true;
  if (!e.target.closest('.menu')) closeMenus();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMenus(); closeModals(); }
});

/* 15. Boot */
document.addEventListener('DOMContentLoaded', () => {
  setTheme(theme(), false);
  mountShell();
  initSidebar();
  document.querySelectorAll('[data-tabs]').forEach(initTabs);
  document.querySelectorAll('[data-list]').forEach(initList);
  document.querySelectorAll('[data-chart-tabs]').forEach(initCharts);
  document.querySelectorAll('[data-stepper]').forEach(initStepper);
  initVotes();
  initSwitches();
  initThemeChoice();
  initCopy();
  initAccordions();
  initComments();
  initUpload();
  initMarkRead();
  initSignout();
  initAuthForms();
  lucide.createIcons();
});
