import * as BABYLON from "@babylonjs/core";
import { WEAPONS } from './itemsData.js';

export class Player {
    constructor(scene, shadowGenerator) {
        this.scene = scene;
        this.mesh = this._createMesh(shadowGenerator);
        this.inputMap = {};
        this._setupInputs();
        this.arenaLimits = null;
        // Stats RPG
        this.stats = {
            level: 1, xp: 0, nextLevelXp: 5, kills: 0,
            damageMult: 1,
            cooldownMult: 1,
            critChance: 0,
            moveSpeed: 0.3,
            projectileSpeedMult: 1,
            areaMult: 1,      // Taille des zones (Candélabre)
            durationMult: 1   // Durée de vie des tirs (Envoûteur)
        };

        // Santé & Combat
        this.maxHp = 100;
        this.currentHp = 100;
        this.godMode = false;
        this.invincibilityTimer = 0;

        // Inventaire
        this.inventory = { weapons: [{ id: "magic_wand", level: 1 }], passives: [] };
        this.onLevelUp = null;
    }

    // Nouvelle méthode pour définir les limites
    setLimits(limits) {
        this.arenaLimits = limits;
    }


    _createMesh(shadowGenerator) {
        const mesh = BABYLON.MeshBuilder.CreateCylinder("player", {diameter: 1, height: 1.8, tessellation: 16}, this.scene);
        const mat = new BABYLON.StandardMaterial("playerMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        mesh.material = mat;
        mesh.position.y = 0.9;
        shadowGenerator.addShadowCaster(mesh);
        return mesh;
    }

    _setupInputs() {
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
            const key = evt.sourceEvent.key.toLowerCase();
            this.inputMap[key] = true;

            if (key === 'g') {
                this.godMode = !this.godMode;
                this.mesh.material.diffuseColor = this.godMode ? new BABYLON.Color3(1, 0.8, 0) : new BABYLON.Color3(1, 1, 1);
            }
        }));
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key.toLowerCase()] = false;
        }));
    }

    update() {
        let moveVector = new BABYLON.Vector3(0, 0, 0);
        if (this.inputMap["z"] || this.inputMap["w"]) moveVector.z = 1;
        if (this.inputMap["s"]) moveVector.z = -1;
        if (this.inputMap["q"] || this.inputMap["a"]) moveVector.x = -1;
        if (this.inputMap["d"]) moveVector.x = 1;

        if (moveVector.length() > 0) {
            moveVector.normalize().scaleInPlace(this.stats.moveSpeed);
            this.mesh.position.addInPlace(moveVector);
            const targetRot = Math.atan2(moveVector.x, moveVector.z);
            this.mesh.rotation.y = BABYLON.Scalar.Lerp(this.mesh.rotation.y, targetRot, 0.2);
        }

        // --- APPLIQUER LES LIMITES DE L'ARÈNE ---
        if (this.arenaLimits) {
            if (this.arenaLimits.minX !== null) {
                if (this.mesh.position.x < this.arenaLimits.minX) this.mesh.position.x = this.arenaLimits.minX;
            }
            if (this.arenaLimits.maxX !== null) {
                if (this.mesh.position.x > this.arenaLimits.maxX) this.mesh.position.x = this.arenaLimits.maxX;
            }
            if (this.arenaLimits.minZ !== null) {
                if (this.mesh.position.z < this.arenaLimits.minZ) this.mesh.position.z = this.arenaLimits.minZ;
            }
            if (this.arenaLimits.maxZ !== null) {
                if (this.mesh.position.z > this.arenaLimits.maxZ) this.mesh.position.z = this.arenaLimits.maxZ;
            }
        }

        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer--;
            if (this.invincibilityTimer % 10 < 5) this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
            else this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        } else {
            this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }
    }

    takeDamage(amount) {
        if (this.godMode || this.invincibilityTimer > 0) return false;
        this.currentHp -= amount;
        this.invincibilityTimer = 30;
        if (this.currentHp <= 0) {
            this.currentHp = 0;
            return true;
        }
        return false;
    }

    gainXp(amount) {
        this.stats.xp += amount;
        if(this.stats.xp >= this.stats.nextLevelXp) {
            this.stats.level++;
            this.stats.xp = 0;
            this.stats.nextLevelXp = Math.floor(this.stats.nextLevelXp * 1.5);
            if(this.onLevelUp) this.onLevelUp();
        }
    }

    addItem(itemData) {
        if (itemData.type === 'evolution') this._addEvolution(itemData);
        else this._addStandardItem(itemData);
    }

    _addEvolution(itemData) {
        const sourceIndex = this.inventory.weapons.findIndex(w => {
            const staticData = WEAPONS[w.id];
            return staticData && staticData.evolutionId === itemData.id;
        });
        if (sourceIndex !== -1) this.inventory.weapons.splice(sourceIndex, 1);
        this.inventory.weapons.push({ id: itemData.id, level: 1 });
    }

    _addStandardItem(itemData) {
        const list = itemData.type === 'weapon' ? this.inventory.weapons : this.inventory.passives;
        const existing = list.find(i => i.id === itemData.id);
        if (existing) existing.level++;
        else list.push({ id: itemData.id, level: 1 });

        if (itemData.type === 'passive') this._applyPassiveBonuses(itemData);
    }

    // --- MODIFICATION ICI ---
    _applyPassiveBonuses(itemData) {
        if (!itemData.statBonus) return;

        if (itemData.statBonus.damage) this.stats.damageMult += itemData.statBonus.damage;
        if (itemData.statBonus.crit) this.stats.critChance = (this.stats.critChance || 0) + itemData.statBonus.crit;

        // CORRECTION : 'speed' (Brassard) augmente la vitesse des projectiles
        if (itemData.statBonus.speed) this.stats.projectileSpeedMult += itemData.statBonus.speed;

        // NOUVEAU : 'moveSpeed' (Ailes) augmente la vitesse du joueur
        if (itemData.statBonus.moveSpeed) this.stats.moveSpeed += itemData.statBonus.moveSpeed;

        if (itemData.statBonus.cooldown) this.stats.cooldownMult -= itemData.statBonus.cooldown;
        // Taille de Zone (Candélabre)
        if (itemData.statBonus.area) {
            this.stats.areaMult += itemData.statBonus.area;
            console.log("Area Multiplier:", this.stats.areaMult);
        }

        // Durée (Envoûteur)
        if (itemData.statBonus.duration) {
            this.stats.durationMult += itemData.statBonus.duration;
            console.log("Duration Multiplier:", this.stats.durationMult);
        }
    }
}