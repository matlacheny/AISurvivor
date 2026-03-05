import * as BABYLON from "@babylonjs/core";
import { BOSSES } from '../data/bossData.js';
import { ENEMY_TYPES } from '../data/enemyData.js';

export class EnemyManager {
    constructor(scene, shadowGenerator, player, assetManager) {
        this.scene = scene;
        this.player = player;
        this.shadowGenerator = shadowGenerator;
        this.assetManager = assetManager; // On le stocke pour pouvoir piocher dedans

        this.enemies = [];
        this.enemyProjectiles = []; // Nouvelle liste pour les tirs ennemis

        this.currentArenaId = "infinite";
        this.gameMode = "ENDLESS";
        this.onBossDefeated = null;

        this.nextBossTime = 300;
        this.bossSpawned = false;
        this.activeBoss = null;
        this.bossIndex = 0;
        this.loopCount = 0;

        this.spawnTimer = 0;
    }

    setCurrentArena(arenaId) { this.currentArenaId = arenaId; }

    _getRandomEnemyType() {
        const rand = Math.random();
        let cumulative = 0;
        for (let type of ENEMY_TYPES) {
            cumulative += type.prob;
            if (rand <= cumulative) return type;
        }
        return ENEMY_TYPES[0]; // Sécurité
    }

    spawnBoss() {
        if(this.bossSpawned) return;
        this.bossSpawned = true;

        const arenaBosses = BOSSES[this.currentArenaId] || BOSSES["infinite"];
        const currentBossIndex = Math.min(this.bossIndex, arenaBosses.length - 1);
        const baseBossData = arenaBosses[currentBossIndex];

        // On utilise l'asset du tank comme base pour les boss (car il est gros)
        const bossMesh = this.assetManager.meshes.enemy_tank.clone("BOSS_" + baseBossData.name);
        bossMesh.isVisible = true;

        bossMesh.position = this.player.mesh.position.clone();
        bossMesh.position.z += 40;
        bossMesh.position.y = baseBossData.scale / 2;

        bossMesh.scaling = new BABYLON.Vector3(baseBossData.scale, baseBossData.scale, baseBossData.scale);

        const bossMat = new BABYLON.StandardMaterial("bossMat", this.scene);
        bossMat.diffuseColor = baseBossData.color;
        bossMat.emissiveColor = baseBossData.color.scale(0.4);
        bossMesh.material = bossMat;

        const scaleMult = 1 + (this.loopCount * 1.0);
        bossMesh.uniqueId = "BOSS_" + Date.now();
        bossMesh.hp = baseBossData.hp * scaleMult;
        bossMesh.maxHp = baseBossData.hp * scaleMult;
        bossMesh.damage = baseBossData.damage * scaleMult;
        bossMesh.speed = baseBossData.speed;
        bossMesh.isBoss = true;
        bossMesh.name = baseBossData.name + (this.loopCount > 0 ? ` +${this.loopCount}` : "");
        bossMesh.xpValue = baseBossData.dropXp * scaleMult;
        bossMesh.baseScale = baseBossData.scale;

        this.shadowGenerator.addShadowCaster(bossMesh);
        this.enemies.push(bossMesh);
        this.activeBoss = bossMesh;
    }

    spawn(gameTime) {
        const typeConfig = this._getRandomEnemyType();
        const masterMesh = this.assetManager.meshes[typeConfig.id];

        const enemy = masterMesh.createInstance("e_" + Date.now() + Math.random());
        enemy.uniqueId = Date.now() + "_" + Math.random();

        const angle = Math.random() * Math.PI * 2;
        const radius = 35;
        enemy.position.x = this.player.mesh.position.x + Math.cos(angle) * radius;
        enemy.position.z = this.player.mesh.position.z + Math.sin(angle) * radius;
        enemy.position.y = typeConfig.scale / 2;

        // Application des stats selon le type
        const scaledHp = 10 + Math.floor(gameTime / 10);
        enemy.maxHp = scaledHp * typeConfig.hpMult;
        enemy.hp = enemy.maxHp;

        enemy.speedMult = typeConfig.speedMult;
        enemy.isShooter = typeConfig.isShooter;
        enemy.range = typeConfig.range || 0;
        enemy.fireRate = typeConfig.fireRate || 90;
        enemy.fireTimer = 0;
        enemy.baseScale = typeConfig.scale;

        enemy.xpValue = 10 * typeConfig.hpMult; // Un tank donne plus d'XP !

        this.shadowGenerator.addShadowCaster(enemy);
        this.enemies.push(enemy);
    }

