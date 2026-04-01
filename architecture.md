
# 🏗️ Architecture du Projet - AI Survivor

Ce document détaille l'architecture logicielle de **AI Survivor**. Le projet a été conçu selon les principes de la **Programmation Orientée Objet (POO)**, en favorisant une approche modulaire pour séparer la logique de jeu, le rendu 3D, les données statiques et l'interface utilisateur.

---

## 📂 Arborescence du Projet

L'application est découpée en plusieurs dossiers logiques :

```text
/ (Racine du projet)
├── index.html              # Point d'entrée HTML
├── style.css               # Styles CSS (UI, Menus)
├── package.json            # Dépendances (Vite, Babylon.js)
├── main.js                 # Point d'entrée principal (Boucle de jeu, États)
├── player.js               # Logique de l'entité Joueur
├── sceneSetup.js           # Configuration initiale de la scène Babylon.js
├── ui.js                   # Gestion du DOM (HUD, Menus de fin)
│
├── /manager/               # Cœur de la logique métier (Contrôleurs)
│   ├── arenaManager.js     # Gestion de l'environnement et du sol
│   ├── assetManager.js     # Chargement et mise en cache des modèles 3D
│   ├── cinematicManager.js # Séquences d'introduction
│   ├── enemyManager.js     # Cycle de vie des ennemis et boss
│   ├── projectileManager.js# Gestion des tirs, armes et collisions
│   ├── upgradeManager.js   # Système de montée en niveau et choix d'items
│   └── xpManager.js        # Gestion du loot (gemmes d'expérience)
│   
└── /data/                  # Configuration et Data-Driven Design
    ├── bossData.js         # Stats et comportements des boss
    ├── charactersData.js   # Héros jouables et passifs uniques
    ├── enemyData.js        # Archétypes d'ennemis normaux
    └── itemsData.js        # Armes, passifs et évolutions
```

---

## ⚙️ Modèles d'Architecture Utilisés

### 1. Data-Driven Design (Séparation Logique / Données)
Toutes les statistiques d'équilibrage (points de vie, vitesse, probabilités de spawn) sont extraites du code source et isolées dans le dossier `/data/`.
* **Avantage :** Permet d'ajouter un nouveau monstre ou une nouvelle arme en modifiant un simple objet JSON, sans risquer de casser la logique du code dans les managers.

### 2. Pattern "Manager" (Responsabilité Unique)
La logique du jeu n'est pas codée dans un seul fichier géant. Elle est divisée en "Managers", chacun ayant une responsabilité stricte (SRP - *Single Responsibility Principle*) :
* `EnemyManager` ne gère *que* l'apparition, le déplacement et la mort des ennemis.
* `XpManager` ne s'occupe *que* de faire apparaître les gemmes et de vérifier si le joueur les ramasse.
* **Avantage :** Rend le débogage beaucoup plus simple et évite le code "plat de spaghettis".

### 3. Évitement des Dépendances Circulaires
Pour éviter que les fichiers ne s'importent mutuellement à l'infini (ex: `Player` importe `EnemyManager`, qui importe `Player`), le projet utilise **l'injection de dépendances via les méthodes d'update**.
* Au lieu d'importer la classe, `main.js` instancie les objets et les transmet au moment voulu : `player.update(enemyManager)`.

---

## 🔄 Flux d'Exécution (Game Loop)

Le cœur battant du jeu se trouve dans `main.js`, qui orchestre la scène grâce à la boucle de rendu de Babylon.js (`scene.onBeforeRenderObservable`).

Le cycle d'une frame (exécuté ~60 fois par seconde) fonctionne ainsi :

1. **Vérification de l'état global** (`gameState`) : Menu, Cinématique, ou Jeu en cours.
2. **Phase de pause** : Si le joueur ouvre un menu ou met le jeu en pause, la logique est court-circuitée.
3. **Mise à jour des Managers (Update) :**
    * `player.update()` : Mouvements, limites d'arène, invincibilité, passifs uniques.
    * `enemyManager.update()` : Apparition des vagues, déplacement des IA, tirs ennemis.
    * `projectileManager.update()` : Déplacement des balles du joueur, vérification des collisions avec les ennemis.
    * `xpManager.update()` : Attraction magnétique des gemmes vers le joueur.
    * `arenaManager.update()` : Ajustement du sol infini.
4. **Mise à jour de la Caméra :** Suit la position calculée du joueur.
5. **Gestion Globale :** Vérification des conditions de mort (Game Over) et mise à jour de l'Interface Utilisateur (HUD) via `ui.js`.

---

## 🎨 Asset Manager (Ressources 3D)

La classe `AssetManager` a été conçue pour optimiser les performances.
Plutôt que de demander au moteur 3D de charger un fichier `.glb` ou de construire une géométrie à chaque fois qu'un ennemi apparaît, l'`AssetManager` :
1. Pré-charge **une seule fois** tous les modèles "Maîtres" au lancement de l'application de façon asynchrone (`loadAll()`).
2. Masque ces modèles (`isVisible = false`).
3. Fournit ces modèles aux autres classes qui utilisent la méthode `.clone()` ou `.createInstance()` pour générer les entités affichées à l'écran, coûtant très peu en ressources (Draw Calls optimisés).
