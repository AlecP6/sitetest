const express = require('express');
const router = express.Router();
const db = require('../database/db');

function parseProduct(p) {
  // Normalise le champ images[] (stocké en JSON)
  // Compat ascendante : si images absent mais image_url présent, on construit le tableau
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
    image_url: images[0] || null,   // garde image_url = 1ère photo (cartes produit)
  };
}

// GET /api/products
router.get('/', (req, res) => {
  const { category, subcategory, search, is_new, is_sale, sort, limit = 50, offset = 0 } = req.query;

  let products = db.products.find();

  if (category && category !== 'nouveautes') products = products.filter(p => p.category === category);
  if (subcategory) products = products.filter(p => p.subcategory === subcategory);
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.subtitle || '').toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s)
    );
  }
  if (is_new === '1' || category === 'nouveautes') products = products.filter(p => p.is_new === 1);
  if (is_sale === '1') products = products.filter(p => p.is_sale === 1);

  const total = products.length;

  switch (sort) {
    case 'price_asc': products.sort((a, b) => a.price - b.price); break;
    case 'price_desc': products.sort((a, b) => b.price - a.price); break;
    case 'newest': products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
    default: products.sort((a, b) => (b.is_new - a.is_new) || (new Date(b.created_at) - new Date(a.created_at)));
  }

  const paginated = products.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ products: paginated.map(parseProduct), total });
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  const all = db.products.find();
  const cats = [...new Map(all.map(p => [`${p.category}__${p.subcategory}`, { category: p.category, subcategory: p.subcategory }])).values()];
  res.json(cats);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.products.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  res.json(parseProduct(product));
});

// GET /api/products/:id/related
router.get('/:id/related', (req, res) => {
  const product = db.products.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

  const related = db.products.where(p => p.category === product.category && p.id !== product.id);
  const shuffled = related.sort(() => Math.random() - 0.5).slice(0, 4);
  res.json(shuffled.map(parseProduct));
});

module.exports = router;
