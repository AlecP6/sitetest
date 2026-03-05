/* ═══════════════════════════════════════════════════════════
   ÉLÉGANCE — Admin shared utilities
   ═══════════════════════════════════════════════════════════ */

const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api';

// ── Auth ─────────────────────────────────────────────────────────────────────
// Partage les mêmes clés que le site principal (token / user)
function getToken() { return localStorage.getItem('token'); }

function checkAdminAuth() {
  const token = getToken();
  if (!token) { window.location.href = '../login.html'; return null; }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'admin' || payload.exp < Date.now() / 1000) {
      adminLogout(); return null;
    }
    return payload;
  } catch {
    adminLogout(); return null;
  }
}

function adminLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../login.html';
}

// ── API fetch (avec timeout 15s) ─────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${API}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error(`Réponse invalide du serveur (${res.status}): ${text.slice(0, 100)}`); }
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Délai dépassé — le serveur ne répond pas');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Formatters ───────────────────────────────────────────────────────────────
function fmtEur(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Status map ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
  en_attente:     { label: 'En attente',     cls: 'badge-pending'    },
  confirme:       { label: 'Confirmé',        cls: 'badge-confirmed'  },
  en_preparation: { label: 'En préparation', cls: 'badge-processing' },
  expedie:        { label: 'Expédié',         cls: 'badge-shipped'    },
  livre:          { label: 'Livré',           cls: 'badge-delivered'  },
  annule:         { label: 'Annulé',          cls: 'badge-cancelled'  },
};
function statusBadge(s) {
  const m = STATUS_MAP[s] || { label: s, cls: 'badge-pending' };
  return `<span class="badge ${m.cls}">${m.label}</span>`;
}

// ── Toast ────────────────────────────────────────────────────────────────────
let _toastBox;
function toast(msg, type = 'default') {
  if (!_toastBox) {
    _toastBox = Object.assign(document.createElement('div'), { className: 'toast-container' });
    document.body.appendChild(_toastBox);
  }
  const el = Object.assign(document.createElement('div'), {
    className: `toast${type !== 'default' ? ' toast-' + type : ''}`,
    textContent: msg,
  });
  _toastBox.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ── Sidebar ──────────────────────────────────────────────────────────────────
function renderSidebar(active) {
  const nav = [
    { id: 'dashboard', href: 'dashboard.html', icon: '▤', label: 'Tableau de bord' },
    { id: 'products',  href: 'products.html',  icon: '◻', label: 'Produits'        },
    { id: 'orders',    href: 'orders.html',    icon: '◈', label: 'Commandes'       },
    { id: 'stock',     href: 'stock.html',     icon: '◫', label: 'Stocks'          },
  ];
  const u = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = ((u.first_name || 'A')[0] + (u.last_name || 'D')[0]).toUpperCase();

  document.getElementById('admin-sidebar').innerHTML = `
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <span>ÉLÉGANCE</span>
        <small>Administration</small>
      </div>
      <nav class="sidebar-nav">
        ${nav.map(n => `
          <a href="${n.href}" class="sidebar-link ${active === n.id ? 'active' : ''}">
            <span class="sidebar-icon">${n.icon}</span>
            <span>${n.label}</span>
          </a>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <a href="../index.html" class="sidebar-link" target="_blank">
          <span class="sidebar-icon">↗</span><span>Voir le site</span>
        </a>
        <button class="sidebar-link" onclick="adminLogout()">
          <span class="sidebar-icon">⏻</span><span>Déconnexion</span>
        </button>
      </div>
    </aside>`;

  const av = document.getElementById('topbar-avatar');
  const nm = document.getElementById('topbar-name');
  if (av) av.textContent = initials;
  if (nm) nm.textContent = `${u.first_name || ''} ${u.last_name || ''}`.trim();
}
