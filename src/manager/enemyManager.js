import * as BABYLON from "@babylonjs/core";
import { BOSSES } from '../data/bossData.js';

export class EnemyManager {
    constructor(scene, shadowGenerator, player) {
        this.scene = scene;
        this.player = player;
        this.shadowGenerator = shadowGenerator;

        this.enemies = [];
        this.masterMesh = this._createMasterMesh();

        // Configuration de la partie
        this.currentArenaId = "infinite";
        this.gameMode = "ENDLESS"; // "STORY" ou "ENDLESS"
        this.onBossDefeated = null; // Callback pour prévenir le main.js

        // Gestion des Boss
        this.nextBossTime = 30;
        this.bossSpawned = false;
        this.activeBoss = null;
        this.bossIndex = 0;
        this.loopCount = 0; // Compte le nombre de fois qu'on a fait les 3 boss (Mode Endless)

        this.spawnTimer = 0;
    }

    setCurrentArena(arenaId) {
        this.currentArenaId = arenaId;
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

    spawnBoss() {
        if(this.bossSpawned) return;
        this.bossSpawned = true;

        const arenaBosses = BOSSES[this.currentArenaId] || BOSSES["infinite"];
        const currentBossIndex = Math.min(this.bossIndex, arenaBosses.length - 1);
        const baseBossData = arenaBosses[currentBossIndex];

        console.log(`⚠️ SPAWN BOSS: ${baseBossData.name} (Loop: ${this.loopCount}) ⚠️`);

        const bossMesh = this.masterMesh.clone("BOSS_" + baseBossData.name);
        bossMesh.isVisible = true;

        bossMesh.position = this.player.mesh.position.clone();
        bossMesh.position.z += 40;
        bossMesh.position.y = baseBossData.scale / 2;

        bossMesh.scaling = new BABYLON.Vector3(baseBossData.scale, baseBossData.scale, baseBossData.scale);

        const bossMat = new BABYLON.StandardMaterial("bossMat", this.scene);
        bossMat.diffuseColor = baseBossData.color;
        bossMat.emissiveColor = baseBossData.color.scale(0.4);
        bossMesh.material = bossMat;

        // --- SCALING ENDLESS ---
        // Chaque boucle augmente les PV et les dégâts du boss de 100%
        const scaleMult = 1 + (this.loopCount * 1.0);
        const actualHp = baseBossData.hp * scaleMult;
        const actualDamage = baseBossData.damage * scaleMult;

        bossMesh.uniqueId = "BOSS_" + Date.now();
        bossMesh.hp = actualHp;
        bossMesh.maxHp = actualHp;
        bossMesh.damage = actualDamage;
        bossMesh.speed = baseBossData.speed;
        bossMesh.isBoss = true;
        bossMesh.name = baseBossData.name + (this.loopCount > 0 ? ` +${this.loopCount}` : "");
        bossMesh.xpValue = baseBossData.dropXp * scaleMult;

        this.shadowGenerator.addShadowCaster(bossMesh);
        this.enemies.push(bossMesh);
        this.activeBoss = bossMesh;
    }

    spawn(gameTime) {
        const enemy = this.masterMesh.createInstance("e_" + Date.now() + Math.random());
        enemy.uniqueId = Date.now() + "_" + Math.random();

        const angle = Math.random() * Math.PI * 2;
        const radius = 35;
        enemy.position.x = this.player.mesh.position.x + Math.cos(angle) * radius;
        enemy.position.z = this.player.mesh.position.z + Math.sin(angle) * radius;
        enemy.position.y = 0.6;

        // Les ennemis normaux continuent de scaler à l'infini grâce à gameTime
        const scaledHp = 10 + Math.floor(gameTime / 10);
        enemy.maxHp = scaledHp;
        enemy.hp = scaledHp;
        enemy.speed = 0.12;
        enemy.xpValue = 10;

        this.shadowGenerator.addShadowCaster(enemy);
        this.enemies.push(enemy);
    }

    update(gameTime) {
        this._handleSpawns(gameTime);
        this._updateEnemies(gameTime);
    }

    // --- NOUVELLES SOUS-MÉTHODES ---

    _handleSpawns(gameTime) {
        // 1. Apparition du Boss
        if (gameTime >= this.nextBossTime && !this.bossSpawned) {
            this.spawnBoss();
            this.nextBossTime += 30; // Prévu pour le boss suivant
        }

        // 2. Apparition des ennemis normaux (uniquement si le boss n'est pas là)
        if (!this.bossSpawned) {
            this._spawnNormalEnemies(gameTime);
        }
    }

    _spawnNormalEnemies(gameTime) {
        let spawnInterval = Math.max(8, 60 - (gameTime * 0.2));
        this.spawnTimer++;

        if (this.spawnTimer >= spawnInterval) {
            let batchSize = 1;
            if (gameTime > 120) batchSize = 2;
            if (gameTime > 240) batchSize = 3;

            for (let k = 0; k < batchSize; k++) {
                this.spawn(gameTime);
            }
            this.spawnTimer = 0;
        }
    }

    _updateEnemies(gameTime) {
        // On parcourt à l'envers car on risque de supprimer des éléments (splice)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Calcul de la direction
            const direction = this.player.mesh.position.subtract(enemy.position).normalize();

            if (enemy.isBoss) {
                this._moveBoss(enemy, direction);
            } else {
                this._moveNormalEnemy(enemy, direction, gameTime, i);
            }
        }
    }

    _moveBoss(boss, direction) {
        boss.lookAt(this.player.mesh.position);
        boss.position.addInPlace(direction.scale(boss.speed));
    }

    _moveNormalEnemy(enemy, direction, gameTime, index) {
        const speedBonus = Math.min(0.06, gameTime * 0.0001);
        const currentSpeed = 0.12 + speedBonus;

        enemy.rotation.y += 0.05;
        enemy.position.addInPlace(direction.scale(currentSpeed));

        // Despawn si trop loin
        if (BABYLON.Vector3.Distance(this.player.mesh.position, enemy.position) > 70) {
            enemy.dispose();
            this.enemies.splice(index, 1);
        }
    }

    takeDamage(index, amount) {
        const enemy = this.enemies[index];
        if(!enemy) return false;

        enemy.hp -= amount;

        if (enemy.isBoss) {
            if (enemy.material) {
                const oldColor = enemy.material.emissiveColor.clone();
                enemy.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
                setTimeout(() => { if(enemy && enemy.material) enemy.material.emissiveColor = oldColor; }, 50);
            }
        } else {
            enemy.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
            setTimeout(() => { if(enemy) enemy.scaling = new BABYLON.Vector3(1, 1, 1); }, 100);
        }

        if (enemy.hp <= 0) {
            if (enemy.isBoss) {
                const defeatedIndex = this.bossIndex; // On sauvegarde l'index du boss tué
                this.activeBoss = null;
                this.bossSpawned = false;
                this.bossIndex++;

                // Si on a tué le 3ème boss en Endless, on boucle !
                if (this.gameMode === "ENDLESS" && this.bossIndex > 2) {
                    this.bossIndex = 0;
                    this.loopCount++;
                }

                // On prévient le main.js
                if (this.onBossDefeated) this.onBossDefeated(defeatedIndex);
            }

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