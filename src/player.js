import * as BABYLON from "@babylonjs/core";

export class Player {
    constructor(scene, shadowGenerator) {
        this.scene = scene;
        this.mesh = this._createMesh(shadowGenerator);
        this.speed = 0.3;
        this.inputMap = {};
        this._setupInputs();

        // Stats RPG
        this.stats = {
            level: 1,
            xp: 0,
            nextLevelXp: 5,
            kills: 0
        };
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
            moveVector.normalize().scaleInPlace(this.speed);
            this.mesh.position.addInPlace(moveVector);

            // Rotation
            const targetRot = Math.atan2(moveVector.x, moveVector.z);
            this.mesh.rotation.y = BABYLON.Scalar.Lerp(this.mesh.rotation.y, targetRot, 0.2);
        }
    }

    gainXp(amount) {
        this.stats.xp += amount;
        if(this.stats.xp >= this.stats.nextLevelXp) {
            this.levelUp();
            return true; // Retourne true si level up (pour l'UI)
        }
        return false;
    }

    levelUp() {
        this.stats.level++;
        this.stats.xp = 0;
        this.stats.nextLevelXp = Math.floor(this.stats.nextLevelXp * 1.5);

        // Effet visuel
        const originalColor = this.mesh.material.emissiveColor.clone();
        this.mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
        setTimeout(() => {
            this.mesh.material.emissiveColor = originalColor;
        }, 500);
    }
}