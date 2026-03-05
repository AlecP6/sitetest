require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'null',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir le frontend en statique
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Routes API
app.use('/api/products', require('./routes/products'));
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    require('./routes/admin'));

// Route santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur Élégance opérationnel', timestamp: new Date() });
});

// Fallback SPA - toutes les routes non-API renvoient le frontend
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✓ Serveur Élégance démarré sur http://localhost:${PORT}`);
  console.log(`✓ API disponible sur http://localhost:${PORT}/api`);
  console.log(`✓ Frontend disponible sur http://localhost:${PORT}\n`);
});
