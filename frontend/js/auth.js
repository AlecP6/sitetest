/* ===================================================================
   Auth — Gestion de l'authentification
   =================================================================== */

const Auth = {
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  isAdmin() {
    const user = this.getUser();
    return !!(user && user.role === 'admin');
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  async login(email, password) {
    const data = await Api.auth.login(email, password);
    this.setSession(data.token, data.user);
    // Fusionner le panier invité
    const sessionId = Cart.getSessionId();
    if (sessionId) {
      try { await Api.cart.merge(sessionId); } catch (e) {}
    }
    return data;
  },

  async register(formData) {
    const data = await Api.auth.register(formData);
    this.setSession(data.token, data.user);
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },

  requireAuth(redirectUrl = '/login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  },

  redirectIfLoggedIn(redirectUrl = '/account.html') {
    if (this.isLoggedIn()) {
      window.location.href = redirectUrl;
      return true;
    }
    return false;
  },
};
