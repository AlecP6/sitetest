const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const db      = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');

// ── Image upload ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', '..', 'frontend', 'images', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `product-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP.'), false);
  },
});

// POST /api/admin/upload
router.post('/upload', adminMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  res.json({ url: `/images/products/${req.file.filename}` });
});

function parseProduct(p) {
  let images = [];
  if (p.images) {
    images = typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []);
  } else if (p.image_url) {
    images = [p.image_url];
  }
  return {
    ...p,
    sizes:  typeof p.sizes  === 'string' ? JSON.parse(p.sizes  || '[]') : (p.sizes  || []),
    colors: typeof p.colors === 'string' ? JSON.parse(p.colors || '[]') : (p.colors || []),
    images,
    image_url: images[0] || null,
  };
}

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', adminMiddleware, (req, res) => {
  const orders   = db.orders.find();
  const products = db.products.find();
  const users    = db.users.find();

  const totalRevenue = orders
    .filter(o => o.status !== 'annule')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today).length;

  const statusCounts = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  const revenueByDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toDateString();
    const rev = orders
      .filter(o => new Date(o.created_at).toDateString() === dayStr && o.status !== 'annule')
      .reduce((s, o) => s + (o.total || 0), 0);
    revenueByDay.push({ date: d.toISOString().split('T')[0], revenue: rev });
  }

  res.json({
    total_orders:    orders.length,
    total_revenue:   totalRevenue,
    total_products:  products.length,
    total_users:     users.length,
    today_orders:    todayOrders,
    pending_orders:  orders.filter(o => o.status === 'en_attente').length,
    low_stock_count: products.filter(p => p.stock < 10).length,
    status_counts:   statusCounts,
    revenue_by_day:  revenueByDay,
  });
});

// ── GET /api/admin/products ──────────────────────────────────────────────────
router.get('/products', adminMiddleware, (req, res) => {
  const { search, category, limit = 50, offset = 0 } = req.query;
  let products = db.products.find();
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(s) || (p.subtitle || '').toLowerCase().includes(s)
    );
  }
  if (category) products = products.filter(p => p.category === category);
  const total = products.length;
  products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const paginated = products.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ products: paginated.map(parseProduct), total });
});

// ── POST /api/admin/products ─────────────────────────────────────────────────
router.post('/products', adminMiddleware, (req, res) => {
  const { name, subtitle, description, price, original_price, category, subcategory, sizes, colors, stock, is_new, is_sale } = req.body;
  if (!name || price === undefined || !category)
    return res.status(400).json({ error: 'Nom, prix et catégorie sont requis' });

  const toArray = v => Array.isArray(v) ? v : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);
  // images : tableau de 1 à 3 URLs (envoyé comme JSON string ou array)
  let images = req.body.images || [];
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = images ? [images] : []; }
  }
  images = images.filter(Boolean).slice(0, 3);

  const product = db.products.insert({
    name: name.trim(),
    subtitle: (subtitle || '').trim(),
    description: (description || '').trim(),
    price: Number(price),
    original_price: original_price ? Number(original_price) : null,
    category,
    subcategory: subcategory || '',
    sizes: JSON.stringify(toArray(sizes)),
    colors: JSON.stringify(toArray(colors)),
    stock: Number(stock) || 0,
    is_new: is_new ? 1 : 0,
    is_sale: is_sale ? 1 : 0,
    images: JSON.stringify(images),
    image_url: images[0] || null,
  });
  res.status(201).json(parseProduct(product));
});

