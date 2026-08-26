# HUMIDOR

HUMIDOR est une application web progressive (PWA) pour suivre les stocks et la collection de cigares dans un humidor, et tenir un carnet de dégustation.

## Fonctionnalités
- Gestion des cigares dans l'humidor (ajout, édition, suppression, détail)
- Carnet de dégustation
- PWA : `manifest.json` et `service-worker.js` pour fonctionnement hors ligne (cache de l'app shell)

## Prérequis
- Navigateur moderne (support des Service Workers et PWA)
- Serveur HTTP pour servir les fichiers (le service worker ne fonctionne pas via le protocole `file://`)

## Exécution locale (rapide)
1. Cloner le dépôt :
   ```bash
   git clone https://github.com/Ada-Coder31/Humidor-d-Ada.git
   ```
2. Se rendre dans le dossier du projet :
   ```bash
   cd Humidor-d-Ada
   ```
3. Lancer un serveur HTTP simple (exemples) :
   - Python 3 : `python3 -m http.server 8080`
   - Node (live-server) : `npx live-server --port=8080`
4. Ouvrir http://localhost:8080 dans le navigateur.

## Notes sur la PWA & hors-ligne
- Le manifeste (`manifest.json`) et les icônes se trouvent à la racine (`/icons`).
- Le service worker (`service-worker.js`) implémente une stratégie "cache-first" pour l'app shell. Pour forcer la mise à jour du cache, incrémentez la constante `CACHE_NAME` dans `service-worker.js`.
- Le service worker nécessite HTTPS en production (localhost est autorisé en développement).

## Déploiement
- GitHub Pages : activer Pages depuis la branche `main` (source: racine) ou utiliser une action GH Pages.
- Netlify / Vercel / Surge : déployer le dossier racine (site statique). Assurez-vous que le site est servi via HTTPS.
- Si vous avez un build step (outil front-end), adaptez la configuration de déploiement selon votre pipeline.

## Conseils de debug
- Outils DevTools → Application pour inspecter le manifeste, les Service Workers et le cache.
- Pour tester hors-ligne : ouvrir DevTools → Network → Offline, puis recharger la page.

## Licence et contact
- Ajoutez ici la licence souhaitée (ex. MIT) et les informations de contact/mainteneur.
