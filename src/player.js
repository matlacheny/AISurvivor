import * as BABYLON from "@babylonjs/core";
import { WEAPONS } from './data/itemsData.js';
import { CHARACTERS } from './data/charactersData.js';

export class Player {
    constructor(scene, shadowGenerator, characterId = "paladin") {
        this.scene = scene;

        // 1. Chargement des données du personnage
        this.characterData = CHARACTERS[characterId] || CHARACTERS["paladin"];

        this.mesh = this._createMesh(shadowGenerator);
        this.inputMap = {};
        this._setupInputs();

        // 2. Stats initialisées selon le personnage
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

        // Variables système
        this.godMode = false;
        this.invincibilityTimer = 0;
        this.inventory = { weapons: [{ id: "magic_wand", level: 1 }], passives: [] };
        this.onLevelUp = null;
        this.arenaLimits = null;

        // 3. Initialisation du passif unique
        this.passiveTimer = 0;
        this.killsSinceLastHeal = 0; // Pour le Vampire
        this._setupUniquePassive();
    }

    _createMesh(shadowGenerator) {
        const mesh = BABYLON.MeshBuilder.CreateCylinder("player", {diameter: 1, height: 1.8, tessellation: 16}, this.scene);
        const mat = new BABYLON.StandardMaterial("playerMat", this.scene);
        // On applique la couleur du perso pour le différencier visuellement
        mat.diffuseColor = BABYLON.Color3.FromHexString(this.characterData.color);
        mesh.material = mat;
        mesh.position.y = 0.9;
        shadowGenerator.addShadowCaster(mesh);
        return mesh;
    }

    _setupUniquePassive() {
        const passive = this.characterData.passive;

        // Visuel Aura (Paladin)
        if (passive.type === "aura") {
            this.auraMesh = BABYLON.MeshBuilder.CreateTorus("aura", {diameter: passive.radius * 2, thickness: 0.2}, this.scene);
            const auraMat = new BABYLON.StandardMaterial("auraMat", this.scene);
            auraMat.emissiveColor = new BABYLON.Color3(1, 1, 0); // Jaune brillant
            auraMat.alpha = 0.5;
            this.auraMesh.material = auraMat;
            this.auraMesh.parent = this.mesh;
            this.auraMesh.position.y = -0.8;
        }

        // Visuel Familier (Invocateur)
        if (passive.type === "companion") {
            this.companionMesh = BABYLON.MeshBuilder.CreateSphere("companion", {diameter: 0.6}, this.scene);
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

        // Logique Lifesteal (Vampire)
        if (passive.type === "lifesteal") {
            this.killsSinceLastHeal++;
            const required = Math.max(1, passive.killsRequired - Math.floor(this.stats.level / 5));

            if (this.killsSinceLastHeal >= required) {
                this.killsSinceLastHeal = 0;
                const heal = passive.healAmount + (this.maxHp * 0.01);
                this.heal(heal);
            }
        }
    }

    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        this.mesh.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
        setTimeout(() => { if (this.mesh && this.mesh.material) this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0); }, 200);
    }

    setLimits(limits) {
        this.arenaLimits = limits;
    }

    _setupInputs() {
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
            const key = evt.sourceEvent.key.toLowerCase();
            this.inputMap[key] = true;

            if (key === 'g') {
                this.godMode = !this.godMode;
                this.mesh.material.diffuseColor = this.godMode ? new BABYLON.Color3(1, 0.8, 0) : BABYLON.Color3.FromHexString(this.characterData.color);
            }
        }));
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key.toLowerCase()] = false;
        }));
    }
    update(enemyManager) {
        this._handleMovement();
        this._applyArenaLimits();
        this._updateVisualsAndInvincibility();
        this._handlePassives(enemyManager);
    }

    // --- SOUS-MÉTHODES DE MISE À JOUR ---

    _handleMovement() {
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
    }

    _applyArenaLimits() {
        if (!this.arenaLimits) return; // Early return si pas de limites

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
            // Clignotement rouge
            if (this.invincibilityTimer % 10 < 5) {
                this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
            } else {
                this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
            }
        } else if (this.currentHp < this.maxHp) {
            this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }
    }

    _handlePassives(enemyManager) {
        const passive = this.characterData.passive;
        this.passiveTimer++;

        if (passive.type === "aura") {
            this._processAura(passive, enemyManager);
        } else if (passive.type === "companion") {
            this._processCompanion(passive, enemyManager);
        }
    }

    _processAura(passive, enemyManager) {
        this.auraMesh.rotation.y += 0.02;

        // Early return pour éviter d'imbriquer tout le code
        if (this.passiveTimer % 15 !== 0 || !enemyManager) return;

        const radiusSq = passive.radius * passive.radius;
        const damage = passive.baseDamage * (1 + (this.stats.level * 0.1)) * this.stats.damageMult;

        for (let i = enemyManager.enemies.length - 1; i >= 0; i--) {
            const enemy = enemyManager.enemies[i];
            if (BABYLON.Vector3.DistanceSquared(this.mesh.position, enemy.position) < radiusSq) {
                if (enemyManager.takeDamage(i, damage)) {
                    this.onEnemyKill();
                }
            }
        }
    }

    _processCompanion(passive, enemyManager) {
        if (!enemyManager) return;

        // Orbite du compagnon
        this.companionMesh.position.x = Math.cos(this.passiveTimer * 0.05) * 1.5;
        this.companionMesh.position.z = Math.sin(this.passiveTimer * 0.05) * 1.5;

        if (this.passiveTimer % passive.cooldown !== 0) return;

        let closest = null;
        let minDist = passive.range * passive.range;

        enemyManager.enemies.forEach(enemy => {
            const dist = BABYLON.Vector3.DistanceSquared(this.mesh.position, enemy.position);
            if (dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        });

        if (closest) {
            this._fireCompanionLaser(passive, enemyManager, closest);
        }
    }

    _fireCompanionLaser(passive, enemyManager, target) {
        const damage = passive.baseDamage * this.stats.damageMult * (1 + (this.stats.level * 0.2));

        const laser = BABYLON.MeshBuilder.CreateLines("laser", {
            points: [this.companionMesh.getAbsolutePosition(), target.position]
        }, this.scene);
        laser.color = new BABYLON.Color3(0.5, 0, 1);
        setTimeout(() => laser.dispose(), 100);

        const index = enemyManager.enemies.indexOf(target);
        if (index > -1 && enemyManager.takeDamage(index, damage)) {
            this.onEnemyKill();
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

    _applyPassiveBonuses(itemData) {
        if (!itemData.statBonus) return;

        if (itemData.statBonus.damage) this.stats.damageMult += itemData.statBonus.damage;
        if (itemData.statBonus.crit) this.stats.critChance = (this.stats.critChance || 0) + itemData.statBonus.crit;
        if (itemData.statBonus.speed) this.stats.projectileSpeedMult += itemData.statBonus.speed;
        if (itemData.statBonus.moveSpeed) this.stats.moveSpeed += itemData.statBonus.moveSpeed;
        if (itemData.statBonus.cooldown) this.stats.cooldownMult -= itemData.statBonus.cooldown;

        if (itemData.statBonus.area) {
            this.stats.areaMult += itemData.statBonus.area;
            console.log("Area Multiplier:", this.stats.areaMult);
        }

        if (itemData.statBonus.duration) {
            this.stats.durationMult += itemData.statBonus.duration;
            console.log("Duration Multiplier:", this.stats.durationMult);
        }
    }
}