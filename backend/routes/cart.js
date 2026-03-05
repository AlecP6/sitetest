const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { optionalAuth } = require('../middleware/auth');

function getId(req) {
  if (req.user) return { user_id: req.user.id, session_id: null };
  return { user_id: null, session_id: req.headers['x-session-id'] || 'guest' };
}

function findCartItems(id) {
  if (id.user_id) return db.cart_items.find({ user_id: id.user_id });
  return db.cart_items.find({ session_id: id.session_id });
}

// GET /api/cart
router.get('/', optionalAuth, (req, res) => {
  const items = findCartItems(getId(req)).map(ci => {
    const p = db.products.findById(ci.product_id);
    return p ? { ...ci, name: p.name, subtitle: p.subtitle, unit_price: p.price, original_price: p.original_price, stock: p.stock } : null;
  }).filter(Boolean);

  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  res.json({ items, total, count });
});

// POST /api/cart/add
router.post('/add', optionalAuth, (req, res) => {
  const { product_id, quantity = 1, size = '', color = '' } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id requis' });

  const product = db.products.findById(product_id);
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

  const id = getId(req);
  const existing = id.user_id
    ? db.cart_items.where(ci => ci.user_id === id.user_id && ci.product_id === Number(product_id) && ci.size === size && ci.color === color)[0]
    : db.cart_items.where(ci => ci.session_id === id.session_id && ci.product_id === Number(product_id) && ci.size === size && ci.color === color)[0];

  if (existing) {
    db.cart_items.update(existing.id, { quantity: existing.quantity + Number(quantity) });
  } else {
    db.cart_items.insert({ user_id: id.user_id, session_id: id.session_id, product_id: Number(product_id), quantity: Number(quantity), size, color });
  }
  res.json({ message: 'Produit ajouté au panier' });
});

// PUT /api/cart/:id
router.put('/:id', optionalAuth, (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantité invalide' });
  db.cart_items.update(req.params.id, { quantity: Number(quantity) });
  res.json({ message: 'Quantité mise à jour' });
});

// DELETE /api/cart/:id
router.delete('/:id', optionalAuth, (req, res) => {
  db.cart_items.delete(req.params.id);
  res.json({ message: 'Article retiré du panier' });
});

// DELETE /api/cart
router.delete('/', optionalAuth, (req, res) => {
  const id = getId(req);
  if (id.user_id) db.cart_items.deleteWhere({ user_id: id.user_id });
  else db.cart_items.deleteWhere({ session_id: id.session_id });
  res.json({ message: 'Panier vidé' });
});

// POST /api/cart/merge
router.post('/merge', optionalAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  const { session_id } = req.body;
  if (!session_id) return res.json({ message: 'Rien à fusionner' });

  const guestItems = db.cart_items.find({ session_id });
  for (const item of guestItems) {
    const existing = db.cart_items.where(ci => ci.user_id === req.user.id && ci.product_id === item.product_id && ci.size === item.size && ci.color === item.color)[0];
    if (existing) {
      db.cart_items.update(existing.id, { quantity: existing.quantity + item.quantity });
      db.cart_items.delete(item.id);
    } else {
      db.cart_items.update(item.id, { user_id: req.user.id, session_id: null });
    }
  }
  res.json({ message: 'Panier fusionné' });
});

module.exports = router;
