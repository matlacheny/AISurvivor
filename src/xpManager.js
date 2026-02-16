import * as BABYLON from "@babylonjs/core";

export class XpManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.gems = []; // Liste des gemmes actives
        this.masterMesh = this._createMasterMesh();

        // Paramètres ajustables
        this.magnetRange = 36; // Distance d'attraction (6 au carré)
        this.pickupRange = 1.5; // Distance de ramassage
        this.magnetSpeed = 0.5; // Vitesse de vol vers le joueur
    }

    _createMasterMesh() {
        // Un petit octaèdre (cristal)
        const master = BABYLON.MeshBuilder.CreatePolyhedron("xpMaster", {type: 1, size: 0.25}, this.scene);
        const mat = new BABYLON.StandardMaterial("xpMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2); // Vert
        mat.emissiveColor = new BABYLON.Color3(0, 0.6, 0); // Brillant
        master.material = mat;
        master.isVisible = false;
        return master;
    }

    /**
     * Fait tomber de l'XP à une position donnée
     * @param {BABYLON.Vector3} position - Où l'ennemi est mort
     * @param {number} amount - Quantité d'XP (Ajustable ici !)
     */
    spawn(position, amount) {
        const gem = this.masterMesh.createInstance("gem");
        gem.position = position.clone();
        gem.position.y = 0.5; // Un peu au-dessus du sol
        gem.rotation.x = Math.random() * Math.PI;

        // On stocke la valeur d'XP directement dans l'objet gemme
        gem.xpValue = amount;

        this.gems.push(gem);
    }

    update() {
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];

            // Animation simple (rotation)
            gem.rotation.y += 0.05;

            // Calcul distance joueur (DistanceSquared est plus rapide que Distance)
            const distSquared = BABYLON.Vector3.DistanceSquared(this.player.mesh.position, gem.position);

            // 1. AIMANT : Si le joueur est assez proche, la gemme vole vers lui
            if (distSquared < this.magnetRange) {
                const direction = this.player.mesh.position.subtract(gem.position).normalize();
                gem.position.addInPlace(direction.scale(this.magnetSpeed));

                // 2. RAMASSAGE : Si très proche
                if (distSquared < this.pickupRange) {
                    // Donner l'XP au joueur
                    this.player.gainXp(gem.xpValue);

                    // Nettoyage
                    gem.dispose();
                    this.gems.splice(i, 1);
                }
            }
            // Optimisation : Supprimer les gemmes oubliées très loin (plus de 60 unités)
            else if (distSquared > 3600) {
                gem.dispose();
                this.gems.splice(i, 1);
            }
        }
    }
}