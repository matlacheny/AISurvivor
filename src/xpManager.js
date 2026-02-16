import * as BABYLON from "@babylonjs/core";

export class XpManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.gems = [];

        // --- 3 MASTERS DIFFÉRENTS ---
        // On crée 3 modèles cachés pour les instancier plus tard
        this.masters = {
            low: this._createMasterMesh(new BABYLON.Color3(0.2, 1, 0.2), 0.25), // Vert, Petit
            medium: this._createMasterMesh(new BABYLON.Color3(0, 0.5, 1), 0.4), // Bleu, Moyen
            big: this._createMasterMesh(new BABYLON.Color3(0.8, 0, 1), 0.7)     // Violet, Gros
        };

        // Paramètres
        this.magnetRange = 36; // Distance au carré (6*6)
        this.pickupRange = 2;
        this.magnetSpeed = 0.5;
    }

    _createMasterMesh(color, size) {
        // Polyhedron type 2 ressemble à un cristal
        const master = BABYLON.MeshBuilder.CreatePolyhedron("xpMaster", {type: 2, size: size}, this.scene);
        const mat = new BABYLON.StandardMaterial("xpMat", this.scene);
        mat.diffuseColor = color;
        mat.emissiveColor = color.scale(0.6); // Brillant
        master.material = mat;
        master.isVisible = false;
        return master;
    }

    /**
     * Fait apparaître une gemme aléatoire selon les probabilités
     */
    spawn(position) {
        // Tirage aléatoire entre 0 et 100
        const rand = Math.random() * 100;

        let selectedMaster, xpValue;

        // 80% de chance (0 -> 80)
        if (rand < 80) {
            selectedMaster = this.masters.low;
            xpValue = 5;
        }
        // 15% de chance (80 -> 95)
        else if (rand < 95) {
            selectedMaster = this.masters.medium;
            xpValue = 15;
        }
        // 5% de chance (95 -> 100)
        else {
            selectedMaster = this.masters.big;
            xpValue = 100;
        }

        // Création de l'instance
        const gem = selectedMaster.createInstance("gem_" + Date.now());
        gem.position = position.clone();
        gem.position.y = 0.5;
        gem.rotation.x = Math.random() * Math.PI;
        gem.rotation.y = Math.random() * Math.PI;

        // On attache la valeur directement à l'objet 3D
        gem.xpValue = xpValue;

        this.gems.push(gem);
    }

    update() {
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];

            // Animation : rotation douce
            gem.rotation.y += 0.05;

            const distSquared = BABYLON.Vector3.DistanceSquared(this.player.mesh.position, gem.position);

            // 1. AIMANT
            if (distSquared < this.magnetRange) {
                const direction = this.player.mesh.position.subtract(gem.position).normalize();

                // Effet d'accélération : plus on est proche, plus ça va vite
                const speed = this.magnetSpeed + (10 / (distSquared + 1));
                gem.position.addInPlace(direction.scale(speed * 0.1));

                // 2. RAMASSAGE
                if (distSquared < this.pickupRange) {
                    this.player.gainXp(gem.xpValue);

                    gem.dispose();
                    this.gems.splice(i, 1);
                }
            }
            // Nettoyage si trop loin (optimisation)
            else if (distSquared > 3600) { // 60 unités
                gem.dispose();
                this.gems.splice(i, 1);
            }
        }
    }
}