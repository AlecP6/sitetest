/* ===================================================================
   Cart — Gestion du panier (local + backend)
   =================================================================== */

const Cart = {
  SESSION_KEY: 'elegance_session',
  LOCAL_KEY: 'elegance_cart',

  getSessionId() {
    let id = localStorage.getItem(this.SESSION_KEY);
    if (!id) {
      id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(this.SESSION_KEY, id);
    }
    return id;
  },

  // Panier local (pour invités sans backend)
  getLocal() {
    try { return JSON.parse(localStorage.getItem(this.LOCAL_KEY) || '[]'); }
    catch { return []; }
  },
  setLocal(items) {
    localStorage.setItem(this.LOCAL_KEY, JSON.stringify(items));
    this.updateCartBadge();
  },

  getLocalCount() {
    return this.getLocal().reduce((s, i) => s + i.quantity, 0);
  },

  getLocalTotal() {
    return this.getLocal().reduce((s, i) => s + i.unit_price * i.quantity, 0);
  },

  addLocal(product, quantity, size, color) {
    const items = this.getLocal();
    const idx = items.findIndex(i => i.product_id === product.id && i.size === size && i.color === color);
    if (idx >= 0) {
      items[idx].quantity += quantity;
    } else {
      items.push({
        id: Date.now(),
        product_id: product.id,
        name: product.name,
        subtitle: product.subtitle,
        unit_price: product.price,
        original_price: product.original_price,
        quantity,
        size,
        color,
      });
    }
    this.setLocal(items);
  },

  removeLocal(id) {
    const items = this.getLocal().filter(i => i.id !== id);
    this.setLocal(items);
  },

  updateLocalQty(id, quantity) {
    const items = this.getLocal().map(i => i.id === id ? { ...i, quantity } : i);
    this.setLocal(items);
  },

  clearLocal() {
    this.setLocal([]);
  },

  // Mise à jour du badge panier dans le header
  updateCartBadge() {
    const count = this.getLocalCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  // Formater prix
  formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  },
};
