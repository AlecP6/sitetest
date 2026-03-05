const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/db');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try { req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET); } catch {}
  }
  next();
}

async function adminMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token manquant' });
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    const user = await queryOne('SELECT id, role FROM users WHERE id = $1', [decoded.id]);
    if (!user || user.role !== 'admin')
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }
}

module.exports = { authMiddleware, optionalAuth, adminMiddleware };
