import * as BABYLON from "@babylonjs/core";
import { WEAPONS } from './data/itemsData.js';
import { CHARACTERS } from './data/charactersData.js';
import { addShadowCastersDeep } from './manager/assetManager.js';

export class Player {
    constructor(scene, shadowGenerator, assetManager, characterId = "paladin") {
        this.scene = scene;
        this.characterData = CHARACTERS[characterId] || CHARACTERS["paladin"];

        this.mesh = this._createMesh(shadowGenerator, assetManager);
        this.inputMap = {};
        this._setupInputs();

        this.stats = {
            level: 1, xp: 0, nextLevelXp: 5, kills: 0,
            damageMult: this.characterData.stats.damageMult,
            cooldownMult: 1,
            critChance: 0,
            moveSpeed: this.characterData.stats.moveSpeed,
            projectileSpeedMult: 1,
            areaMult: 1,
            durationMult: 1
        };

        this.maxHp = this.characterData.stats.maxHp;
        this.currentHp = this.maxHp;

        this.godMode = false;
        this.invincibilityTimer = 0;
        this.inventory = { weapons: [{ id: "magic_wand", level: 1 }], passives: [] };
        this.onLevelUp = null;
        this.arenaLimits = null;

        this.passiveTimer = 0;
        this.killsSinceLastHeal = 0;
        this._setupUniquePassive();
    }

    _createMesh(shadowGenerator, assetManager) {
        const master = assetManager.meshes.player;
        if (!master) throw new Error("[Player] assetManager.meshes.player est undefined — loadAll() non terminé ?");

        const charColor = BABYLON.Color3.FromHexString(this.characterData.color);

        // Clone le TransformNode racine
        const root = master.clone("player_root", null);
        root.setEnabled(true);
        root.position.y = 0.9;

        // Clone chaque sous-mesh enfant et applique la couleur du perso
        master.getChildren(null, false).forEach(srcChild => {
            if (!(srcChild instanceof BABYLON.AbstractMesh)) return;

            const clonedChild = srcChild.clone("player_" + srcChild.name, root);
            if (!clonedChild) return;

            clonedChild.setEnabled(true);
            clonedChild.isVisible = true;

            const mat = new BABYLON.StandardMaterial("playerMat_" + srcChild.name, this.scene);
            mat.diffuseColor = charColor;
            mat.emissiveColor = new BABYLON.Color3(0, 0, 0);
            clonedChild.material = mat;
        });

        // ✅ Ajoute les shadows sur les vrais Mesh enfants, pas sur le TransformNode
        addShadowCastersDeep(shadowGenerator, root);

        return root;
    }

    _setEmissive(color) {
        this.mesh.getChildren(null, false).forEach(c => {
            if (c instanceof BABYLON.AbstractMesh && c.material) {
                c.material.emissiveColor = color;
            }
        });
    }

    _setDiffuse(color) {
        this.mesh.getChildren(null, false).forEach(c => {
            if (c instanceof BABYLON.AbstractMesh && c.material) {
                c.material.diffuseColor = color;
            }
        });
    }

    _setupUniquePassive() {
        const passive = this.characterData.passive;

        if (passive.type === "aura") {
            this.auraMesh = BABYLON.MeshBuilder.CreateTorus("aura",
                { diameter: passive.radius * 2, thickness: 0.2 }, this.scene);
            const auraMat = new BABYLON.StandardMaterial("auraMat", this.scene);
            auraMat.emissiveColor = new BABYLON.Color3(1, 1, 0);
            auraMat.alpha = 0.5;
            this.auraMesh.material = auraMat;
            this.auraMesh.parent = this.mesh;
            this.auraMesh.position.y = -0.8;
        }

        if (passive.type === "companion") {
            this.companionMesh = BABYLON.MeshBuilder.CreateSphere("companion",
                { diameter: 0.6 }, this.scene);
            const compMat = new BABYLON.StandardMaterial("compMat", this.scene);
            compMat.emissiveColor = new BABYLON.Color3(0.5, 0, 1);
            this.companionMesh.material = compMat;
            this.companionMesh.parent = this.mesh;
            this.companionMesh.position = new BABYLON.Vector3(1.2, 1.5, 0);
        }
    }

