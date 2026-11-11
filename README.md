# Maison Créange : nouveau site vitrine

Site statique (HTML, CSS, JavaScript) avec GSAP + ScrollTrigger embarqués localement.
Aucun service externe n'est chargé sans action du visiteur : polices auto-hébergées, carte Google Maps soumise à consentement.

## Arborescence

```
site/                      ← dossier à mettre en ligne tel quel (racine du domaine)
  index.html               Accueil
  a-propos-de-nous/        À propos de nous   (mêmes URL que l'ancien site)
  contactez-nous/          Contactez-nous
  avis-juridique/          Avis juridique
  404.html
  assets/css/main.css      styles (palette et typographies en variables CSS)
  assets/js/main.js        intro (cravate nouée), cravate compagnon, scènes immersives, animations, formulaire, carte
  assets/img/              photos du site actuel, en WebP + JPEG (640 / 1100 / 1600 px)
                           cut-*.webp : produits détourés (transparence) · detail-*.webp : gros plans
  assets/fonts/            Cormorant Garamond + Manrope (woff2, aussi intégrées dans main.css pour fonctionner hors serveur)
  assets/vendor/           GSAP 3.12.5 + ScrollTrigger
src/                       ← sources des pages (en-tête, pied de page et formulaire partagés)
build.mjs                  assemble src/ → site/
```

## Modifier une page

1. Éditer le fichier dans `src/pages/` ou `src/partials/`.
2. `node build.mjs` (Node 18 ou plus récent).
3. Les CSS/JS se modifient directement dans `site/assets/`.

Les produits détourés s'insèrent avec `{{cut name="cut-chemise" alt="…" sizes="…"}}`.

Les photos s'insèrent avec `{{img name="facade-boutique" alt="…" sizes="…"}}` ; le script génère le `<picture>` WebP/JPEG responsive avec lazy loading.

## Prévisualiser

```
cd site
python -m http.server 8080      # ou : npx serve .
```
puis ouvrir http://localhost:8080. On peut aussi double-cliquer sur site/index.html (le formulaire ne s'envoie alors pas, faute de serveur).

## Formulaire de contact : à activer une fois

Le formulaire envoie réellement le message par courriel via **FormSubmit** (https://formsubmit.co), sans serveur à gérer.

- Au **premier envoi**, FormSubmit envoie un courriel d'activation à `creangeexclusif@hotmail.fr`. Il faut cliquer sur le lien une seule fois ; tant que ce n'est pas fait, le site affiche le message d'erreur (jamais de fausse confirmation).
- Pour utiliser un autre service (Web3Forms, Formspree, un script PHP chez l'hébergeur…), changer l'attribut `action` du formulaire dans `src/partials/contact-block.html`. Le script considère l'envoi réussi uniquement si la réponse est HTTP 2xx avec `"success": true`.
- Champs : Nom (obligatoire), Courriel (obligatoire, ajouté pour pouvoir répondre), Téléphone (facultatif), Message, case de consentement (obligatoire, texte d'origine conservé). Un champ piège anti-robots est inclus.

## Expérience immersive (page d'accueil)

Sept scènes enchaînées au défilement (GSAP ScrollTrigger, scènes « collées » en `position: sticky`) :
01 Entrée (on franchit la vitrine) · 02 Costumes (la veste quitte le portant, détails au survol) · 03 Chemises (la chemise glisse de l'étagère, loupes col et poignet) · 04 Accessoires (la cravate tombe et oscille) · 05 Chaussures (sur socle, rotation légère, balayage de lumière) · 06 Savoir-faire (retouches, cérémonie) · 07 Maison (1875, chiffres, contact, carte).

- Les timelines sont dans la fonction `scenes()` de main.js ; chaque scène a sa hauteur de défilement dans main.css (`.scene`).
- Une cravate « compagnon » suit la lecture sur ordinateur, avec une physique de pendule pilotée par la vitesse de défilement. Elle s'efface au-dessus des photos et compositions (`data-companion="off"` sur une section).
- Mobile (≤ 900 px) : la même narration que sur ordinateur, recomposée en portrait. Les scènes restent collantes (CSS `position: sticky`, aucun blocage du défilement tactile) et chaque timeline a ses distances et tailles mobiles (`ctx.conditions.mob` dans `scenes()`). Téléphone à l'horizontale : façade à gauche, texte à droite.
- Sans animation (préférence « réduire les animations » ou script indisponible) : lecture en flux, tout le contenu visible.

## Direction artistique « luxe sombre »

- Palette (variables en tête de main.css) : bleu marine #101F36, bleu nuit #172943, vert profond #123D32, vert sombre #0B241E, noir charbon #111111, or vieilli #98763D, blanc cassé #F2EFE7.
- Les sections ne sont jamais des aplats : chaque scène a une couleur de bord (`--edge-top`, `--edge-bot`) identique à celle de la section voisine, ce qui crée des fondus marine → vert → charbon.
- L'or est réservé aux filets, puces, soulignements et à quelques chiffres. Les petits textes restent en blanc cassé pour la lisibilité.
- Un grain photographique très léger (SVG inline) donne de la matière aux fonds.
- Section savoir-faire : portrait éditorial (`homme-costume-bleu`) et trois gros plans recadrés (`atelier-*.webp`) tirés des photos existantes.
- Pas de Three.js : aucun modèle 3D fidèle des produits n'existe, une 3D approximative ferait moins réel que les photos.

## Accessibilité et performance

- `prefers-reduced-motion` : pas d'intro, pas de scènes animées ni de parallaxe ; tout le contenu est visible immédiatement.
- Navigation clavier, lien d'évitement, focus visible, menu mobile avec Échap et focus piégé.
- Sans JavaScript, toutes les pages restent lisibles et complètes.
- Données structurées `ClothingStore` (schema.org), balises Open Graph, `sitemap.xml`, `robots.txt`.
