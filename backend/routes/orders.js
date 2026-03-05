const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../database/db');
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
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { email, items, shipping_address, billing_address, payment_method, payment_last_four, notes, session_id } = req.body;
    if (!email || !items || !items.length) return res.status(400).json({ error: 'Email et articles requis' });

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await queryOne('SELECT * FROM products WHERE id=$1', [item.product_id]);
      if (!product) return res.status(404).json({ error: `Produit ${item.product_id} non trouvé` });
      subtotal += Number(product.price) * item.quantity;
      orderItems.push({ product_id: product.id, product_name: product.name, price: product.price, quantity: item.quantity, size: item.size || '', color: item.color || '' });
    }

    const shipping_cost = subtotal >= 100 ? 0 : 5.90;
    const total = subtotal + shipping_cost;
    const order_number = generateOrderNumber();

    const order = await queryOne(
      `INSERT INTO orders (user_id, order_number, email, status, subtotal, shipping_cost, total, shipping_address, billing_address, payment_method, payment_last_four, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user ? req.user.id : null, order_number, email, 'en_attente', subtotal, shipping_cost, total,
       JSON.stringify(shipping_address || {}), JSON.stringify(billing_address || shipping_address || {}),
       payment_method || 'card', payment_last_four || '', notes || '']
    );

    for (const item of orderItems) {
      await query(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity, size, color) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [order.id, item.product_id, item.product_name, item.price, item.quantity, item.size, item.color]
      );
    }

    if (req.user) await query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    else if (session_id) await query('DELETE FROM cart_items WHERE session_id=$1', [session_id]);

    res.status(201).json({ order_id: order.id, order_number, total, subtotal, shipping_cost, message: 'Commande créée avec succès' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    const result = await Promise.all(orders.map(async o => ({
      ...o,
      shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address || '{}') : (o.shipping_address || {}),
      items: await query('SELECT * FROM order_items WHERE order_id=$1', [o.id]),
    })));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/orders/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const order = await queryOne('SELECT * FROM orders WHERE id=$1 OR order_number=$2', [req.params.id, req.params.id]);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (req.user && order.user_id && order.user_id !== req.user.id)
      return res.status(403).json({ error: 'Accès refusé' });

    const items = await query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
    res.json({
      ...order,
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address || '{}') : (order.shipping_address || {}),
      billing_address:  typeof order.billing_address  === 'string' ? JSON.parse(order.billing_address  || '{}') : (order.billing_address  || {}),
      items,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/orders/payment/process — Simulation paiement
router.post('/payment/process', (req, res) => {
  const { card_number, expiry, cvv } = req.body;
  if (!card_number || !expiry || !cvv)
    return res.status(400).json({ error: 'Informations de carte incomplètes' });
  if (card_number.replace(/\s/g, '').startsWith('4000'))
    return res.status(402).json({ error: 'Carte refusée. Veuillez utiliser un autre moyen de paiement.' });
  const last_four = card_number.replace(/\s/g, '').slice(-4);
  setTimeout(() => {
    res.json({ success: true, transaction_id: `TXN-${Date.now()}`, last_four, amount: req.body.amount, message: 'Paiement accepté' });
  }, 800);
});

module.exports = router;
