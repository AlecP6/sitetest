/**
 * Helper PostgreSQL — utilise la variable DATABASE_URL
 * Fallback : base de données JSON locale si DATABASE_URL absent (dev sans Neon)
 */
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL manquant — vérifiez les variables d\'environnement Vercel.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 8000,   // échoue après 8s au lieu de pendre
  idleTimeoutMillis:       30000,
  allowExitOnIdle:         true,
});

/**
 * Exécute une requête SQL et retourne les lignes.
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<any[]>}
 */
async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Exécute une requête SQL et retourne la première ligne.
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { query, queryOne, pool };
