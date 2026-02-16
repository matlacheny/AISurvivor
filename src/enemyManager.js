import * as BABYLON from "@babylonjs/core";

export class EnemyManager {
    constructor(scene, shadowGenerator, player) {
        this.scene = scene;
        this.player = player;
        this.enemies = [];
        this.masterMesh = this._createMasterMesh();
        this.shadowGenerator = shadowGenerator;

        // On n'utilise plus Date.now() pour le scaling, mais le gameTime du main
        this.spawnTimer = 0;
    }

    _createMasterMesh() {
        const master = BABYLON.MeshBuilder.CreateBox("enemyMaster", {size: 1.2}, this.scene);
        const mat = new BABYLON.StandardMaterial("enemyMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
        mat.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
        master.material = mat;
        master.isVisible = false;
        return master;
    }

    // On passe gameTime ici pour ajuster les HP
    spawn(gameTime) {
        const enemy = this.masterMesh.createInstance("enemy_" + Date.now() + Math.random());
        enemy.uniqueId = Date.now() + "_" + Math.random();

        const angle = Math.random() * Math.PI * 2;
        const radius = 35;
        enemy.position.x = this.player.mesh.position.x + Math.cos(angle) * radius;
        enemy.position.z = this.player.mesh.position.z + Math.sin(angle) * radius;
        enemy.position.y = 0.6;

        // --- SCALING HP ---
        // 10 PV de base + 10 PV par minute de jeu
        // Exemple : à 10 min, les ennemis ont 110 PV
        const scaledHp = 10 + Math.floor(gameTime / 6);

        enemy.maxHp = scaledHp;
        enemy.hp = scaledHp;

        this.shadowGenerator.addShadowCaster(enemy);
        this.enemies.push(enemy);
    }


    update(gameTime) {
        // 1. CALCUL DE LA DIFFICULTÉ
        // Au départ : intervalle de 60 frames (1 sec)
        // On réduit l'intervalle de 0.2 par seconde de jeu
        // Minimum : 8 frames (c'est très rapide !)
        let spawnInterval = Math.max(8, 60 - (gameTime * 0.2));

        // 2. TIMER D'APPARITION
        this.spawnTimer++;
        if (this.spawnTimer >= spawnInterval) {

            // 3. TAILLE DES VAGUES (HORDES)
            // Par défaut 1 ennemi à la fois
            let batchSize = 1;

            // Après 2 minutes (120s), on en fait pop 2 à la fois
            if (gameTime > 120) batchSize = 2;
            // Après 5 minutes (300s), on en fait pop 3 à la fois
            if (gameTime > 300) batchSize = 3;
            // Après 10 minutes, c'est l'enfer (5 à la fois)
            if (gameTime > 600) batchSize = 5;

            // On lance la boucle de spawn
            for(let k = 0; k < batchSize; k++) {
                this.spawn(gameTime);
            }

            this.spawnTimer = 0;
        }

        // Mouvement et Nettoyage
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const direction = this.player.mesh.position.subtract(enemy.position).normalize();

            // Les ennemis accélèrent aussi un tout petit peu avec le temps (max +50% vitesse)
            const speedBonus = Math.min(0.06, gameTime * 0.0001);
            const speed = 0.12 + speedBonus;

            enemy.position.addInPlace(direction.scale(speed));
            enemy.rotation.y += 0.05;

            if (BABYLON.Vector3.Distance(this.player.mesh.position, enemy.position) > 60) {
                enemy.dispose();
                this.enemies.splice(i, 1);
            }
        }
    }

    takeDamage(index, amount) {
        const enemy = this.enemies[index];
        if(!enemy) return false;

        enemy.hp -= amount;
        enemy.scaling = new BABYLON.Vector3(1.4, 1.4, 1.4);
        setTimeout(() => { if(enemy) enemy.scaling = new BABYLON.Vector3(1, 1, 1); }, 100);

        if (enemy.hp <= 0) {
            this.removeEnemy(index);
            return true;
        }
        return false;
    }

    removeEnemy(index) {
        if(this.enemies[index]) {
            this.enemies[index].dispose();
            this.enemies.splice(index, 1);
        }
    }
}