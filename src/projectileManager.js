import * as BABYLON from "@babylonjs/core";
import { WEAPONS } from './itemsData.js';

export class ProjectileManager {
    constructor(scene, player, enemyManager, xpManager) {
        this.scene = scene;
        this.player = player;
        this.enemyManager = enemyManager;
        this.xpManager = xpManager;

        this.projectiles = [];
        this.explosions = [];
        this.weaponTimers = {};

        // --- MASTERS ---
        this.meshes = {
            magic: this._createSphere(new BABYLON.Color3(0,1,1), 0.5),
            axe:   this._createBox(new BABYLON.Color3(1,0,0), 0.8),
            missile: this._createBox(new BABYLON.Color3(1, 0.5, 0), 0.6),
            grenade: this._createSphere(new BABYLON.Color3(1, 1, 0), 0.7),
            boom: this._createExplosionMesh()
        };
    }

    _createSphere(color, size) {
        const m = BABYLON.MeshBuilder.CreateSphere("m", {diameter: size}, this.scene);
        m.material = new BABYLON.StandardMaterial("mat", this.scene);
        m.material.diffuseColor = color;
        m.material.emissiveColor = color.scale(0.6);
        m.isVisible = false;
        return m;
    }
    _createBox(color, size) {
        const m = BABYLON.MeshBuilder.CreateBox("m", {size: size}, this.scene);
        m.material = new BABYLON.StandardMaterial("mat", this.scene);
        m.material.diffuseColor = color;
        m.material.emissiveColor = color.scale(0.5);
        m.isVisible = false;
        return m;
    }
    _createExplosionMesh() {
        const m = BABYLON.MeshBuilder.CreateSphere("boom", {diameter: 1}, this.scene);
        const mat = new BABYLON.StandardMaterial("matBoom", this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
        mat.alpha = 0.6;
        mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
        mat.wireframe = true;
        m.material = mat;
        m.isVisible = false;
        return m;
    }

    update() {
        // 1. Update Weapon Timers (Keep your existing weapon timer logic here)
        this._updateWeaponCooldowns();

        // 2. Update Projectiles (Movement & Collisions)
        this._updateProjectiles();

        // 3. Update Explosions (Animation)
        this._updateExplosions();
    }

    _updateWeaponCooldowns() {
        this.player.inventory.weapons.forEach(w => {
            const stats = WEAPONS[w.id];
            if (!stats) return;

            if (this.weaponTimers[w.id] === undefined) this.weaponTimers[w.id] = 0;
            if (this.weaponTimers[w.id] > 0) {
                this.weaponTimers[w.id] -= 1;
            } else {
                this._fireWeapon(w.id, stats);
                this.weaponTimers[w.id] = stats.cooldown;
            }
        });
    }

    _updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // Handle Movement - returns true if projectile hit ground (lob) and was removed
            if (this._handleProjectileMovement(p, i)) continue;

            p.life--;

            // Handle Collisions - returns true if projectile hits something and is finished
            let isFinished = false;
            if (p.pattern !== "lob") {
                isFinished = this._checkProjectileCollisions(p);
            }

            // Cleanup if expired or finished colliding
            if (p.life <= 0 || isFinished) {
                this._removeProjectile(i);
            }
        }
    }

    _handleProjectileMovement(p, index) {
        if (p.pattern === "lob") {
            p.velocity.y -= 0.02;
            p.mesh.position.addInPlace(p.velocity);

            // Lob hits the floor
            if (p.mesh.position.y <= 0.2) {
                this._triggerExplosion(p);
                this._removeProjectile(index);
                return true; // Signal that projectile is removed
            }
        } else {
            p.mesh.position.addInPlace(p.velocity);
            p.mesh.rotation.x += 0.1;
        }
        return false;
    }

    _checkProjectileCollisions(p) {
        const enemies = this.enemyManager.enemies;

        // Iterate backwards for safety
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];

            // Fast fail checks to reduce nesting
            if (!enemy) continue;
            if (p.hitList.includes(enemy.uniqueId)) continue;
            if (BABYLON.Vector3.DistanceSquared(p.mesh.position, enemy.position) >= 2) continue;

            // Collision confirmed: Apply Logic
            const shouldDestroyProjectile = this._applyHit(p, enemy, j);

            if (shouldDestroyProjectile) {
                return true; // Projectile is finished (exploded or pierce depleted)
            }
        }
        return false;
    }

    _applyHit(p, enemy, enemyIndex) {
        const targetId = enemy.uniqueId; // Save ID immediately

        // Case 1: Explosive Ammo (Missile)
        if (p.area > 0) {
            this._triggerExplosion(p);
            return true; // Destroy projectile immediately
        }

        // Case 2: Direct Hit (Axe, Wand)
        const damage = p.damage * (this.player.stats.damageMult || 1);
        const isDead = this.enemyManager.takeDamage(enemyIndex, damage);

        if (isDead) {
            this.xpManager.spawn(p.mesh.position, 10);
            this.player.stats.kills++;
        }

        // Handle Pierce
        p.pierce--;
        p.hitList.push(targetId);

        return p.pierce <= 0; // Return true if pierce is empty
    }

    _updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const ex = this.explosions[i];
            ex.mesh.scaling.addInPlace(new BABYLON.Vector3(0.5, 0.5, 0.5));
            ex.mesh.material.alpha -= 0.05;

            if (ex.mesh.material.alpha <= 0) {
                ex.mesh.dispose();
                this.explosions.splice(i, 1);
            }
        }
    }

    _removeProjectile(index) {
        if (this.projectiles[index]) {
            this.projectiles[index].mesh.dispose();
            this.projectiles.splice(index, 1);
        }
    }

    _triggerExplosion(projectile) {
        const boomMesh = this.meshes.boom.createInstance("boom");
        boomMesh.position = projectile.mesh.position.clone();
        boomMesh.position.y = 0.5;
        boomMesh.material.alpha = 0.8;
        this.explosions.push({ mesh: boomMesh });

        const radiusSquared = (projectile.area / 2) * (projectile.area / 2);
        const enemies = this.enemyManager.enemies;

        // Note : Ici aussi on itère à l'envers, c'est sûr pour les suppressions
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if(!enemy) continue; // Sécurité

            const dist = BABYLON.Vector3.DistanceSquared(projectile.mesh.position, enemy.position);

            if (dist < radiusSquared) {
                const damage = projectile.damage * (this.player.stats.damageMult || 1);
                const isDead = this.enemyManager.takeDamage(j, damage);

                if(isDead) {
                    // Si l'ennemi meurt, on spawn l'XP là où il était (takeDamage supprime l'ennemi,
                    // mais on peut supposer qu'on a besoin de la pos avant suppression,
                    // ou spawn sur le projectile pour simplifier)
                    this.xpManager.spawn(projectile.mesh.position, 10);
                    this.player.stats.kills++;
                }
            }
        }
    }

    _fireWeapon(id, stats) {
        let nearest = this._getNearestEnemy();
        let targetDir = nearest
            ? nearest.position.subtract(this.player.mesh.position).normalize()
            : new BABYLON.Vector3(1, 0, 0);

        if (stats.pattern === "straight" || stats.pattern === "nearest") {
            let mesh = this.meshes.magic;
            if(id === "axe") mesh = this.meshes.axe;
            if(id === "missile") mesh = this.meshes.missile;

            this._spawnProjectile(mesh, this.player.mesh.position, targetDir.scale(stats.speed), stats);
        }
        else if (stats.pattern === "lob") {
            const velocity = targetDir.scale(stats.speed);
            velocity.y = 0.5;
            this._spawnProjectile(this.meshes.grenade, this.player.mesh.position, velocity, stats);
        }
    }

    _spawnProjectile(master, pos, vel, stats) {
        const p = master.createInstance("p");
        p.position = pos.clone();
        p.position.y = 1;

        this.projectiles.push({
            mesh: p,
            velocity: vel,
            life: 150,
            damage: stats.damage,
            pierce: stats.pierce,
            area: stats.area,
            pattern: stats.pattern,
            hitList: []
        });
    }

    _getNearestEnemy() {
        let nearest = null;
        let minDist = 1000;
        this.enemyManager.enemies.forEach(e => {
            const d = BABYLON.Vector3.DistanceSquared(this.player.mesh.position, e.position);
            if (d < minDist) { minDist = d; nearest = e; }
        });
        return minDist < 900 ? nearest : null;
    }
}