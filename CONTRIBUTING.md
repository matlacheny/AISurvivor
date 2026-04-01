
# Guide de Contribution - AI Survivor

Tout d'abord, merci de l'intérêt que vous portez à **AI Survivor** ! 
Que ce soit pour corriger un bug, ajouter une fonctionnalité, ou améliorer la documentation, toutes les contributions sont les bienvenues.

Ce document fournit les directives à suivre pour contribuer au projet de manière efficace.

---

## 🛠️ Comment contribuer ?

### 1. Signaler un Bug
Si vous trouvez un bug, veuillez vérifier s'il n'a pas déjà été signalé dans les [Issues](../../issues).
Si ce n'est pas le cas, ouvrez une nouvelle Issue en incluant :
* Un titre clair et descriptif.
* Les étapes exactes pour reproduire le bug.
* Le comportement attendu vs le comportement actuel.
* Des captures d'écran ou des logs si possible (erreurs dans la console du navigateur).

### 2. Suggérer une Fonctionnalité
Les idées d'améliorations (nouveaux personnages, boss, armes) sont géniales !
Ouvrez une Issue avec le tag `enhancement` et décrivez :
* Le concept détaillé de la fonctionnalité.
* Pourquoi elle serait utile au jeu.
* Si possible, des idées sur la manière de l'implémenter dans l'architecture actuelle (ex: "Ajouter l'ennemi dans `enemyData.js`").

---

## 💻 Processus de Développement (Pull Requests)

Si vous souhaitez écrire du code, merci de suivre ce workflow classique :

### Étape 1 : Préparer l'environnement
1. **Forkez** le dépôt sur votre compte GitHub.
2. **Clonez** votre fork localement : `git clone https://github.com/votre-pseudo/AISurvivor.git`
3. Installez les dépendances : `npm install`
4. Lancez le serveur local : `npm run dev`

### Étape 2 : Créer une branche
Ne travaillez jamais directement sur la branche `main`. Créez une branche avec une convention de nommage claire :
* Pour une nouvelle fonctionnalité : `feature/nom-de-la-fonctionnalite`
* Pour une correction de bug : `bugfix/nom-du-bug`
* Pour la documentation : `docs/mise-a-jour-readme`

```bash
git checkout -b feature/nouveau-personnage
```

### Étape 3 : Écrire le code
* Respectez l'architecture modulaire du projet (les données dans `/data/`, la logique dans `/manager/`).
* Utilisez la syntaxe **ES6+** (const/let, arrow functions, async/await).
* Assurez-vous qu'il n'y ait pas d'erreurs (warnings ou lint) dans la console de Vite.
* Si vous ajoutez des modèles 3D, passez toujours par le `AssetManager` plutôt que d'instancier directement.

### Étape 4 : Commiter les changements
Faites des commits atomiques (un commit = une idée/un changement logique) avec des messages clairs et descriptifs :
* ❌ *Mauvais :* "modifs" ou "fix bug"
* ✅ *Bon :* "feat: ajout du personnage Archer dans charactersData.js" ou "fix: correction du crash lors du spawn du boss"

### Étape 5 : Ouvrir une Pull Request (PR)
1. Poussez votre branche sur votre fork : `git push origin ma-branche`
2. Ouvrez une Pull Request sur le dépôt original.
3. Remplissez la description de la PR en expliquant vos changements et en liant l'Issue correspondante (ex: `Fixes #12`).

---

## 📏 Règles de Code (Guidelines)

Afin de garder le code propre et lisible, merci de respecter ces quelques règles :
* **Variables et Fonctions :** En anglais (`player`, `spawnBoss`, `updateGameplay`) et en *camelCase*.
* **Classes :** En *PascalCase* (`EnemyManager`, `Player`).
* **Fonctions privées :** Préfixées par un underscore (ex: `_handleSpawns()`).
* **Dépendances circulaires :** Faites attention à ne pas créer d'imports croisés (ex: `Player` qui importe `EnemyManager` pendant que `EnemyManager` importe `Player`). Utilisez les paramètres de méthodes pour passer les références.

---

Merci encore pour votre aide pour faire évoluer **AI Survivor** ! 🦇
