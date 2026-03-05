/**
 * Helper PostgreSQL — utilise la variable DATABASE_URL
 * Fallback : base de données JSON locale si DATABASE_URL absent (dev sans Neon)
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 10,
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
