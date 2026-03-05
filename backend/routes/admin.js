const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const { query, queryOne } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');

// ── Image upload ──────────────────────────────────────────────────────────────
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
    else cb(new Error('Format non supporté'), false);
  },
});

// POST /api/admin/upload
router.post('/upload', adminMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  res.json({ url: `/images/products/${req.file.filename}` });
});

// ── parseProduct ──────────────────────────────────────────────────────────────
function parseProduct(p) {
  const images = Array.isArray(p.images) ? p.images
    : (typeof p.images === 'string' ? JSON.parse(p.images || '[]') : []);
  return {
    ...p,
    sizes:  Array.isArray(p.sizes)  ? p.sizes  : JSON.parse(p.sizes  || '[]'),
    colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
    images,
    image_url: images[0] || p.image_url || null,
  };
}

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [ordersRow] = await query('SELECT COUNT(*) AS cnt, COALESCE(SUM(total),0) AS revenue FROM orders');
    const [productsRow] = await query('SELECT COUNT(*) AS cnt FROM products');
    const [usersRow] = await query("SELECT COUNT(*) AS cnt FROM users WHERE role != 'admin'");
    const [lowStockRow] = await query('SELECT COUNT(*) AS cnt FROM products WHERE stock < 10');
    const recentOrders = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    const lowStock = await query('SELECT id,name,stock,category FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 5');
    res.json({
      orders:    Number(ordersRow.cnt),
      revenue:   Number(ordersRow.revenue),
      products:  Number(productsRow.cnt),
      customers: Number(usersRow.cnt),
      low_stock: Number(lowStockRow.cnt),
      recent_orders: recentOrders,
      low_stock_products: lowStock,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/admin/products ───────────────────────────────────────────────────
router.get('/products', adminMiddleware, async (req, res) => {
  try {
    const { search, category, limit = 20, offset = 0 } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let i = 1;
    if (search) { sql += ` AND (name ILIKE $${i} OR subtitle ILIKE $${i})`; params.push(`%${search}%`); i++; }
    if (category) { sql += ` AND category = $${i++}`; params.push(category); }
    const all = await query(sql, params);
    const total = all.length;
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const paginated = all.slice(Number(offset), Number(offset) + Number(limit)).map(parseProduct);
    res.json({ products: paginated, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/admin/products ──────────────────────────────────────────────────
router.post('/products', adminMiddleware, async (req, res) => {
  try {
    const { name, subtitle, description, price, original_price, category, subcategory, sizes, colors, stock, is_new, is_sale } = req.body;
    if (!name || price === undefined || !category)
      return res.status(400).json({ error: 'Nom, prix et catégorie sont requis' });

    const toArray = v => Array.isArray(v) ? v : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);
    let images = req.body.images || [];
    if (typeof images === 'string') { try { images = JSON.parse(images); } catch { images = images ? [images] : []; } }
    images = images.filter(Boolean).slice(0, 3);

    const product = await queryOne(
      `INSERT INTO products (name,subtitle,description,price,original_price,category,subcategory,sizes,colors,stock,is_new,is_sale,images,image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [name.trim(), (subtitle||'').trim(), (description||'').trim(), Number(price),
       original_price ? Number(original_price) : null, category, subcategory||'',
       JSON.stringify(toArray(sizes)), JSON.stringify(toArray(colors)),
       Number(stock)||0, is_new?1:0, is_sale?1:0,
       JSON.stringify(images), images[0]||null]
    );
    res.status(201).json(parseProduct(product));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/admin/products/:id ───────────────────────────────────────────────
router.put('/products/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await queryOne('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const { name, subtitle, description, price, original_price, category, subcategory, sizes, colors, stock, is_new, is_sale } = req.body;
    const toArray = v => Array.isArray(v) ? v : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);

    let images;
    if (req.body.images !== undefined) {
      images = req.body.images;
      if (typeof images === 'string') { try { images = JSON.parse(images); } catch { images = images ? [images] : []; } }
      images = (images||[]).filter(Boolean).slice(0, 3);
    } else {
      images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]');
    }

    const updated = await queryOne(
      `UPDATE products SET
        name=$1, subtitle=$2, description=$3, price=$4, original_price=$5,
        category=$6, subcategory=$7, sizes=$8, colors=$9, stock=$10,
        is_new=$11, is_sale=$12, images=$13, image_url=$14
       WHERE id=$15 RETURNING *`,
      [name !== undefined ? name.trim() : product.name,
       subtitle !== undefined ? subtitle.trim() : product.subtitle,
       description !== undefined ? description.trim() : product.description,
       price !== undefined ? Number(price) : product.price,
       original_price !== undefined ? (original_price ? Number(original_price) : null) : product.original_price,
       category !== undefined ? category : product.category,
       subcategory !== undefined ? subcategory : product.subcategory,
       sizes !== undefined ? JSON.stringify(toArray(sizes)) : product.sizes,
       colors !== undefined ? JSON.stringify(toArray(colors)) : product.colors,
       stock !== undefined ? Number(stock) : product.stock,
       is_new !== undefined ? (is_new?1:0) : product.is_new,
       is_sale !== undefined ? (is_sale?1:0) : product.is_sale,
       JSON.stringify(images), images[0]||null,
       req.params.id]
    );
    res.json(parseProduct(updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/admin/products/:id ───────────────────────────────────────────
router.delete('/products/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await queryOne('SELECT id FROM products WHERE id=$1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    await query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Produit supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/admin/orders ─────────────────────────────────────────────────────
router.get('/orders', adminMiddleware, async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let i = 1;
    if (status) { sql += ` AND status=$${i++}`; params.push(status); }
    if (search) { sql += ` AND (order_number ILIKE $${i} OR email ILIKE $${i})`; params.push(`%${search}%`); i++; }
    sql += ' ORDER BY created_at DESC';
    const all = await query(sql, params);
    const total = all.length;
    const paginated = all.slice(Number(offset), Number(offset) + Number(limit));
    const withItems = await Promise.all(paginated.map(async o => ({
      ...o,
      shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address||'{}') : (o.shipping_address||{}),
      items: await query('SELECT * FROM order_items WHERE order_id=$1', [o.id]),
    })));
    res.json({ orders: withItems, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/admin/orders/:id/status ─────────────────────────────────────────
router.put('/orders/:id/status', adminMiddleware, async (req, res) => {
  try {
    const VALID = ['en_attente','confirme','en_preparation','expedie','livre','annule'];
    const { status } = req.body;
    if (!VALID.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
    const order = await queryOne('SELECT id FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    await query('UPDATE orders SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ message: 'Statut mis à jour', status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/admin/stock ──────────────────────────────────────────────────────
router.get('/stock', adminMiddleware, async (req, res) => {
  try {
    const { low_stock, search, category } = req.query;
    let sql = 'SELECT id,name,subtitle,category,subcategory,stock,price,is_sale,is_new FROM products WHERE 1=1';
    const params = [];
    let i = 1;
    if (low_stock === '1') { sql += ` AND stock < 10`; }
    if (category) { sql += ` AND category=$${i++}`; params.push(category); }
    if (search) { sql += ` AND name ILIKE $${i++}`; params.push(`%${search}%`); }
    sql += ' ORDER BY stock ASC';
    const stock = await query(sql, params);
    res.json({ stock, total: stock.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/admin/stock/:id ──────────────────────────────────────────────────
router.put('/stock/:id', adminMiddleware, async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || isNaN(Number(stock)))
      return res.status(400).json({ error: 'Stock invalide' });
    const product = await queryOne('SELECT id FROM products WHERE id=$1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    await query('UPDATE products SET stock=$1 WHERE id=$2', [Number(stock), req.params.id]);
    res.json({ message: 'Stock mis à jour', stock: Number(stock) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
