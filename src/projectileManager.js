import * as BABYLON from "@babylonjs/core";
import { WEAPONS, EVOLUTIONS } from './itemsData.js';

export class ProjectileManager {
    constructor(scene, player, enemyManager, xpManager) {
        this.scene = scene;
        this.player = player;
        this.enemyManager = enemyManager;
        this.xpManager = xpManager;

        this.projectiles = [];
        this.explosions = [];
        this.weaponTimers = {};

        // --- MASTERS (Modèles 3D) ---
        this.meshes = {
            magic: this._createSphere(new BABYLON.Color3(0,1,1), 0.5), // Bleu
            axe:   this._createBox(new BABYLON.Color3(1,0,0), 0.8),    // Rouge
            missile: this._createBox(new BABYLON.Color3(1, 0.5, 0), 0.6), // Orange
            grenade: this._createSphere(new BABYLON.Color3(1, 1, 0), 0.7), // Jaune
            fireball: this._createSphere(new BABYLON.Color3(1, 0.2, 0), 0.9), // Rouge Foncé
            lightning: this._createCylinder(new BABYLON.Color3(0.8, 0.8, 1), 0.3, 4), // Bleu/Blanc, haut
            scythe: this._createBox(new BABYLON.Color3(0.6, 0, 1), 1.2), // Violet (Death Spiral)
            boom: this._createExplosionMesh()
        };
    }

    // --- CRÉATION DES MESHES ---
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
    _createCylinder(color, diameter, height) {
        const m = BABYLON.MeshBuilder.CreateCylinder("m", {diameter: diameter, height: height}, this.scene);
        m.material = new BABYLON.StandardMaterial("mat", this.scene);
        m.material.diffuseColor = color;
        m.material.emissiveColor = color;
        m.isVisible = false;
        return m;
    }
    _createExplosionMesh() {
        const m = BABYLON.MeshBuilder.CreateSphere("boom", {diameter: 1}, this.scene);
        const mat = new BABYLON.StandardMaterial("matBoom", this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
        mat.alpha = 0.6;
        mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
        m.material = mat;
        m.isVisible = false;
        return m;
    }

    // --- UPDATE LOOP ---
    update() {
        this._updateWeaponCooldowns();
        this._updateProjectiles();
        this._updateExplosions();
    }

    _updateWeaponCooldowns() {
        this.player.inventory.weapons.forEach(w => {
            // On cherche dans WEAPONS ou EVOLUTIONS
            const stats = WEAPONS[w.id] || EVOLUTIONS[w.id];
            if(!stats) return;

            if (this.weaponTimers[w.id] === undefined) this.weaponTimers[w.id] = 0;
            if (this.weaponTimers[w.id] > 0) {
                // Application du passif "Tome Vide" (cooldown reduction)
                // stats.cooldownMult n'existe pas dans player stats par défaut,
                // mais si tu l'as ajouté via le passif 'empty_tome', ça marchera ici.
                // Sinon on utilise une valeur par défaut.
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

            // 1. Mouvement (Retourne true si le projectile touche le sol/fini sa course)
            if (this._handleProjectileMovement(p, i)) continue;

            p.life--;

            // 2. Collisions (Retourne true si le projectile est détruit)
            // On ne check pas les collisions pour 'lob' et 'random_sky' en l'air,
            // ils explosent uniquement au sol via _handleProjectileMovement
            let isFinished = false;
            if (p.pattern !== "lob" && p.pattern !== "random_sky") {
                isFinished = this._checkProjectileCollisions(p);
            }

            // 3. Nettoyage
            if (p.life <= 0 || isFinished) {
                this._removeProjectile(i);
            }
        }
    }

    _handleProjectileMovement(p, index) {
        // Cas A : Gravité (Grenade) ou Chute (Foudre)
        if (p.pattern === "lob" || p.pattern === "random_sky") {
            if(p.pattern === "lob") p.velocity.y -= 0.02; // Gravité douce
            // random_sky a déjà une vélocité Y négative forte constante

            p.mesh.position.addInPlace(p.velocity);

            // Touche le sol
            if (p.mesh.position.y <= 0.2) {
                this._triggerExplosion(p); // La foudre fait une zone au sol
                this._removeProjectile(index);
                return true;
            }
        }
        // Cas B : Tir Droit (Baguette, Hache, Fireball, Scythe)
        else {
            p.mesh.position.addInPlace(p.velocity);

            // Rotation visuelle
            if (p.pattern === "radial") p.mesh.rotation.y += 0.2; // La faux tourne à plat
            else p.mesh.rotation.x += 0.1; // Les autres tournent en avant
        }
        return false;
    }

    _checkProjectileCollisions(p) {
        const enemies = this.enemyManager.enemies;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];

            if (!enemy) continue;
            if (p.hitList.includes(enemy.uniqueId)) continue;
            if (BABYLON.Vector3.DistanceSquared(p.mesh.position, enemy.position) >= 2.5) continue;

            // Collision confirmée
            const shouldDestroy = this._applyHit(p, enemy, j);
            if (shouldDestroy) return true;
        }
        return false;
    }

    _applyHit(p, enemy, enemyIndex) {
        const targetId = enemy.uniqueId;

        // Si explosif (Missile)
        if (p.area > 0 && p.pattern !== "radial") { // Radial (Death Spiral) traverse, donc pas d'explosion immédiate
            this._triggerExplosion(p);
            return true;
        }

        // Dégâts Directs
        const damage = p.damage * (this.player.stats.damageMult || 1);
        const isDead = this.enemyManager.takeDamage(enemyIndex, damage);

        if (isDead) {
            this.xpManager.spawn(p.mesh.position, 10);
            this.player.stats.kills++;
        }

        // Gestion Perforation
        p.pierce--;
        p.hitList.push(targetId);

        return p.pierce <= 0;
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

    _triggerExplosion(projectile) {
        // Visuel
        const boomMesh = this.meshes.boom.createInstance("boom");
        boomMesh.position = projectile.mesh.position.clone();
        boomMesh.position.y = 0.5;
        boomMesh.material.alpha = 0.8;
        // La taille visuelle pourrait dépendre de 'area'
        this.explosions.push({ mesh: boomMesh });

        // Logique de zone
        const radiusSquared = (projectile.area / 2) * (projectile.area / 2);
        const enemies = this.enemyManager.enemies;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (!enemy) continue;

            if (BABYLON.Vector3.DistanceSquared(projectile.mesh.position, enemy.position) < radiusSquared) {
                const damage = projectile.damage * (this.player.stats.damageMult || 1);
                if(this.enemyManager.takeDamage(j, damage)){
                    this.xpManager.spawn(enemy.position, 10);
                    this.player.stats.kills++;
                }
            }
        }
    }

    _removeProjectile(index) {
        if (this.projectiles[index]) {
            this.projectiles[index].mesh.dispose();
            this.projectiles.splice(index, 1);
        }
    }

    // --- TIR (DISPATCHER) ---
    _fireWeapon(id, stats) {
        if (stats.pattern === "radial") {
            this._fireRadial(id, stats);
        } else if (stats.pattern === "random_sky") {
            this._fireSky(id, stats);
        } else if (stats.pattern === "lob") {
            this._fireLob(id, stats);
        } else {
            this._fireStraight(id, stats);
        }
    }

    _fireStraight(id, stats) {
        let nearest = this._getNearestEnemy();
        // Si pas d'ennemi, tir droit devant (axe Z) ou aléatoire
        let targetDir = nearest
            ? nearest.position.subtract(this.player.mesh.position).normalize()
            : new BABYLON.Vector3(1, 0, 0);

        // Sélection du mesh
        let mesh = this.meshes.magic;
        if (id.includes("axe")) mesh = this.meshes.axe;
        if (id.includes("missile")) mesh = this.meshes.missile;
        if (id.includes("fireball") || id.includes("hellfire")) mesh = this.meshes.fireball;
        if (id.includes("holy")) mesh = this.meshes.magic; // Holy Wand reste une sphère (ou changer couleur)

        this._spawnProjectile(mesh, this.player.mesh.position, targetDir.scale(stats.speed), stats);
    }

    _fireLob(id, stats) {
        // Grenade
        let nearest = this._getNearestEnemy();
        let targetDir = nearest
            ? nearest.position.subtract(this.player.mesh.position).normalize()
            : new BABYLON.Vector3(1, 0, 0);

        const velocity = targetDir.scale(stats.speed);
        velocity.y = 0.5; // Impulsion vers le haut

        let mesh = this.meshes.grenade;
        this._spawnProjectile(mesh, this.player.mesh.position, velocity, stats);
    }

    _fireRadial(id, stats) {
        // Death Spiral : 8 projectiles en cercle
        const count = 8;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const dir = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle));

