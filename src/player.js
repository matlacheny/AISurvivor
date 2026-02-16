import * as BABYLON from "@babylonjs/core";
// IMPORTANT: On enlève la logique de LevelUp interne du Player,
// car elle est maintenant gérée par le Main -> UpgradeManager

export class Player {
    constructor(scene, shadowGenerator) {
        this.scene = scene;
        this.mesh = this._createMesh(shadowGenerator);
        this.inputMap = {};
        this._setupInputs();

        // Stats RPG
        this.stats = {
            level: 1,
            xp: 0,
            nextLevelXp: 5,
            kills: 0,
            // Modificateurs globaux
            damageMult: 1,
            moveSpeed: 0.3,
            cooldownMult: 1
        };

        // Inventaire
        this.inventory = {
            weapons: [{ id: "magic_wand", level: 1 }], // Arme de départ
            passives: []
        };

        // Callback pour notifier le main.js du level up
        this.onLevelUp = null;
    }

    // ... _createMesh et _setupInputs restent identiques ...
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
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => this.inputMap[evt.sourceEvent.key.toLowerCase()] = true));
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => this.inputMap[evt.sourceEvent.key.toLowerCase()] = false));
    }

    update() {
        let moveVector = new BABYLON.Vector3(0, 0, 0);
        if (this.inputMap["z"] || this.inputMap["w"]) moveVector.z = 1;
        if (this.inputMap["s"]) moveVector.z = -1;
        if (this.inputMap["q"] || this.inputMap["a"]) moveVector.x = -1;
        if (this.inputMap["d"]) moveVector.x = 1;

        if (moveVector.length() > 0) {
            // Utilise la stat de vitesse
            moveVector.normalize().scaleInPlace(this.stats.moveSpeed);
            this.mesh.position.addInPlace(moveVector);
            const targetRot = Math.atan2(moveVector.x, moveVector.z);
            this.mesh.rotation.y = BABYLON.Scalar.Lerp(this.mesh.rotation.y, targetRot, 0.2);
        }
    }

    gainXp(amount) {
        this.stats.xp += amount;
        if(this.stats.xp >= this.stats.nextLevelXp) {
            this.stats.level++;
            this.stats.xp = 0; // Surplus perdu pour simplifier
            this.stats.nextLevelXp = Math.floor(this.stats.nextLevelXp * 1.5);

            // On déclenche l'événement externe
            if(this.onLevelUp) this.onLevelUp();
        }
    }

    addItem(itemData) {
        if (itemData.type === 'evolution') {
            this._addEvolution(itemData);
        } else {
            this._addStandardItem(itemData);
        }
    }

    _addEvolution(itemData) {
        // Logic for evolution (Replace base weapon, add evolved form)
        // Note: As per your previous simplified logic, we just add it here.
        // In a full version, you would find and remove the 'source' weapon.
        this.inventory.weapons.push({ id: itemData.id, level: 1 });
        console.log("Arme évoluée acquise !");
    }

    _addStandardItem(itemData) {
        const list = itemData.type === 'weapon' ? this.inventory.weapons : this.inventory.passives;
        const existing = list.find(i => i.id === itemData.id);

        if (existing) {
            existing.level++;
            console.log(`Level Up ${itemData.name}: ${existing.level}`);
        } else {
            list.push({ id: itemData.id, level: 1 });
            console.log(`Nouvel item: ${itemData.name}`);
        }

        // Separate the passive stat logic to keep this function clean
        if (itemData.type === 'passive') {
            this._applyPassiveBonuses(itemData);
        }
    }

    _applyPassiveBonuses(itemData) {
        if (!itemData.statBonus) return;

        if (itemData.statBonus.damage) {
            this.stats.damageMult += itemData.statBonus.damage;
        }
        if (itemData.statBonus.crit) {
            this.stats.critChance = (this.stats.critChance || 0) + itemData.statBonus.crit;
        }
        if (itemData.statBonus.speed) { // Example for future speed items
            this.stats.moveSpeed += itemData.statBonus.speed;
        }
    }
}