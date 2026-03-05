const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../database/db');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, search, is_new, is_sale, sort, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let i = 1;

    if (category && category !== 'nouveautes') { sql += ` AND category = $${i++}`; params.push(category); }
    if (subcategory) { sql += ` AND subcategory = $${i++}`; params.push(subcategory); }
    if (search) {
      sql += ` AND (name ILIKE $${i} OR subtitle ILIKE $${i} OR description ILIKE $${i})`;
      params.push(`%${search}%`); i++;
    }
    if (is_new === '1' || category === 'nouveautes') { sql += ` AND is_new = 1`; }
    if (is_sale === '1') { sql += ` AND is_sale = 1`; }

    const allRows = await query(sql, params);
    const total = allRows.length;

    // Tri
    if (sort === 'price_asc')  allRows.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') allRows.sort((a, b) => b.price - a.price);
    else if (sort === 'newest') allRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else allRows.sort((a, b) => (b.is_new - a.is_new) || (new Date(b.created_at) - new Date(a.created_at)));

    const paginated = allRows.slice(Number(offset), Number(offset) + Number(limit)).map(parseProduct);
    res.json({ products: paginated, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const rows = await query('SELECT DISTINCT category, subcategory FROM products ORDER BY category, subcategory');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await queryOne('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(parseProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id/related
router.get('/:id/related', async (req, res) => {
  try {
    const product = await queryOne('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    const related = await query(
      'SELECT * FROM products WHERE category = $1 AND id != $2 ORDER BY RANDOM() LIMIT 4',
      [product.category, product.id]
    );
    res.json(related.map(parseProduct));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

module.exports = router;
