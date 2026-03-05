const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { query, queryOne } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const sign = user => jwt.sign(
  { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role || 'user' },
  process.env.JWT_SECRET, { expiresIn: '7d' }
);
const safeUser = u => ({ id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role || 'user' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;
    if (!email || !password || !first_name || !last_name)
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const user = await queryOne(
      'INSERT INTO users (email, password, first_name, last_name, phone) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [email, bcrypt.hashSync(password, 10), first_name, last_name, phone || '']
    );
    res.status(201).json({ token: sign(user), user: safeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    res.json({ token: sign(user), user: safeUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await queryOne('SELECT id,email,first_name,last_name,phone,role,created_at FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/auth/me
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    await query('UPDATE users SET first_name=$1, last_name=$2, phone=$3 WHERE id=$4',
      [first_name, last_name, phone || '', req.user.id]);
    res.json({ message: 'Profil mis à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/auth/password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await queryOne('SELECT password FROM users WHERE id=$1', [req.user.id]);
    if (!bcrypt.compareSync(current_password, user.password))
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    if (new_password.length < 6)
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    await query('UPDATE users SET password=$1 WHERE id=$2', [bcrypt.hashSync(new_password, 10), req.user.id]);
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/addresses
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/addresses
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, address, address2, city, postal_code, country, type, is_default } = req.body;
    if (is_default) await query('UPDATE addresses SET is_default=0 WHERE user_id=$1 AND type=$2', [req.user.id, type || 'shipping']);
    const addr = await queryOne(
      'INSERT INTO addresses (user_id,type,first_name,last_name,address,address2,city,postal_code,country,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
      [req.user.id, type || 'shipping', first_name, last_name, address, address2 || '', city, postal_code, country || 'France', is_default ? 1 : 0]
    );
    res.status(201).json({ id: addr.id, message: 'Adresse ajoutée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/auth/addresses/:id
router.delete('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const addr = await queryOne('SELECT * FROM addresses WHERE id=$1', [req.params.id]);
    if (!addr || addr.user_id !== req.user.id) return res.status(404).json({ error: 'Adresse non trouvée' });
    await query('DELETE FROM addresses WHERE id=$1', [req.params.id]);
    res.json({ message: 'Adresse supprimée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/wishlist
router.get('/wishlist', authMiddleware, async (req, res) => {
  try {
    const rows = await query(
      `SELECT p.*, w.created_at AS added_at FROM wishlist w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/wishlist/:productId
router.post('/wishlist/:productId', authMiddleware, async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM wishlist WHERE user_id=$1 AND product_id=$2', [req.user.id, req.params.productId]);
    if (existing) return res.status(409).json({ error: 'Déjà dans les favoris' });
    await query('INSERT INTO wishlist (user_id, product_id) VALUES ($1,$2)', [req.user.id, req.params.productId]);
    res.json({ message: 'Ajouté aux favoris' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/auth/wishlist/:productId
router.delete('/wishlist/:productId', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2', [req.user.id, req.params.productId]);
    res.json({ message: 'Retiré des favoris' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