    update(gameTime) {
        this._handleSpawns(gameTime);
        this._updateEnemies(gameTime);
        this._updateEnemyProjectiles(); // Nouveau !
    }

    _handleSpawns(gameTime) {
        if (gameTime >= this.nextBossTime && !this.bossSpawned) {
            this.spawnBoss();
            this.nextBossTime += 300;
        }

        if (!this.bossSpawned) {
            let spawnInterval = Math.max(8, 60 - (gameTime * 0.2));
            this.spawnTimer++;
            if (this.spawnTimer >= spawnInterval) {
                let batchSize = 1;
                if (gameTime > 120) batchSize = 2;
                if (gameTime > 240) batchSize = 3;
                for(let k = 0; k < batchSize; k++) this.spawn(gameTime);
                this.spawnTimer = 0;
            }
        }
    }

    _updateEnemies(gameTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const direction = this.player.mesh.position.subtract(enemy.position).normalize();

            if (enemy.isBoss) {
                enemy.lookAt(this.player.mesh.position);
                enemy.position.addInPlace(direction.scale(enemy.speed));
            } else {
                this._moveNormalEnemy(enemy, direction, gameTime, i);
            }
        }
    }

    _moveNormalEnemy(enemy, direction, gameTime, index) {
        const speedBonus = Math.min(0.06, gameTime * 0.0001);
        const baseSpeed = 0.12 + speedBonus;
        const currentSpeed = baseSpeed * enemy.speedMult;

        // Ils regardent tous le joueur (plus naturel pour les tirs)
        enemy.lookAt(this.player.mesh.position);

        const dist = BABYLON.Vector3.Distance(this.player.mesh.position, enemy.position);

        // Comportement de l'artilleur
        if (enemy.isShooter && dist < enemy.range) {
            enemy.fireTimer++;
            if (enemy.fireTimer >= enemy.fireRate) {
                this._fireEnemyProjectile(enemy);
                enemy.fireTimer = 0;
            }
        }
        // Comportement de déplacement standard
        else {
            enemy.position.addInPlace(direction.scale(currentSpeed));
        }

        if (dist > 70) {
            enemy.dispose();
            this.enemies.splice(index, 1);
        }
    }

    _fireEnemyProjectile(enemy) {
        const proj = this.assetManager.meshes.enemy_proj.createInstance("ep");
        proj.position = enemy.position.clone();
        proj.position.y = 1;

        // Calcule la direction vers le joueur
        const dir = this.player.mesh.position.subtract(enemy.position).normalize();

        this.enemyProjectiles.push({
            mesh: proj,
            dir: dir,
            speed: 0.25,
            life: 120 // Disparaît après environ 2 secondes
        });
    }

    _updateEnemyProjectiles() {
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const p = this.enemyProjectiles[i];
            p.mesh.position.addInPlace(p.dir.scale(p.speed));
            p.life--;

            // Collision avec le joueur (10 dégâts fixes pour l'instant)
            if (BABYLON.Vector3.DistanceSquared(p.mesh.position, this.player.mesh.position) < 2) {
                this.player.takeDamage(10);
                p.mesh.dispose();
                this.enemyProjectiles.splice(i, 1);
                continue;
            }

            if (p.life <= 0) {
                p.mesh.dispose();
                this.enemyProjectiles.splice(i, 1);
            }
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
            // Effet d'impact dynamique adapté à la taille de base (baseScale)
            enemy.scaling = new BABYLON.Vector3(enemy.baseScale * 1.3, enemy.baseScale * 1.3, enemy.baseScale * 1.3);
            setTimeout(() => {
                if(enemy) enemy.scaling = new BABYLON.Vector3(enemy.baseScale, enemy.baseScale, enemy.baseScale);
            }, 100);
        }

        if (enemy.hp <= 0) {
            if (enemy.isBoss) {
                const defeatedIndex = this.bossIndex;
                this.activeBoss = null;
                this.bossSpawned = false;
                this.bossIndex++;

                if (this.gameMode === "ENDLESS" && this.bossIndex > 2) {
                    this.bossIndex = 0;
                    this.loopCount++;
                }

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