            // Création manuelle ici car il faut tourner le mesh AVANT le spawn parfois
            // Mais _spawnProjectile gère juste la position.
            // On peut tricher : spawn, puis rotation dans update via p.mesh.rotation
            this._spawnProjectile(this.meshes.scythe, this.player.mesh.position, dir.scale(stats.speed), stats);
        }
    }

    _fireSky(id, stats) {
        // Foudre : Frappe un ennemi aléatoire
        const enemies = this.enemyManager.enemies;
        let targetPos;

        if (enemies.length > 0) {
            const randomIndex = Math.floor(Math.random() * enemies.length);
            targetPos = enemies[randomIndex].position.clone();
        } else {
            // Pas d'ennemis ? Frappe au hasard autour du joueur
            targetPos = this.player.mesh.position.clone();
            targetPos.x += (Math.random() - 0.5) * 10;
            targetPos.z += (Math.random() - 0.5) * 10;
        }

        // Départ très haut
        targetPos.y = 10;
        const velocity = new BABYLON.Vector3(0, -1, 0); // Tombe tout droit très vite

        // On booste la vitesse pour que ça tombe vite (éclair)
        this._spawnProjectile(this.meshes.lightning, targetPos, velocity.scale(2), stats);
    }

    _spawnProjectile(master, pos, vel, stats) {
        const p = master.createInstance("p");
        p.position = pos.clone();
        // Si c'est straight ou radial, on s'assure qu'il est à hauteur de buste
        if (stats.pattern !== "random_sky") p.position.y = 1;

        this.projectiles.push({
            mesh: p,
            velocity: vel,
            life: 200, // Durée de vie sécurité
            damage: stats.damage,
            pierce: stats.pierce,
            area: stats.area,
            pattern: stats.pattern,
            hitList: []
        });
    }

    _getNearestEnemy() {
        let nearest = null;
        let minDist = 1000; // Distance max de visée
        this.enemyManager.enemies.forEach(e => {
            const d = BABYLON.Vector3.DistanceSquared(this.player.mesh.position, e.position);
            if (d < minDist) { minDist = d; nearest = e; }
        });
        return nearest;
    }
}