    onEnemyKill() {
        this.stats.kills++;
        const passive = this.characterData.passive;
        if (passive.type === "lifesteal") {
            this.killsSinceLastHeal++;
            const required = Math.max(1, passive.killsRequired - Math.floor(this.stats.level / 5));
            if (this.killsSinceLastHeal >= required) {
                this.killsSinceLastHeal = 0;
                this.heal(passive.healAmount + this.maxHp * 0.01);
            }
        }
    }

    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        this._setEmissive(new BABYLON.Color3(0, 1, 0));
        setTimeout(() => this._setEmissive(new BABYLON.Color3(0, 0, 0)), 200);
    }

    setLimits(limits) { this.arenaLimits = limits; }

    _setupInputs() {
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
                const key = evt.sourceEvent.key.toLowerCase();
                this.inputMap[key] = true;
                if (key === 'g') {
                    this.godMode = !this.godMode;
                    this._setDiffuse(this.godMode
                        ? new BABYLON.Color3(1, 0.8, 0)
                        : BABYLON.Color3.FromHexString(this.characterData.color));
                }
            }
        ));
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
                this.inputMap[evt.sourceEvent.key.toLowerCase()] = false;
            }
        ));
    }

    update(enemyManager) {
        this._handleMovement();
        this._applyArenaLimits();
        this._updateVisualsAndInvincibility();
        this._handlePassives(enemyManager);
    }

    _handleMovement() {
        let moveVector = new BABYLON.Vector3(0, 0, 0);
        if (this.inputMap["z"] || this.inputMap["w"]) moveVector.z =  1;
        if (this.inputMap["s"])                        moveVector.z = -1;
        if (this.inputMap["q"] || this.inputMap["a"]) moveVector.x = -1;
        if (this.inputMap["d"])                        moveVector.x =  1;

        if (moveVector.length() > 0) {
            moveVector.normalize().scaleInPlace(this.stats.moveSpeed);
            this.mesh.position.addInPlace(moveVector);
            const targetRot = Math.atan2(moveVector.x, moveVector.z);
            this.mesh.rotation.y = BABYLON.Scalar.Lerp(this.mesh.rotation.y, targetRot, 0.2);
        }
    }

    _applyArenaLimits() {
        if (!this.arenaLimits) return;
        const pos = this.mesh.position;
        const { minX, maxX, minZ, maxZ } = this.arenaLimits;
        if (minX !== null && pos.x < minX) pos.x = minX;
        if (maxX !== null && pos.x > maxX) pos.x = maxX;
        if (minZ !== null && pos.z < minZ) pos.z = minZ;
        if (maxZ !== null && pos.z > maxZ) pos.z = maxZ;
    }

    _updateVisualsAndInvincibility() {
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer--;
            this._setEmissive(this.invincibilityTimer % 10 < 5
                ? new BABYLON.Color3(1, 0, 0)
                : new BABYLON.Color3(0, 0, 0));
        } else if (this.currentHp < this.maxHp) {
            this._setEmissive(new BABYLON.Color3(0, 0, 0));
        }
    }

    _handlePassives(enemyManager) {
        const passive = this.characterData.passive;
        this.passiveTimer++;
        if (passive.type === "aura")           this._processAura(passive, enemyManager);
        else if (passive.type === "companion") this._processCompanion(passive, enemyManager);
    }

    _processAura(passive, enemyManager) {
        this.auraMesh.rotation.y += 0.02;
        if (this.passiveTimer % 15 !== 0 || !enemyManager) return;
        const radiusSq = passive.radius * passive.radius;
        const damage = passive.baseDamage * (1 + this.stats.level * 0.1) * this.stats.damageMult;
        for (let i = enemyManager.enemies.length - 1; i >= 0; i--) {
            if (BABYLON.Vector3.DistanceSquared(this.mesh.position, enemyManager.enemies[i].position) < radiusSq) {
                if (enemyManager.takeDamage(i, damage)) this.onEnemyKill();
            }
        }
    }

    _processCompanion(passive, enemyManager) {
        if (!enemyManager) return;
        this.companionMesh.position.x = Math.cos(this.passiveTimer * 0.05) * 1.5;
        this.companionMesh.position.z = Math.sin(this.passiveTimer * 0.05) * 1.5;
        if (this.passiveTimer % passive.cooldown !== 0) return;
        let closest = null, minDist = passive.range * passive.range;
        enemyManager.enemies.forEach(e => {
            const d = BABYLON.Vector3.DistanceSquared(this.mesh.position, e.position);
            if (d < minDist) { minDist = d; closest = e; }
        });
        if (closest) this._fireCompanionLaser(passive, enemyManager, closest);
    }

    _fireCompanionLaser(passive, enemyManager, target) {
        const damage = passive.baseDamage * this.stats.damageMult * (1 + this.stats.level * 0.2);
        const laser = BABYLON.MeshBuilder.CreateLines("laser",
            { points: [this.companionMesh.getAbsolutePosition(), target.position] }, this.scene);
        laser.color = new BABYLON.Color3(0.5, 0, 1);
        setTimeout(() => laser.dispose(), 100);
        const index = enemyManager.enemies.indexOf(target);
        if (index > -1 && enemyManager.takeDamage(index, damage)) this.onEnemyKill();
    }

    takeDamage(amount) {
        if (this.godMode || this.invincibilityTimer > 0) return false;
        this.currentHp -= amount;
        this.invincibilityTimer = 30;
        if (this.currentHp <= 0) { this.currentHp = 0; return true; }
        return false;
    }

    gainXp(amount) {
        this.stats.xp += amount;
        if (this.stats.xp >= this.stats.nextLevelXp) {
            this.stats.level++;
            this.stats.xp = 0;
            this.stats.nextLevelXp = Math.floor(this.stats.nextLevelXp * 1.5);
            if (this.onLevelUp) this.onLevelUp();
        }
    }

    addItem(itemData) {
        if (itemData.type === 'evolution') this._addEvolution(itemData);
        else this._addStandardItem(itemData);
    }

    _addEvolution(itemData) {
        const idx = this.inventory.weapons.findIndex(w => {
            const s = WEAPONS[w.id];
            return s && s.evolutionId === itemData.id;
        });
        if (idx !== -1) this.inventory.weapons.splice(idx, 1);
        this.inventory.weapons.push({ id: itemData.id, level: 1 });
    }

    _addStandardItem(itemData) {
        const list = itemData.type === 'weapon' ? this.inventory.weapons : this.inventory.passives;
        const existing = list.find(i => i.id === itemData.id);
        if (existing) existing.level++;
        else list.push({ id: itemData.id, level: 1 });
        if (itemData.type === 'passive') this._applyPassiveBonuses(itemData);
    }

    _applyPassiveBonuses(itemData) {
        if (!itemData.statBonus) return;
        const s = this.stats, b = itemData.statBonus;
        if (b.damage)    s.damageMult         += b.damage;
        if (b.crit)      s.critChance          = (s.critChance || 0) + b.crit;
        if (b.speed)     s.projectileSpeedMult += b.speed;
        if (b.moveSpeed) s.moveSpeed           += b.moveSpeed;
        if (b.cooldown)  s.cooldownMult        -= b.cooldown;
        if (b.area)      s.areaMult            += b.area;
        if (b.duration)  s.durationMult        += b.duration;
    }
}