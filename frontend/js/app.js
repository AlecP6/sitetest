/* ===================================================================
   App — Composants partagés (header, footer, toasts, utilitaires)
   =================================================================== */

// ─── Toast Notifications ────────────────────────────────────────────
const Toast = {
  show(message, type = 'default', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success'
      ? `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`
      : type === 'error'
      ? `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
      : `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration + 300);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
};

// ─── Loading ────────────────────────────────────────────────────────
const Loading = {
  show() {
    let el = document.querySelector('.loading-overlay');
    if (!el) {
      el = document.createElement('div');
      el.className = 'loading-overlay';
      el.innerHTML = '<div class="loader"></div>';
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
  },
  hide() {
    const el = document.querySelector('.loading-overlay');
    if (el) el.style.display = 'none';
  },
};

// ─── Header ────────────────────────────────────────────────────────
function renderHeader() {
  const user = Auth.getUser();
  const cartCount = Cart.getLocalCount();

  const html = `
    <header class="site-header" id="site-header">
      <div class="header-promo">
        Livraison offerte dès 100€ d'achat — <a href="category.html?category=nouveautes">Découvrir les nouveautés</a>
      </div>
      <div class="header-main">
        <div class="header-left">
          <button class="icon-btn" id="menu-toggle" aria-label="Menu">
            <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button class="icon-btn" id="search-toggle" aria-label="Rechercher">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
        <div class="header-logo">
          <a href="index.html">ÉLÉGANCE</a>
        </div>
        <div class="header-right">
          <a href="${user ? 'account.html' : 'login.html'}" class="icon-btn" aria-label="Mon compte">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </a>
          <a href="cart.html" class="icon-btn" aria-label="Panier" style="position:relative">
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span class="cart-count" style="display:${cartCount > 0 ? 'flex' : 'none'}">${cartCount}</span>
          </a>
          ${user && user.role === 'admin' ? `<a href="admin/dashboard.html" class="icon-btn" title="Panel Admin" style="font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;padding:0.4rem 0.6rem;background:var(--color-green);color:white;border-radius:2px">Admin</a>` : ''}
          ${user ? `<button class="icon-btn" onclick="Auth.logout()" title="Se déconnecter" style="font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;opacity:0.6">Sortir</button>` : ''}
        </div>
      </div>
      <nav class="header-nav">
        <ul>
          <li><a href="category.html?category=nouveautes">Nouveautés</a></li>
          <li><a href="category.html?category=vetements">Vêtements</a></li>
          <li><a href="category.html?category=robes">Robes</a></li>
          <li><a href="category.html?category=manteaux">Manteaux & Vestes</a></li>
          <li><a href="category.html?category=accessoires">Accessoires</a></li>
          <li><a href="category.html?is_sale=1" class="sale-link">Soldes</a></li>
        </ul>
      </nav>
      <div class="search-bar" id="search-bar">
        <form onsubmit="handleSearch(event)">
          <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5;flex-shrink:0"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="search-input" placeholder="Rechercher un produit..." autocomplete="off">
          <button type="submit">
            <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </form>
      </div>
    </header>

    <!-- Menu mobile overlay -->
    <div class="mobile-menu-overlay" id="menu-overlay"></div>
    <nav class="mobile-menu" id="mobile-menu">
      <div class="mobile-menu-header">
        <span class="mobile-menu-logo">ÉLÉGANCE</span>
        <button class="icon-btn" id="menu-close">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <ul>
        <li><a href="category.html?category=nouveautes">Nouveautés</a></li>
        <li><a href="category.html?category=vetements">Vêtements</a></li>
        <li><a href="category.html?category=robes">Robes</a></li>
        <li><a href="category.html?category=manteaux">Manteaux & Vestes</a></li>
        <li><a href="category.html?category=accessoires">Accessoires</a></li>
        <li><a href="category.html?is_sale=1" class="sale-link">Soldes</a></li>
        <li><a href="${user ? 'account.html' : 'login.html'}">${user ? 'Mon Compte' : 'Connexion'}</a></li>
        <li><a href="cart.html">Panier (${cartCount})</a></li>
      </ul>
    </nav>
  `;

  const headerContainer = document.getElementById('header-container');
  if (headerContainer) headerContainer.innerHTML = html;
  else document.body.insertAdjacentHTML('afterbegin', html);

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentParams = new URLSearchParams(window.location.search);
  document.querySelectorAll('.header-nav a').forEach(a => {
    const url = new URL(a.href);
    if (url.pathname.endsWith(currentPage) &&
        (!url.search || url.search === window.location.search)) {
      a.classList.add('active');
    }
  });

  // Search toggle
  const searchToggle = document.getElementById('search-toggle');
  const searchBar = document.getElementById('search-bar');
  if (searchToggle) {
    searchToggle.addEventListener('click', () => {
      searchBar.classList.toggle('open');
      if (searchBar.classList.contains('open')) {
        setTimeout(() => document.getElementById('search-input')?.focus(), 100);
      }
    });
  }

  // Mobile menu
  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const menuOverlay = document.getElementById('menu-overlay');
  const mobileMenu = document.getElementById('mobile-menu');

  const openMenu = () => { mobileMenu?.classList.add('open'); menuOverlay?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeMenu = () => { mobileMenu?.classList.remove('open'); menuOverlay?.classList.remove('open'); document.body.style.overflow = ''; };

  menuToggle?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuOverlay?.addEventListener('click', closeMenu);
}

// ─── Footer ─────────────────────────────────────────────────────────
function renderFooter() {
  const html = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <h2>ÉLÉGANCE</h2>
            <p>La mode féminine au service de votre personnalité.<br>
            Des créations exclusives, fabriquées avec soin, pour sublimer chaque silhouette.</p>
            <div class="footer-newsletter">
              <p>Inscrivez-vous à notre newsletter</p>
              <form onsubmit="handleNewsletter(event)">
                <input type="email" placeholder="Votre adresse email" required>
                <button type="submit">OK</button>
              </form>
            </div>
          </div>
          <div class="footer-col">
            <h4>Aide & Contact</h4>
            <ul>
              <li><a href="orders.html">Suivi de commande</a></li>
              <li><a href="shipping.html">Livraison & Retours</a></li>
              <li><a href="size-guide.html">Guide des tailles</a></li>
              <li><a href="faq.html">FAQ</a></li>
              <li><a href="contact.html">Nous contacter</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>La Boutique</h4>
            <ul>
              <li><a href="category.html?category=nouveautes">Nouveautés</a></li>
              <li><a href="category.html?category=vetements">Vêtements</a></li>
              <li><a href="category.html?category=robes">Robes</a></li>
              <li><a href="category.html?category=manteaux">Manteaux & Vestes</a></li>
              <li><a href="category.html?category=accessoires">Accessoires</a></li>
              <li><a href="category.html?is_sale=1" style="color:#b94040">Soldes</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>À Propos</h4>
            <ul>
              <li><a href="about.html#histoire">Notre histoire</a></li>
              <li><a href="about.html#valeurs">Nos valeurs</a></li>
              <li><a href="about.html#rse">Engagements RSE</a></li>
              <li><a href="legal.html#mentions">Mentions légales</a></li>
              <li><a href="legal.html#confidentialite">Politique de confidentialité</a></li>
              <li><a href="legal.html#cgv">CGV</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} ÉLÉGANCE. Tous droits réservés.</p>
          <div class="footer-socials">
            <a href="https://www.instagram.com" target="_blank" rel="noopener">Instagram</a>
            <a href="https://www.facebook.com" target="_blank" rel="noopener">Facebook</a>
            <a href="https://www.pinterest.fr" target="_blank" rel="noopener">Pinterest</a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener">YouTube</a>
          </div>
          <p>Paiement sécurisé · Visa · Mastercard · PayPal</p>
        </div>
      </div>
    </footer>
  `;
  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) footerContainer.innerHTML = html;
  else document.body.insertAdjacentHTML('beforeend', html);
}

// ─── Recherche ───────────────────────────────────────────────────────
function handleSearch(e) {
  e.preventDefault();
  const q = document.getElementById('search-input')?.value.trim();
  if (q) window.location.href = `category.html?search=${encodeURIComponent(q)}`;
}

// ─── Newsletter ───────────────────────────────────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  Toast.success('Merci ! Vous êtes maintenant inscrit(e) à notre newsletter.');
  e.target.reset();
}

// ─── Utilitaires ─────────────────────────────────────────────────────
function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function createProductCard(product) {
  const hasDiscount = product.original_price && product.original_price > product.price;
  return `
    <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer">
      <div class="product-card-img">
        ${(product.images && product.images[0]) || product.image_url
          ? `<img src="${(product.images && product.images[0]) || product.image_url}" alt="${product.name}" class="product-img-real" loading="lazy">`
          : `<div class="product-img-bg"></div>`}
        <div class="product-card-badges">
          ${product.is_new ? '<span class="badge badge-new">Nouveau</span>' : ''}
          ${product.is_sale ? '<span class="badge badge-sale">Soldes</span>' : ''}
        </div>
        <div class="product-card-actions" onclick="event.stopPropagation()">
          <button class="product-card-wish" onclick="toggleWishlist(${product.id}, this)" title="Ajouter aux favoris">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="product-card-info">
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-subtitle">${product.subtitle || ''}</div>
        <div class="product-card-price">
          <span class="price ${hasDiscount ? 'price-sale' : ''}">${formatPrice(product.price)}</span>
          ${hasDiscount ? `<span class="price-original">${formatPrice(product.original_price)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

async function toggleWishlist(productId, btn) {
  if (!Auth.isLoggedIn()) {
    Toast.show('Connectez-vous pour sauvegarder vos favoris');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }
  try {
    await Api.auth.addToWishlist(productId);
    btn.style.background = '#000';
    btn.style.color = '#fff';
    Toast.success('Ajouté aux favoris');
  } catch {
    try {
      await Api.auth.removeFromWishlist(productId);
      btn.style.background = '';
      btn.style.color = '';
      Toast.show('Retiré des favoris');
    } catch {}
  }
}

// ─── Init global ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  Cart.updateCartBadge();
});
