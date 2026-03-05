const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

function generateOrderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ELG-${y}${m}${day}-${rand}`;
}

// POST /api/orders
router.post('/', optionalAuth, (req, res) => {
  const { email, items, shipping_address, billing_address, payment_method, payment_last_four, notes, session_id } = req.body;
  if (!email || !items || !items.length) return res.status(400).json({ error: 'Email et articles requis' });

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = db.products.findById(item.product_id);
    if (!product) return res.status(404).json({ error: `Produit ${item.product_id} non trouvé` });
    subtotal += product.price * item.quantity;
    orderItems.push({
      product_id: product.id, product_name: product.name,
      product_price: product.price, quantity: item.quantity,
      size: item.size || '', color: item.color || '',
    });
  }

  const shipping_cost = subtotal >= 100 ? 0 : 5.90;
  const total = subtotal + shipping_cost;
  const order_number = generateOrderNumber();

  const order = db.orders.insert({
    user_id: req.user ? req.user.id : null,
    order_number, email, status: 'en_attente',
    subtotal, shipping_cost, total,
    shipping_address: JSON.stringify(shipping_address || {}),
    billing_address: JSON.stringify(billing_address || shipping_address || {}),
    payment_method: payment_method || 'card',
    payment_last_four: payment_last_four || '',
    notes: notes || '',
  });

  for (const item of orderItems) {
    db.order_items.insert({ order_id: order.id, ...item });
  }

  // Vider le panier
  if (req.user) db.cart_items.deleteWhere({ user_id: req.user.id });
  else if (session_id) db.cart_items.deleteWhere({ session_id });

  res.status(201).json({ order_id: order.id, order_number, total, subtotal, shipping_cost, message: 'Commande créée avec succès' });
});

// GET /api/orders
router.get('/', authMiddleware, (req, res) => {
  const orders = db.orders.find({ user_id: req.user.id })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(o => ({
      ...o,
      shipping_address: JSON.parse(o.shipping_address || '{}'),
      items: db.order_items.find({ order_id: o.id }),
    }));
  res.json(orders);
});

// GET /api/orders/:id
router.get('/:id', optionalAuth, (req, res) => {
  const order = db.orders.findById(req.params.id) || db.orders.findOne({ order_number: req.params.id });
  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

  if (req.user && order.user_id && order.user_id !== req.user.id)
    return res.status(403).json({ error: 'Accès refusé' });

  res.json({
    ...order,
    shipping_address: JSON.parse(order.shipping_address || '{}'),
    billing_address: JSON.parse(order.billing_address || '{}'),
    items: db.order_items.find({ order_id: order.id }),
  });
});

// POST /api/orders/payment/process — Simulation paiement
router.post('/payment/process', (req, res) => {
  const { card_number, expiry, cvv, amount } = req.body;
  if (!card_number || !expiry || !cvv)
    return res.status(400).json({ error: 'Informations de carte incomplètes' });

  if (card_number.replace(/\s/g, '').startsWith('4000'))
    return res.status(402).json({ error: 'Carte refusée. Veuillez utiliser un autre moyen de paiement.' });

  const last_four = card_number.replace(/\s/g, '').slice(-4);
  setTimeout(() => {
    res.json({ success: true, transaction_id: `TXN-${Date.now()}`, last_four, amount, message: 'Paiement accepté' });
  }, 800);
});

module.exports = router;
