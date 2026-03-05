require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('./db');
const bcrypt = require('bcryptjs');

// Les images sont ajoutées via le panel admin (upload ou URL)
// Par défaut : pas d'image (fond neutre affiché)
const IMG = () => null;

// Vider toutes les collections
db.users.clear(); db.products.clear(); db.cart_items.clear();
db.orders.clear(); db.order_items.clear(); db.addresses.clear(); db.wishlist.clear();

// Utilisateurs
db.users.insert({ email: 'admin@elegance.fr', password: bcrypt.hashSync('admin123', 10), first_name: 'Admin', last_name: 'Élégance', phone: '', role: 'admin' });
db.users.insert({ email: 'user@test.fr', password: bcrypt.hashSync('user123', 10), first_name: 'Marie', last_name: 'Dupont', phone: '06 12 34 56 78' });

// Produits
const products = [
  // ── Tops & Blouses ───────────────────────────────────────────────────────
  {
    name: 'Top Trinity', subtitle: 'Top à rayures en viscose',
    description: 'Top fluide en viscose à rayures horizontales. Col rond, manches courtes. Coupe légèrement cintrée. Composition : 100% viscose.',
    price: 195.00, original_price: null, category: 'vetements', subcategory: 'tops',
    sizes: '["XS","S","M","L","XL"]', colors: '["Blanc","Marine","Beige"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Top Tendresse', subtitle: 'Rib Top avec col contrasté',
    description: 'Top en maille côtelée avec col contrasté. Ajusté, met en valeur la silhouette. Composition : 95% coton, 5% élasthanne.',
    price: 185.00, original_price: null, category: 'vetements', subcategory: 'tops',
    sizes: '["XS","S","M","L","XL","XXL"]', colors: '["Vert","Crème","Noir"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Blouse Lyric', subtitle: 'Blouse en soie naturelle',
    description: 'Blouse en soie naturelle fluide. Col V, boutonnage devant, manches longues avec poignets boutonnés. 100% soie.',
    price: 245.00, original_price: null, category: 'vetements', subcategory: 'tops',
    sizes: '["XS","S","M","L"]', colors: '["Ivoire","Blush","Noir"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  // ── Pulls & Gilets ───────────────────────────────────────────────────────
  {
    name: 'Pull Mira', subtitle: 'Pull en laine mérinos côtelé',
    description: 'Pull en laine mérinos doux côtelé. Col roulé, coupe ajustée. Très chaud et confortable. 100% laine mérinos.',
    price: 245.00, original_price: null, category: 'vetements', subcategory: 'pulls',
    sizes: '["XS","S","M","L","XL"]', colors: '["Camel","Ivoire","Noir","Bordeaux"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Gilet Doux', subtitle: 'Gilet long en mohair mélangé',
    description: 'Gilet long en mohair et soie. Coupe oversize, poches plaquées. Fermeture boutonnée.',
    price: 285.00, original_price: null, category: 'vetements', subcategory: 'gilets',
    sizes: '["XS/S","M/L","XL/XXL"]', colors: '["Rose poudré","Blanc cassé","Kaki"]',
    stock: 100, is_new: 0, is_sale: 0,
    image_url: IMG(),
  },
  // ── Pantalons & Jupes ────────────────────────────────────────────────────
  {
    name: 'Pantalon Wide', subtitle: 'Pantalon large à pinces',
    description: 'Pantalon taille haute à larges pinces. Coupe évasée, tissu fluide en viscose et lin.',
    price: 265.00, original_price: null, category: 'vetements', subcategory: 'pantalons',
    sizes: '["34","36","38","40","42"]', colors: '["Beige","Blanc","Noir","Camel"]',
    stock: 100, is_new: 0, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Bermuda Pollux', subtitle: 'Bermuda en cuir de chèvre',
    description: 'Bermuda taille haute en cuir de chèvre souple. Coupe droite, poches italiennes, fermeture zip.',
    price: 425.00, original_price: null, category: 'vetements', subcategory: 'pantalons',
    sizes: '["34","36","38","40","42","44"]', colors: '["Acajou","Noir","Cognac"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Jupe Maëva', subtitle: 'Jupe mi-longue en satin',
    description: 'Jupe midi taille haute en satin de polyester. Légèrement évasée, avec fente devant.',
    price: 215.00, original_price: 285.00, category: 'vetements', subcategory: 'jupes',
    sizes: '["XS","S","M","L","XL"]', colors: '["Champagne","Noir","Blush"]',
    stock: 100, is_new: 0, is_sale: 1,
    image_url: IMG(),
  },
  {
    name: 'Jupe Aurore', subtitle: 'Jupe plissée en mousseline',
    description: 'Jupe longue plissée en mousseline de soie. Taille élastiquée, très fluide, légère.',
    price: 195.00, original_price: null, category: 'vetements', subcategory: 'jupes',
    sizes: '["XS","S","M","L","XL"]', colors: '["Blanc","Rose pâle","Vert menthe"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  // ── Robes ────────────────────────────────────────────────────────────────
  {
    name: 'Robe Éclat', subtitle: 'Robe mi-longue en crêpe',
    description: 'Robe mi-longue en crêpe de viscose. Col V plongeant, ceinture à nouer, légèrement évasée.',
    price: 295.00, original_price: null, category: 'robes', subcategory: 'robes-mi-longues',
    sizes: '["XS","S","M","L","XL"]', colors: '["Noir","Terracotta","Vert sauge"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Robe Minuit', subtitle: 'Robe longue en velours',
    description: 'Robe longue en velours. Coupe droite légèrement évasée vers le bas. Bretelles fines ajustables.',
    price: 385.00, original_price: null, category: 'robes', subcategory: 'robes-longues',
    sizes: '["XS","S","M","L"]', colors: '["Noir","Bordeaux","Bleu nuit"]',
    stock: 100, is_new: 0, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Robe Dolce', subtitle: 'Robe courte en lin',
    description: 'Robe courte en lin et coton. Col chemise, boutonnage devant, ceinture à nouer.',
    price: 225.00, original_price: 320.00, category: 'robes', subcategory: 'robes-courtes',
    sizes: '["XS","S","M","L","XL"]', colors: '["Blanc","Kaki","Sable"]',
    stock: 100, is_new: 0, is_sale: 1,
    image_url: IMG(),
  },
  {
    name: 'Robe Céleste', subtitle: 'Robe portefeuille en crêpe',
    description: 'Robe portefeuille fluide en crêpe de viscose. Col V, ceinture à nouer, manches longues.',
    price: 255.00, original_price: null, category: 'robes', subcategory: 'robes-mi-longues',
    sizes: '["XS","S","M","L","XL"]', colors: '["Bleu canard","Ivoire","Vieux rose"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  // ── Manteaux & Vestes ────────────────────────────────────────────────────
  {
    name: 'Veste Vili', subtitle: 'Veste col ouvert nocturne',
    description: 'Veste en laine mélangée. Col ouvert, poches plaquées, doublée intérieur. Fermeture boutonnée.',
    price: 335.00, original_price: null, category: 'manteaux', subcategory: 'vestes',
    sizes: '["XS","S","M","L","XL"]', colors: '["Noir","Camel","Gris chiné"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Manteau Altitude', subtitle: 'Manteau long en laine bouclée',
    description: 'Grand manteau long en laine bouclée. Revers larges, poches à rabat, ceinture. Doublure en satin.',
    price: 595.00, original_price: null, category: 'manteaux', subcategory: 'manteaux',
    sizes: '["XS","S","M","L"]', colors: '["Écru","Camel","Noir"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Blouson Bobby', subtitle: 'Blouson teddy en laine nocturne',
    description: 'Blouson style teddy en laine bouclée. Col montant, fermeture zippée, poches zippées latérales.',
    price: 485.00, original_price: null, category: 'manteaux', subcategory: 'blousons',
    sizes: '["XS","S","M","L","XL"]', colors: '["Noir","Blanc cassé"]',
    stock: 100, is_new: 0, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Veste Amazone', subtitle: 'Veste en cuir grainé',
    description: 'Veste en cuir grainé de qualité supérieure. Col tailleur, fermeture boutonnée, poches intérieures.',
    price: 695.00, original_price: 895.00, category: 'manteaux', subcategory: 'vestes',
    sizes: '["XS","S","M","L"]', colors: '["Noir","Cognac"]',
    stock: 100, is_new: 0, is_sale: 1,
    image_url: IMG(),
  },
  // ── Accessoires ──────────────────────────────────────────────────────────
  {
    name: 'Sac Édith', subtitle: 'Sac à main structuré en cuir',
    description: 'Sac à main structuré en cuir veau souple. Deux anses, bandoulière amovible.',
    price: 345.00, original_price: null, category: 'accessoires', subcategory: 'sacs',
    sizes: '["Unique"]', colors: '["Noir","Camel","Blanc"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Ceinture Lara', subtitle: 'Ceinture en cuir tressé',
    description: 'Ceinture large en cuir tressé. Boucle dorée. Ajustable, plusieurs trous.',
    price: 95.00, original_price: null, category: 'accessoires', subcategory: 'ceintures',
    sizes: '["S/M","M/L","L/XL"]', colors: '["Noir","Cognac","Blanc"]',
    stock: 100, is_new: 0, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Foulard Soie', subtitle: 'Foulard en soie imprimé',
    description: 'Foulard carré en soie pure. Imprimé floral exclusif.',
    price: 145.00, original_price: null, category: 'accessoires', subcategory: 'foulards',
    sizes: '["90x90cm"]', colors: '["Fleuri multicolore","Géométrique bleu","Abstrait rouge"]',
    stock: 100, is_new: 1, is_sale: 0,
    image_url: IMG(),
  },
  {
    name: 'Chapeau Capri', subtitle: 'Chapeau de paille tressée',
    description: 'Chapeau à larges bords en paille naturelle tressée. Ruban en satin. Protection UV.',
    price: 125.00, original_price: 175.00, category: 'accessoires', subcategory: 'chapeaux',
    sizes: '["S/M","L/XL"]', colors: '["Naturel","Noir"]',
    stock: 100, is_new: 0, is_sale: 1,
    image_url: IMG(),
  },
];

products.forEach(p => db.products.insert(p));

// Adresse par défaut pour l'utilisateur test
db.addresses.insert({
  user_id: 2, type: 'shipping', first_name: 'Marie', last_name: 'Dupont',
  address: '12 rue de la Paix', address2: '', city: 'Paris',
  postal_code: '75001', country: 'France', is_default: 1,
});

console.log(`✓ ${products.length} produits insérés avec photos`);
console.log('✓ Utilisateurs : admin@elegance.fr / admin123 | user@test.fr / user123');
console.log('✓ Base de données JSON prête !');

