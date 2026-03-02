import * as BABYLON from "@babylonjs/core";

export const ARENAS = {
    "infinite": {
        name: "Plaine Infinie",
        description: "Un espace sans fin. Idéal pour débuter.",
        type: "infinite", // Le sol suit le joueur sur X et Z
        width: 100, height: 100,
        limits: null // Pas de limites de déplacement
    },
    "corridor": {
        name: "Le Couloir",
        description: "Un long couloir vertical. Attention aux côtés !",
        type: "vertical_scroll", // Le sol suit le joueur sur Z uniquement
        width: 30, height: 100,
        limits: { minX: -14, maxX: 14, minZ: null, maxZ: null } // Bloqué sur les côtés
    },
    "coliseum": {
        name: "L'Arène de Sang",
        description: "Un espace clos. Nulle part où fuir.",
        type: "fixed", // Le sol ne bouge pas
        width: 60, height: 60,
        limits: { minX: -28, maxX: 28, minZ: -28, maxZ: 28 } // Bloqué partout
    }
};

export class ArenaManager {
    constructor(scene) {
        this.scene = scene;
        this.currentArena = null;
        this.ground = null;
    }

    setupArena(arenaId) {
        const config = ARENAS[arenaId] || ARENAS["infinite"];
        this.currentArena = config;

        // 1. Nettoyage de l'ancien sol si existant
        if (this.ground) this.ground.dispose();

        // 2. Création du sol
        // On le fait un peu plus grand visuellement pour éviter les coupures
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width: config.width + 20,
            height: config.height + 20
        }, this.scene);

        const groundMat = new BABYLON.StandardMaterial("groundMat", this.scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.18);
        groundMat.specularColor = new BABYLON.Color3(0, 0, 0);

        // Grille pour voir le mouvement
        // Texture procédurale simple ou wireframe
        groundMat.wireframe = true;
        this.ground.material = groundMat;
        this.ground.receiveShadows = true;

        // 3. Création des Murs (si l'arène n'est pas infinie)
        this._createWalls(config);

        return config;
    }

    _createWalls(config) {
        const wallHeight = 5;
        const mat = new BABYLON.StandardMaterial("wallMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.1, 0.1);
        mat.alpha = 0.5; // Transparent

        // Murs Gauche/Droite (Pour Corridor et Coliseum)
        if (config.type !== "infinite") {
            const wallLeft = BABYLON.MeshBuilder.CreateBox("wallL", { width: 1, height: wallHeight, depth: config.height * 3 }, this.scene);
            wallLeft.position.x = -config.width / 2;
            wallLeft.material = mat;
            // On attache le mur au sol pour qu'il bouge avec lui (pour le couloir)
            wallLeft.parent = this.ground;

            const wallRight = BABYLON.MeshBuilder.CreateBox("wallR", { width: 1, height: wallHeight, depth: config.height * 3 }, this.scene);
            wallRight.position.x = config.width / 2;
            wallRight.material = mat;
            wallRight.parent = this.ground;
        }

        // Murs Haut/Bas (Uniquement pour Coliseum)
        if (config.type === "fixed") {
            const wallTop = BABYLON.MeshBuilder.CreateBox("wallT", { width: config.width, height: wallHeight, depth: 1 }, this.scene);
            wallTop.position.z = config.height / 2;
            wallTop.material = mat;
            wallTop.parent = this.ground;

            const wallBot = BABYLON.MeshBuilder.CreateBox("wallB", { width: config.width, height: wallHeight, depth: 1 }, this.scene);
            wallBot.position.z = -config.height / 2;
            wallBot.material = mat;
            wallBot.parent = this.ground;
        }
    }

    // Appelé à chaque frame pour gérer l'illusion d'infini
    update(playerPos) {
        if (!this.ground || !this.currentArena) return;

        if (this.currentArena.type === "infinite") {
            // Le sol suit le joueur partout
            this.ground.position.x = Math.round(playerPos.x);
            this.ground.position.z = Math.round(playerPos.z);
        }
        else if (this.currentArena.type === "vertical_scroll") {
            // Le sol ne suit que sur Z (couloir)
            this.ground.position.x = 0; // Fixe en X
            this.ground.position.z = Math.round(playerPos.z);
        }
        else {
            // Fixe : le sol ne bouge pas du tout
            this.ground.position.x = 0;
            this.ground.position.z = 0;
        }
    }
}