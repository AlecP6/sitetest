const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;
  if (!email || !password || !first_name || !last_name)
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });

  const existing = db.users.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

  const user = db.users.insert({
    email, password: bcrypt.hashSync(password, 10),
    first_name, last_name, phone: phone || '',
  });

  const token = jwt.sign(
    { id: user.id, email, first_name, last_name },
    process.env.JWT_SECRET, { expiresIn: '7d' }
  );
  res.status(201).json({ token, user: { id: user.id, email, first_name, last_name } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const user = db.users.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

  const token = jwt.sign(
    { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role || 'user' },
    process.env.JWT_SECRET, { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role || 'user' } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  const { password, ...safe } = user;
  res.json(safe);
});

// PUT /api/auth/me
router.put('/me', authMiddleware, (req, res) => {
  const { first_name, last_name, phone } = req.body;
  db.users.update(req.user.id, { first_name, last_name, phone: phone || '' });
  res.json({ message: 'Profil mis à jour' });
});

// PUT /api/auth/password
router.put('/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.users.findById(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password))
    return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  db.users.update(req.user.id, { password: bcrypt.hashSync(new_password, 10) });
  res.json({ message: 'Mot de passe mis à jour' });
});

// GET /api/auth/addresses
router.get('/addresses', authMiddleware, (req, res) => {
  res.json(db.addresses.find({ user_id: req.user.id }));
});

// POST /api/auth/addresses
router.post('/addresses', authMiddleware, (req, res) => {
  const { first_name, last_name, address, address2, city, postal_code, country, type, is_default } = req.body;
  if (is_default) db.addresses.updateWhere({ user_id: req.user.id, type: type || 'shipping' }, { is_default: 0 });
  const addr = db.addresses.insert({
    user_id: req.user.id, type: type || 'shipping',
    first_name, last_name, address, address2: address2 || '',
    city, postal_code, country: country || 'France', is_default: is_default ? 1 : 0,
  });
  res.status(201).json({ id: addr.id, message: 'Adresse ajoutée' });
});

// DELETE /api/auth/addresses/:id
router.delete('/addresses/:id', authMiddleware, (req, res) => {
  const addr = db.addresses.findById(req.params.id);
  if (!addr || addr.user_id !== req.user.id) return res.status(404).json({ error: 'Adresse non trouvée' });
  db.addresses.delete(req.params.id);
  res.json({ message: 'Adresse supprimée' });
});

// GET /api/auth/wishlist
router.get('/wishlist', authMiddleware, (req, res) => {
  const items = db.wishlist.find({ user_id: req.user.id });
  const products = items.map(w => {
    const p = db.products.findById(w.product_id);
    if (!p) return null;
    const sizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes || '[]') : (p.sizes || []);
    const colors = typeof p.colors === 'string' ? JSON.parse(p.colors || '[]') : (p.colors || []);
    return { ...p, sizes, colors, added_at: w.created_at };
  }).filter(Boolean);
  res.json(products);
});

// POST /api/auth/wishlist/:productId
router.post('/wishlist/:productId', authMiddleware, (req, res) => {
  const existing = db.wishlist.findOne({ user_id: req.user.id, product_id: Number(req.params.productId) });
  if (existing) return res.status(409).json({ error: 'Déjà dans les favoris' });
  db.wishlist.insert({ user_id: req.user.id, product_id: Number(req.params.productId) });
  res.json({ message: 'Ajouté aux favoris' });
});

// DELETE /api/auth/wishlist/:productId
router.delete('/wishlist/:productId', authMiddleware, (req, res) => {
  db.wishlist.deleteWhere({ user_id: req.user.id, product_id: Number(req.params.productId) });
  res.json({ message: 'Retiré des favoris' });
});

module.exports = router;
