# PLATEAU

Carnet de musculation personnel. PWA autonome, installée sur iPhone
via l'écran d'accueil. Les données d'entraînement restent en local sur le
téléphone (seule la connexion Spotify, optionnelle, communique avec Spotify).

**En ligne :** https://yakupovic.github.io/plateau/

## Comment ça marche

- React 18 en UMD, **vendoré** (`react.js`, `react-dom.js`) — pas de CDN, l'app
  doit fonctionner sans réseau à la salle.
- `src/app.jsx` est **la seule source à éditer**. Elle est compilée en JS pur
  vers `app.js` (pas de Babel dans le navigateur : trop lent sur iPhone).
- Tailwind est compilé en statique dans `app.css` (~10 Ko, classes utilisées
  seulement). Pas de CDN Tailwind.
- Les données vivent dans `localStorage` derrière une petite API `window.storage`
  définie en inline dans `index.html`.
- `sw.js` met tout en cache : l'app est utilisable hors ligne.

## Développer

```bash
npm install
node build.mjs --bump   # compile app.js + app.css, et invalide le cache
node check.mjs          # monte l'app dans un DOM simulé : à lancer AVANT de pousser
```

Puis commit + push sur `main` : GitHub Pages redéploie tout seul (~1 min).

## Pièges à connaître (appris à la dure)

1. **Babel doit être en `runtime: "classic"`.** En mode automatique il génère un
   `import { jsx } from "react/jsx-runtime"` que Safari refuse → écran de
   chargement figé, sans message d'erreur. `build.mjs` vérifie et échoue si un
   `import` traîne dans le bundle.
2. **Toujours `--bump` après une modif**, sinon le service worker sert l'ancienne
   version et Yakup ne voit pas le changement.
3. **Lancer `check.mjs` avant de pousser.** Une erreur JS au montage donne un
   écran vide : `index.html` affiche alors le message d'erreur, mais autant ne
   pas en arriver là.
4. **Pas d'appel à l'API Anthropic.** Le coach IA a été retiré volontairement
   (l'app est hors de Claude, pas de clé API). Le bouton « Copier mon contexte »
   copie l'historique à coller dans une conversation Claude.
5. **Pas de notification, pas de vibration, pas de widget.** Limites d'iOS pour
   les apps web installées. Le chrono bipe en audio, écran allumé.

## Contenu de l'app

Onglets : Accueil, Séance, Récup, Historique, Progression.

Séance : plan dérivé de la dernière séance du même nom, mode série par série avec
écran plein écran (chrono en boucle), chrono de repos avec bip, photos de
machines, schémas de mouvement SVG + fiches technique, repères de force calculés
sur le poids de corps, détection de plateau, saisie cardio (durée/distance),
alerte de volume au-delà de 18 puis 24 séries.

Récup : sommeil, alimentation, douche post-séance, poids de corps, mensurations.

Progression : courbes par exercice, poids de corps, mensurations, volume par
groupe musculaire avec cibles, mur des records, objectifs par exercice, 1RM estimé.

Données : sauvegarde auto en local, export/import JSON, copie du contexte pour Claude.
