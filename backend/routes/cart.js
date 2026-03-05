const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../database/db');
const { optionalAuth } = require('../middleware/auth');

function getId(req) {
  if (req.user) return { user_id: req.user.id, session_id: null };
  return { user_id: null, session_id: req.headers['x-session-id'] || 'guest' };
}

// GET /api/cart
router.get('/', optionalAuth, async (req, res) => {
  try {
    const id = getId(req);
    const sql = id.user_id
      ? `SELECT ci.*, p.name, p.subtitle, p.price AS unit_price, p.original_price, p.stock, p.image_url, p.images
         FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=$1`
      : `SELECT ci.*, p.name, p.subtitle, p.price AS unit_price, p.original_price, p.stock, p.image_url, p.images
         FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.session_id=$1`;
    const items = await query(sql, [id.user_id || id.session_id]);
    const total = items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    res.json({ items, total, count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/cart/add
router.post('/add', optionalAuth, async (req, res) => {
  try {
    const { product_id, quantity = 1, size = '', color = '' } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id requis' });

    const product = await queryOne('SELECT id FROM products WHERE id=$1', [product_id]);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const id = getId(req);
    const existing = id.user_id
      ? await queryOne('SELECT * FROM cart_items WHERE user_id=$1 AND product_id=$2 AND size=$3 AND color=$4',
          [id.user_id, product_id, size, color])
      : await queryOne('SELECT * FROM cart_items WHERE session_id=$1 AND product_id=$2 AND size=$3 AND color=$4',
          [id.session_id, product_id, size, color]);

    if (existing) {
      await query('UPDATE cart_items SET quantity=quantity+$1 WHERE id=$2', [Number(quantity), existing.id]);
    } else {
      await query(
        'INSERT INTO cart_items (user_id, session_id, product_id, quantity, size, color) VALUES ($1,$2,$3,$4,$5,$6)',
        [id.user_id, id.session_id, product_id, Number(quantity), size, color]
      );
    }
    res.json({ message: 'Produit ajouté au panier' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/cart/:id
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantité invalide' });
    await query('UPDATE cart_items SET quantity=$1 WHERE id=$2', [Number(quantity), req.params.id]);
    res.json({ message: 'Quantité mise à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/cart/:id
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    await query('DELETE FROM cart_items WHERE id=$1', [req.params.id]);
    res.json({ message: 'Article retiré du panier' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/cart
router.delete('/', optionalAuth, async (req, res) => {
  try {
    const id = getId(req);
    if (id.user_id) await query('DELETE FROM cart_items WHERE user_id=$1', [id.user_id]);
    else await query('DELETE FROM cart_items WHERE session_id=$1', [id.session_id]);
    res.json({ message: 'Panier vidé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/cart/merge
router.post('/merge', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    const { session_id } = req.body;
    if (!session_id) return res.json({ message: 'Rien à fusionner' });

    const guestItems = await query('SELECT * FROM cart_items WHERE session_id=$1', [session_id]);
    for (const item of guestItems) {
      const existing = await queryOne(
        'SELECT * FROM cart_items WHERE user_id=$1 AND product_id=$2 AND size=$3 AND color=$4',
        [req.user.id, item.product_id, item.size, item.color]
      );
      if (existing) {
        await query('UPDATE cart_items SET quantity=quantity+$1 WHERE id=$2', [item.quantity, existing.id]);
        await query('DELETE FROM cart_items WHERE id=$1', [item.id]);
      } else {
        await query('UPDATE cart_items SET user_id=$1, session_id=NULL WHERE id=$2', [req.user.id, item.id]);
      }
    }
    res.json({ message: 'Panier fusionné' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
