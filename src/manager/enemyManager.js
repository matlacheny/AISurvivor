import * as BABYLON from "@babylonjs/core";
import { BOSSES } from '../data/bossData.js';
import { ENEMY_TYPES } from '../data/enemyData.js';
import { addShadowCastersDeep } from './assetManager.js';

export class EnemyManager {
    constructor(scene, shadowGenerator, player, assetManager) {
        this.scene = scene;
        this.player = player;
        this.shadowGenerator = shadowGenerator;
        this.assetManager = assetManager;

        this.enemies = [];
        this.enemyProjectiles = [];

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
        return ENEMY_TYPES[0];
    }

    spawnBoss() {
        if (this.bossSpawned) return;
        this.bossSpawned = true;

        const arenaBosses = BOSSES[this.currentArenaId] || BOSSES["infinite"];
        const currentBossIndex = Math.min(this.bossIndex, arenaBosses.length - 1);
        const baseBossData = arenaBosses[currentBossIndex];

        const bossMesh = this.assetManager.cloneEnemy("enemy_tank", "BOSS_" + baseBossData.name);
        bossMesh.position = this.player.mesh.position.clone();
        bossMesh.position.z += 40;
        bossMesh.position.y = baseBossData.scale / 2;
        bossMesh.scaling = new BABYLON.Vector3(baseBossData.scale, baseBossData.scale, baseBossData.scale);

        // Colorisation du boss (sur tous ses sous-meshes)
        bossMesh.getChildren(null, false).forEach(child => {
            if (child instanceof BABYLON.AbstractMesh) {
                const bossMat = new BABYLON.StandardMaterial("bossMat_" + child.name, this.scene);
                bossMat.diffuseColor = baseBossData.color;
                bossMat.emissiveColor = baseBossData.color.scale(0.4);
                child.material = bossMat;
            }
        });

        const scaleMult = 1 + (this.loopCount * 1.0);
        bossMesh.uniqueId_custom = "BOSS_" + Date.now(); // on évite d'écraser uniqueId natif
        bossMesh.hp = baseBossData.hp * scaleMult;
        bossMesh.maxHp = baseBossData.hp * scaleMult;
        bossMesh.damage = baseBossData.damage * scaleMult;
        bossMesh.speed = baseBossData.speed;
        bossMesh.isBoss = true;
        bossMesh.name = baseBossData.name + (this.loopCount > 0 ? ` +${this.loopCount}` : "");
        bossMesh.xpValue = baseBossData.dropXp * scaleMult;
        bossMesh.baseScale = baseBossData.scale;

        // ✅ Shadow sur les vrais Mesh enfants
        addShadowCastersDeep(this.shadowGenerator, bossMesh);

        this.enemies.push(bossMesh);
        this.activeBoss = bossMesh;
    }

    spawn(gameTime) {
        const typeConfig = this._getRandomEnemyType();

        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 10;

        const enemy = this.assetManager.cloneEnemy(typeConfig.id, "e_" + Date.now() + Math.random());

        enemy.position.x = this.player.mesh.position.x + Math.cos(angle) * radius;
        enemy.position.z = this.player.mesh.position.z + Math.sin(angle) * radius;
        enemy.position.y = typeConfig.scale / 2;

        const scaledHp = 10 + Math.floor(gameTime / 10);
        enemy.maxHp = scaledHp * typeConfig.hpMult;
        enemy.hp = enemy.maxHp;
        enemy.speedMult = typeConfig.speedMult;
        enemy.isShooter = typeConfig.isShooter;
        enemy.range = typeConfig.range || 0;
        enemy.fireRate = typeConfig.fireRate || 90;
        enemy.fireTimer = 0;
        enemy.baseScale = typeConfig.scale;
        enemy.xpValue = 10 * typeConfig.hpMult;

        // ✅ Shadow sur les vrais Mesh enfants
        addShadowCastersDeep(this.shadowGenerator, enemy);

        this.enemies.push(enemy);
    }

    update(gameTime) {
        this._handleSpawns(gameTime);
        this._updateEnemies(gameTime);
        this._updateEnemyProjectiles();
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
                for (let k = 0; k < batchSize; k++) this.spawn(gameTime);
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

        enemy.lookAt(this.player.mesh.position);

        const dist = BABYLON.Vector3.Distance(this.player.mesh.position, enemy.position);

        if (enemy.isShooter && dist < enemy.range) {
            enemy.fireTimer++;
            if (enemy.fireTimer >= enemy.fireRate) {
                this._fireEnemyProjectile(enemy);
                enemy.fireTimer = 0;
            }
        } else {
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
        const dir = this.player.mesh.position.subtract(enemy.position).normalize();
        this.enemyProjectiles.push({ mesh: proj, dir, speed: 0.25, life: 120 });
    }

    _updateEnemyProjectiles() {
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const p = this.enemyProjectiles[i];
            p.mesh.position.addInPlace(p.dir.scale(p.speed));
            p.life--;

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
        if (!enemy) return false;

        enemy.hp -= amount;

        // Flash blanc sur les sous-meshes du boss
        if (enemy.isBoss) {
            enemy.getChildren(null, false).forEach(child => {
                if (child instanceof BABYLON.AbstractMesh && child.material) {
                    const oldColor = child.material.emissiveColor.clone();
                    child.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
                    setTimeout(() => {
                        if (child && child.material) child.material.emissiveColor = oldColor;
                    }, 50);
                }
            });
        } else {
            // Effet d'impact : scale-up bref
            const s = enemy.baseScale;
            enemy.scaling = new BABYLON.Vector3(s * 1.3, s * 1.3, s * 1.3);
            setTimeout(() => {
                if (enemy) enemy.scaling = new BABYLON.Vector3(s, s, s);
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
        if (this.enemies[index]) {
            this.enemies[index].dispose();
            this.enemies.splice(index, 1);
        }
    }
}