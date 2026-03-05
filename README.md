# ÉLÉGANCE — Site E-Commerce Mode Femme

Modèle complet de boutique en ligne de vêtements

## Structure du projet

```
E-Commerce/
├── backend/          ← API Node.js/Express
│   ├── server.js
│   ├── .env
│   ├── database/
│   │   ├── db.js     ← Base de données JSON (sans compilation native)
│   │   └── seed.js   ← Données de démonstration
│   ├── routes/
│   │   ├── products.js
│   │   ├── auth.js
│   │   ├── cart.js
│   │   └── orders.js
│   └── middleware/auth.js
└── frontend/         ← Interface HTML/CSS/JS
    ├── index.html       → Page d'accueil
    ├── category.html    → Catalogue / filtres
    ├── product.html     → Détail produit
    ├── cart.html        → Panier
    ├── checkout.html    → Adresse de livraison
    ├── payment.html     → Paiement
    ├── confirmation.html → Confirmation de commande
    ├── login.html       → Connexion / Inscription
    ├── account.html     → Espace compte
    ├── orders.html      → Historique des commandes
    ├── css/style.css    → Styles (inspiré ZAPA)
    └── js/
        ├── api.js       → Client API
        ├── auth.js      → Authentification
        ├── cart.js      → Gestion du panier
        └── app.js       → Composants partagés
```

## Démarrage rapide

### 1. Installer les dépendances backend

```bash
cd backend
npm install
```

### 2. Initialiser la base de données

```bash
npm run seed
```

Cela crée :
- **21 produits** dans toutes les catégories
- Compte admin : `admin@elegance.fr` / `admin123`
- Compte test : `user@test.fr` / `user123`

### 3. Démarrer le serveur

```bash
npm start
# ou en développement (rechargement auto)
npm run dev
```

### 4. Ouvrir le site

Ouvrez votre navigateur sur **http://localhost:3000**

## Pages disponibles

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Hero banner, nouveautés, soldes |
| Catalogue | `/category.html` | Filtres par catégorie, tri, recherche |
| Produit | `/product.html?id=1` | Détail, tailles, couleurs |
| Panier | `/cart.html` | Articles, quantités, code promo |
| Livraison | `/checkout.html` | Formulaire d'adresse |
| Paiement | `/payment.html` | Carte bancaire ou PayPal |
| Confirmation | `/confirmation.html` | Récapitulatif commande |
| Connexion | `/login.html` | Login + Inscription |
| Compte | `/account.html` | Dashboard, commandes, adresses, favoris |
| Commandes | `/orders.html` | Historique et détail des commandes |

## API Endpoints

### Produits
- `GET /api/products` — Liste (filtres: category, is_new, is_sale, search, sort)
- `GET /api/products/:id` — Détail
- `GET /api/products/:id/related` — Produits similaires

### Authentification
- `POST /api/auth/register` — Inscription
- `POST /api/auth/login` — Connexion
- `GET /api/auth/me` — Profil (authentifié)
- `PUT /api/auth/me` — Modifier profil
- `PUT /api/auth/password` — Modifier mot de passe
- `GET/POST/DELETE /api/auth/addresses` — Gestion adresses
- `GET/POST/DELETE /api/auth/wishlist` — Favoris

### Panier
- `GET /api/cart` — Contenu du panier
- `POST /api/cart/add` — Ajouter un article
- `PUT /api/cart/:id` — Modifier quantité
- `DELETE /api/cart/:id` — Retirer un article
- `POST /api/cart/merge` — Fusionner panier invité/connecté

### Commandes
- `POST /api/orders` — Créer une commande
- `GET /api/orders` — Mes commandes (authentifié)
- `GET /api/orders/:id` — Détail commande
- `POST /api/orders/payment/process` — Simuler un paiement

## Fonctionnalités

- ✅ Catalogue avec filtres (catégorie, taille, nouveautés, soldes)
- ✅ Tri par prix et nouveauté
- ✅ Fiche produit avec galerie, sélecteur taille/couleur, guide des tailles
- ✅ Panier local (invité) + synchronisé (connecté)
- ✅ Tunnel de commande complet (livraison → paiement → confirmation)
- ✅ Paiement simulé (carte bancaire + PayPal)
- ✅ Inscription / Connexion par JWT
- ✅ Espace compte : commandes, adresses, favoris, profil
- ✅ Menu mobile responsive
- ✅ Barre de recherche
- ✅ Notifications toast
- ✅ Menu latéral des filtres
- ✅ Guide des tailles (modal)
- ✅ Newsletter (simulée)

## Codes promo de démonstration

| Code | Réduction |
|------|-----------|
| `ELEGANCE10` | −10% |
| `WELCOME15` | −15% |
| `SPRING20` | −20% |

## Carte de test refusée

Pour simuler un refus de carte, utilisez un numéro commençant par `4000`.

## Personnalisation

- **Images** : Les fonds verts (#8AB89E) représentent les emplacements d'images. Remplacez-les par de vraies images dans le CSS (`.product-img-bg`, `.hero-img-placeholder`) ou ajoutez des balises `<img>`.
- **Couleurs** : Modifiez les variables CSS dans `--color-*` au début de `style.css`
- **Nom de marque** : Remplacez "ÉLÉGANCE" dans les fichiers HTML et `app.js`
- **Catégories** : Ajoutez des produits via le fichier `seed.js`
