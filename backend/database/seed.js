require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Seeding base de données PostgreSQL...');

  // Vider les tables
  await query('TRUNCATE users, products, cart_items, orders, order_items, addresses, wishlist RESTART IDENTITY CASCADE');

  // Utilisateurs
  await query(
    'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES ($1,$2,$3,$4,$5,$6),($7,$8,$9,$10,$11,$12)',
    ['admin@elegance.fr', bcrypt.hashSync('admin123', 10), 'Admin', 'Élégance', '', 'admin',
     'user@test.fr',  bcrypt.hashSync('user123',  10), 'Marie', 'Dupont', '06 12 34 56 78', 'user']
  );

  // Produits (image_url = null par défaut, à ajouter via admin)
  const products = [
    ['Top Trinity',      'Top à rayures en viscose',        'Top fluide en viscose à rayures horizontales. Col rond, manches courtes. Coupe légèrement cintrée. Composition : 100% viscose.',   195.00, null,   'vetements', 'tops',      '["XS","S","M","L","XL"]',       '["Blanc","Marine","Beige"]',    100, 1, 0],
    ['Top Tendresse',    'Rib Top avec col contrasté',       'Top en maille côtelée avec col contrasté. Ajusté, met en valeur la silhouette. Composition : 95% coton, 5% élasthanne.',          185.00, null,   'vetements', 'tops',      '["XS","S","M","L","XL","XXL"]', '["Vert","Crème","Noir"]',       100, 1, 0],
    ['Blouse Lyric',     'Blouse en soie naturelle',         'Blouse en soie naturelle fluide. Col V, boutonnage devant, manches longues avec poignets boutonnés. 100% soie.',                  245.00, null,   'vetements', 'tops',      '["XS","S","M","L"]',            '["Ivoire","Blush","Noir"]',     100, 1, 0],
    ['Pull Mira',        'Pull en laine mérinos côtelé',     'Pull en laine mérinos doux côtelé. Col roulé, coupe ajustée. Très chaud et confortable. 100% laine mérinos.',                    245.00, null,   'vetements', 'pulls',     '["XS","S","M","L","XL"]',       '["Camel","Ivoire","Noir","Bordeaux"]', 100, 1, 0],
    ['Gilet Doux',       'Gilet long en mohair mélangé',     'Gilet long en mohair et soie. Coupe oversize, poches plaquées. Fermeture boutonnée.',                                            285.00, null,   'vetements', 'gilets',    '["XS/S","M/L","XL/XXL"]',       '["Rose poudré","Blanc cassé","Kaki"]', 100, 0, 0],
    ['Pantalon Wide',    'Pantalon large à pinces',          'Pantalon taille haute à larges pinces. Coupe évasée, tissu fluide en viscose et lin.',                                            265.00, null,   'vetements', 'pantalons', '["34","36","38","40","42"]',     '["Beige","Blanc","Noir","Camel"]', 100, 0, 0],
    ['Bermuda Pollux',   'Bermuda en cuir de chèvre',        'Bermuda taille haute en cuir de chèvre souple. Coupe droite, poches italiennes, fermeture zip.',                                  425.00, null,   'vetements', 'pantalons', '["34","36","38","40","42","44"]','["Acajou","Noir","Cognac"]',    100, 1, 0],
    ['Jupe Maëva',       'Jupe mi-longue en satin',          'Jupe midi taille haute en satin de polyester. Légèrement évasée, avec fente devant.',                                            215.00, 285.00, 'vetements', 'jupes',     '["XS","S","M","L","XL"]',       '["Champagne","Noir","Blush"]',  100, 0, 1],
    ['Jupe Aurore',      'Jupe plissée en mousseline',       'Jupe longue plissée en mousseline de soie. Taille élastiquée, très fluide, légère.',                                             195.00, null,   'vetements', 'jupes',     '["XS","S","M","L","XL"]',       '["Blanc","Rose pâle","Vert menthe"]', 100, 1, 0],
    ['Robe Éclat',       'Robe mi-longue en crêpe',          'Robe mi-longue en crêpe de viscose. Col V plongeant, ceinture à nouer, légèrement évasée.',                                      295.00, null,   'robes',     'robes-mi-longues', '["XS","S","M","L","XL"]', '["Noir","Terracotta","Vert sauge"]', 100, 1, 0],
    ['Robe Minuit',      'Robe longue en velours',           'Robe longue en velours. Coupe droite légèrement évasée vers le bas. Bretelles fines ajustables.',                               385.00, null,   'robes',     'robes-longues', '["XS","S","M","L"]',       '["Noir","Bordeaux","Bleu nuit"]', 100, 0, 0],
    ['Robe Dolce',       'Robe courte en lin',               'Robe courte en lin et coton. Col chemise, boutonnage devant, ceinture à nouer.',                                                 225.00, 320.00, 'robes',     'robes-courtes', '["XS","S","M","L","XL"]',  '["Blanc","Kaki","Sable"]',      100, 0, 1],
    ['Robe Céleste',     'Robe portefeuille en crêpe',       'Robe portefeuille fluide en crêpe de viscose. Col V, ceinture à nouer, manches longues.',                                        255.00, null,   'robes',     'robes-mi-longues', '["XS","S","M","L","XL"]', '["Bleu canard","Ivoire","Vieux rose"]', 100, 1, 0],
    ['Veste Vili',       'Veste col ouvert nocturne',        'Veste en laine mélangée. Col ouvert, poches plaquées, doublée intérieur. Fermeture boutonnée.',                                  335.00, null,   'manteaux',  'vestes',    '["XS","S","M","L","XL"]',       '["Noir","Camel","Gris chiné"]', 100, 1, 0],
    ['Manteau Altitude', 'Manteau long en laine bouclée',    'Grand manteau long en laine bouclée. Revers larges, poches à rabat, ceinture. Doublure en satin.',                               595.00, null,   'manteaux',  'manteaux',  '["XS","S","M","L"]',            '["Écru","Camel","Noir"]',       100, 1, 0],
    ['Blouson Bobby',    'Blouson teddy en laine nocturne',  'Blouson style teddy en laine bouclée. Col montant, fermeture zippée, poches zippées latérales.',                                 485.00, null,   'manteaux',  'blousons',  '["XS","S","M","L","XL"]',       '["Noir","Blanc cassé"]',        100, 0, 0],
    ['Veste Amazone',    'Veste en cuir grainé',             'Veste en cuir grainé de qualité supérieure. Col tailleur, fermeture boutonnée, poches intérieures.',                             695.00, 895.00, 'manteaux',  'vestes',    '["XS","S","M","L"]',            '["Noir","Cognac"]',             100, 0, 1],
    ['Sac Édith',        'Sac à main structuré en cuir',     'Sac à main structuré en cuir veau souple. Deux anses, bandoulière amovible.',                                                    345.00, null,   'accessoires','sacs',     '["Unique"]',                    '["Noir","Camel","Blanc"]',      100, 1, 0],
    ['Ceinture Lara',    'Ceinture en cuir tressé',          'Ceinture large en cuir tressé. Boucle dorée. Ajustable, plusieurs trous.',                                                        95.00, null,   'accessoires','ceintures', '["S/M","M/L","L/XL"]',          '["Noir","Cognac","Blanc"]',     100, 0, 0],
    ['Foulard Soie',     'Foulard en soie imprimé',          'Foulard carré en soie pure. Imprimé floral exclusif.',                                                                           145.00, null,   'accessoires','foulards',  '["90x90cm"]',                   '["Fleuri multicolore","Géométrique bleu","Abstrait rouge"]', 100, 1, 0],
    ['Chapeau Capri',    'Chapeau de paille tressée',        'Chapeau à larges bords en paille naturelle tressée. Ruban en satin. Protection UV.',                                             125.00, 175.00, 'accessoires','chapeaux',  '["S/M","L/XL"]',                '["Naturel","Noir"]',            100, 0, 1],
  ];

  for (const p of products) {
    await query(
      `INSERT INTO products (name,subtitle,description,price,original_price,category,subcategory,sizes,colors,stock,is_new,is_sale,images,image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'[]',null)`,
      p
    );
  }

  // Adresse par défaut pour l'utilisateur test
  await query(
    'INSERT INTO addresses (user_id,type,first_name,last_name,address,address2,city,postal_code,country,is_default) VALUES (2,$1,$2,$3,$4,$5,$6,$7,$8,$9)',
    ['shipping','Marie','Dupont','12 rue de la Paix','','Paris','75001','France',1]
  );

  console.log(`✓ ${products.length} produits insérés`);
  console.log('✓ Utilisateurs : admin@elegance.fr / admin123 | user@test.fr / user123');
  console.log('✓ Base PostgreSQL (Neon) prête !');
  process.exit(0);
}

seed().catch(err => { console.error('Erreur seed:', err); process.exit(1); });
