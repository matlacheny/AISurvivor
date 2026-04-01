# AI Survivor

Projet de Games On Web 2026 (Mattéo Lacheny, Thibault Labarthe)
Un jeu de survie en arène 3D inspiré du célèbre *Vampire Survivors*, développé en JavaScript natif avec **Babylon.js** et propulsé par **Vite**. Survivez à des hordes d'ennemis, affrontez des boss redoutables, et créez le build ultime pour triompher !

## ✨ Fonctionnalités

* **Action Frénétique en 3D :** Déplacez-vous librement dans des environnements en 3D avec une gestion dynamique des collisions et des ombres.
* **Personnages Uniques :**
    * 🛡️ **Personnage 1 :** Possède une aura sacrée infligeant des dégâts de zone constants.
    * ⚡ **Personnage 2 :** Accompagné d'un familier foudroyant l'ennemi le plus proche.
    * 🩸 **Personnage 3 :** Draine la force vitale des ennemis vaincus pour se soigner.
* **Bestiaire Varié :** Affrontez des ennemis standards, des coureurs rapides, des tanks robustes et des artilleurs attaquant à distance.
* **Combats de Boss :** Un boss majeur apparaît toutes les 5 minutes (Roi Gluant, Le Broyeur, Champion Déchu, etc.).
* **Modes de Jeu :**
    * 📖 **Histoire :** Survivez à 3 boss pour débloquer et passer à l'arène suivante.
    * ♾️ **Endless :** Difficulté infinie avec scaling des statistiques des ennemis et des boss.
* **Système d'Améliorations :** Gagnez de l'XP en ramassant des gemmes et choisissez parmi une variété d'armes et d'objets passifs à chaque montée de niveau.

## 🛠️ Technologies Utilisées

* **Moteur 3D :** [Babylon.js](https://www.babylonjs.com/) (`@babylonjs/core`, `@babylonjs/loaders`)
* **Bundler :** [Vite](https://vitejs.dev/)
* **Langages :** JavaScript (ES6+), HTML5, CSS3

## 🚀 Installation et Lancement

Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé sur votre machine.

1. **Cloner le dépôt :**
   ```bash
   git clone [https://github.com/matlacheny/AISurvivor.git](https://github.com/matlacheny/AISurvivor.git)
   cd AISurvivor
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```

4. Ouvrez votre navigateur à l'adresse indiquée par Vite (généralement `http://localhost:5173/`).

## 🎮 Contrôles

* **Z, Q, S, D** ou **W, A, S, D** : Se déplacer
* **Attaque** : Automatique (Gérée par le système de projectiles)
* **P** : Mettre le jeu en pause
* **G** : God Mode (Activable/Désactivable pour les tests)

## 📁 Architecture du Projet

Le projet suit une architecture modulaire et orientée objet pour garantir un code propre et évolutif :

* `/data/` : Contient les données statiques (Bestiaire, Boss, Personnages, Armes).
* `/manager/` : Gère la logique interne du jeu.
    * `enemyManager.js` : Spawns, comportements de horde et tirs.
    * `projectileManager.js` : Gestion des armes du joueur.
    * `xpManager.js` : Apparition et collecte des gemmes.
    * `assetManager.js` : Pré-chargement des modèles 3D (prêt pour le GLTF/GLB).
* `player.js` : Contrôles, statistiques, limites d'arène et passifs uniques.
* `main.js` : Boucle de rendu (Render Loop), menus et état global du jeu.
* `ui.js` : Interface utilisateur (HUD, Barres de vie, Écrans de fin).

## 🔮 Fonctionnalités à venir (Roadmap)

- [ ] Optimisation des fonctionalités graphiques.
- [ ] Système de Leaderboard local (sauvegarde des meilleurs scores et temps).
- [ ] Ajout d'effets sonores et de musiques d'ambiance.
- [ ] Nouvelles évolutions d'armes et synergies.

## 📜 Crédits & Ressources

Un grand merci aux créateurs de ces ressources qui ont permis de donner vie au jeu :

**Modèles 3D (Robots) :**
* [CNF Model A | Walker Detection Robot](https://sketchfab.com/3d-models/cnf-model-a-walker-detection-robot-286b9d5997ce4d37816b735720390b01) par *cherryslugeater* (Sketchfab)
* [Voxel Armored Guard Robot](https://sketchfab.com/3d-models/voxel-armored-guard-robot-4e3e9de83ea74dae9598b4dd47ada072) par *THE_O_NAME* (Sketchfab)
* [CNF Model B1 | Crawler Grenade Launcher](https://sketchfab.com/3d-models/cnf-model-b1-crawler-grenade-launcher-bc58919639744ffdb3a6e0fae7d7688d) par *cherryslugeater* (Sketchfab)

**Textures :**
* [Sable (Sand desert dune tile)](https://opengameart.org/content/sand-desert-dune-tile) par *kbmsfx* (OpenGameArt)
* [Pierre (Blocs de pierre cubique)](https://fr.123rf.com/photo_184917445_blocs-de-pierre-de-roche-grise-cubique-de-gravats-ou-de-galets-de-gravier-arrière-plan-vectoriel-pix.html) par *seamartini* (123RF)
* [Sol Plaine (Cubic black coal blocks)](https://www.colourbox.com/vector/cubic-black-coal-blocks-pixel-background-pattern-vector-56538519) par *VectorTradition* (Colourbox)

---
*Développé avec passion.*
