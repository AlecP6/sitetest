/**
 * Base de données JSON pure JavaScript
 * Stockage dans data/elegance.json (pas de compilation native requise)
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_FILE = path.join(dataDir, 'elegance.json');

const DEFAULTS = {
  users: [], products: [], cart_items: [], orders: [],
  order_items: [], addresses: [], wishlist: [],
};

class Collection {
  constructor(store, name) {
    this._store = store;
    this._name = name;
  }
  get _data() { return this._store._data[this._name]; }

  _nextId() {
    const ids = this._data.map(i => i.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  insert(item) {
    const row = { id: this._nextId(), created_at: new Date().toISOString(), ...item };
    this._data.push(row);
    this._store._save();
    return row;
  }

  find(query = {}) {
    return this._data.filter(row =>
      Object.entries(query).every(([k, v]) => row[k] === v)
    );
  }

  findOne(query = {}) {
    return this._data.find(row =>
      Object.entries(query).every(([k, v]) => row[k] === v)
    ) || null;
  }

  findById(id) { return this.findOne({ id: Number(id) }); }

  where(fn) { return this._data.filter(fn); }

  update(id, updates) {
    const idx = this._data.findIndex(r => r.id === Number(id));
    if (idx < 0) return null;
    this._data[idx] = { ...this._data[idx], ...updates, updated_at: new Date().toISOString() };
    this._store._save();
    return this._data[idx];
  }

  updateWhere(query, updates) {
    let count = 0;
    this._data.forEach((row, i) => {
      if (Object.entries(query).every(([k, v]) => row[k] === v)) {
        this._data[i] = { ...row, ...updates };
        count++;
      }
    });
    if (count) this._store._save();
    return count;
  }

  delete(id) {
    const len = this._data.length;
    const idx = this._data.findIndex(r => r.id === Number(id));
    if (idx >= 0) { this._data.splice(idx, 1); this._store._save(); }
    return len - this._data.length;
  }

  deleteWhere(query) {
    const before = this._data.length;
    const keep = this._data.filter(row =>
      !Object.entries(query).every(([k, v]) => row[k] === v)
    );
    this._store._data[this._name] = keep;
    this._store._save();
    return before - keep.length;
  }

  count(query = {}) { return this.find(query).length; }

  clear() {
    this._store._data[this._name] = [];
    this._store._save();
  }
}

class Store {
  constructor(file) {
    this._file = file;
    this._data = this._load();
    // Créer les collections comme propriétés
    for (const name of Object.keys(DEFAULTS)) {
      this[name] = new Collection(this, name);
    }
  }

  _load() {
    try {
      const raw = fs.readFileSync(this._file, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch {
      return { ...DEFAULTS };
    }
  }

  _save() {
    fs.writeFileSync(this._file, JSON.stringify(this._data, null, 2));
  }

  transaction(fn) {
    return fn();
  }
}

module.exports = new Store(DB_FILE);
