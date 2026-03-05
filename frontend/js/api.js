/* ===================================================================
   API Client — Communication avec le backend
   =================================================================== */

// Relative en production (même domaine), absolu en dev local
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api';

const Api = {
  getHeaders() {
    const token = localStorage.getItem('token');
    const sessionId = Cart.getSessionId();
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
      }
      throw err;
    }
  },

  get: (ep) => Api.request('GET', ep),
  post: (ep, body) => Api.request('POST', ep, body),
  put: (ep, body) => Api.request('PUT', ep, body),
  delete: (ep) => Api.request('DELETE', ep),

  // Produits
  products: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return Api.get(`/products${qs ? '?' + qs : ''}`);
    },
    get: (id) => Api.get(`/products/${id}`),
    related: (id) => Api.get(`/products/${id}/related`),
    categories: () => Api.get('/products/categories'),
  },

  // Auth
  auth: {
    login: (email, password) => Api.post('/auth/login', { email, password }),
    register: (data) => Api.post('/auth/register', data),
    me: () => Api.get('/auth/me'),
    updateProfile: (data) => Api.put('/auth/me', data),
    updatePassword: (data) => Api.put('/auth/password', data),
    getAddresses: () => Api.get('/auth/addresses'),
    addAddress: (data) => Api.post('/auth/addresses', data),
    deleteAddress: (id) => Api.delete(`/auth/addresses/${id}`),
    getWishlist: () => Api.get('/auth/wishlist'),
    addToWishlist: (id) => Api.post(`/auth/wishlist/${id}`, {}),
    removeFromWishlist: (id) => Api.delete(`/auth/wishlist/${id}`),
  },

  // Panier
  cart: {
    get: () => Api.get('/cart'),
    add: (product_id, quantity, size, color) => Api.post('/cart/add', { product_id, quantity, size, color }),
    update: (id, quantity) => Api.put(`/cart/${id}`, { quantity }),
    remove: (id) => Api.delete(`/cart/${id}`),
    clear: () => Api.delete('/cart'),
    merge: (session_id) => Api.post('/cart/merge', { session_id }),
  },

  // Commandes
  orders: {
    create: (data) => Api.post('/orders', data),
    list: () => Api.get('/orders'),
    get: (id) => Api.get(`/orders/${id}`),
    processPayment: (data) => Api.post('/orders/payment/process', data),
  },
};