// ── PUT /api/admin/products/:id ──────────────────────────────────────────────
router.put('/products/:id', adminMiddleware, (req, res) => {
  const product = db.products.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

  const { name, subtitle, description, price, original_price, category, subcategory, sizes, colors, stock, is_new, is_sale } = req.body;
  const toArray = v => Array.isArray(v) ? v : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);

  // images
  let images;
  if (req.body.images !== undefined) {
    images = req.body.images;
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch { images = images ? [images] : []; }
    }
    images = (images || []).filter(Boolean).slice(0, 3);
  } else {
    // conserver l'existant
    try { images = JSON.parse(product.images || '[]'); } catch { images = product.image_url ? [product.image_url] : []; }
  }

  const updated = db.products.update(req.params.id, {
    name:           name           !== undefined ? name.trim()                              : product.name,
    subtitle:       subtitle       !== undefined ? subtitle.trim()                          : product.subtitle,
    description:    description    !== undefined ? description.trim()                       : product.description,
    price:          price          !== undefined ? Number(price)                            : product.price,
    original_price: original_price !== undefined ? (original_price ? Number(original_price) : null) : product.original_price,
    category:       category       !== undefined ? category                                 : product.category,
    subcategory:    subcategory    !== undefined ? subcategory                              : product.subcategory,
    sizes:          sizes          !== undefined ? JSON.stringify(toArray(sizes))           : product.sizes,
    colors:         colors         !== undefined ? JSON.stringify(toArray(colors))          : product.colors,
    stock:          stock          !== undefined ? Number(stock)                            : product.stock,
    is_new:         is_new         !== undefined ? (is_new ? 1 : 0)                        : product.is_new,
    is_sale:        is_sale        !== undefined ? (is_sale ? 1 : 0)                       : product.is_sale,
    images:         JSON.stringify(images),
    image_url:      images[0] || null,
  });
  res.json(parseProduct(updated));
});

// ── DELETE /api/admin/products/:id ───────────────────────────────────────────
router.delete('/products/:id', adminMiddleware, (req, res) => {
  const product = db.products.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  db.products.delete(req.params.id);
  res.json({ message: 'Produit supprimé' });
});

// ── GET /api/admin/orders ────────────────────────────────────────────────────
router.get('/orders', adminMiddleware, (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;
  let orders = db.orders.find().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (status) orders = orders.filter(o => o.status === status);
  if (search) {
    const s = search.toLowerCase();
    orders = orders.filter(o =>
      o.order_number.toLowerCase().includes(s) || o.email.toLowerCase().includes(s)
    );
  }
  const total = orders.length;
  const paginated = orders.slice(Number(offset), Number(offset) + Number(limit));
  const withItems = paginated.map(o => ({
    ...o,
    shipping_address: typeof o.shipping_address === 'string'
      ? JSON.parse(o.shipping_address || '{}') : (o.shipping_address || {}),
    items: db.order_items.find({ order_id: o.id }),
  }));
  res.json({ orders: withItems, total });
});

// ── PUT /api/admin/orders/:id/status ────────────────────────────────────────
router.put('/orders/:id/status', adminMiddleware, (req, res) => {
  const VALID = ['en_attente', 'confirme', 'en_preparation', 'expedie', 'livre', 'annule'];
  const { status } = req.body;
  if (!VALID.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  const order = db.orders.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
  db.orders.update(req.params.id, { status });
  res.json({ message: 'Statut mis à jour', status });
});

// ── GET /api/admin/stock ─────────────────────────────────────────────────────
router.get('/stock', adminMiddleware, (req, res) => {
  const { low_stock, search, category } = req.query;
  let products = db.products.find();
  if (low_stock === '1') products = products.filter(p => p.stock < 10);
  if (category)  products = products.filter(p => p.category === category);
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(s));
  }
  products.sort((a, b) => a.stock - b.stock);
  res.json({
    stock: products.map(p => ({
      id: p.id, name: p.name, subtitle: p.subtitle || '',
      category: p.category, subcategory: p.subcategory || '',
      stock: p.stock, price: p.price, is_sale: p.is_sale, is_new: p.is_new,
    })),
    total: products.length,
  });
});

// ── PUT /api/admin/stock/:id ─────────────────────────────────────────────────
router.put('/stock/:id', adminMiddleware, (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || Number(stock) < 0) return res.status(400).json({ error: 'Stock invalide' });
  const product = db.products.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  db.products.update(req.params.id, { stock: Number(stock) });
  res.json({ message: 'Stock mis à jour', stock: Number(stock) });
});

module.exports = router;
