import * as BABYLON from "@babylonjs/core";

export const ARENAS = {
    "infinite": {
        name: "Plaine Infinie",
        description: "Un espace sans fin. Idéal pour débuter.",
        type: "infinite",
        width: 100, height: 100,
        limits: null,
        //groundTexture: "/textures/texture_herbe.png",
        groundTexture: "/textures/texture_test.jpg",
        textureScale: 10 // combien de fois la texture se répète sur le sol
    },
    "corridor": {
        name: "Le Couloir",
        description: "Un long couloir vertical. Attention aux côtés !",
        type: "vertical_scroll",
        width: 30, height: 100,
        limits: { minX: -14, maxX: 14, minZ: null, maxZ: null },
        groundTexture: "/textures/texture_couloir.jpg",
        textureScale: 5
    },
    "coliseum": {
        name: "L'Arène de Sang",
        description: "Un espace clos. Nulle part où fuir.",
        type: "fixed",
        width: 60, height: 60,
        limits: { minX: -28, maxX: 28, minZ: -28, maxZ: 28 },
        groundTexture: "/textures/texture_colliseum.png",
        textureScale: 8
    }
};

export class ArenaManager {
    constructor(scene) {
        this.scene = scene;
        this.currentArena = null;
        this.ground = null;
        this._groundTexture = null; // référence pour le scroll UV
        this._lastPlayerPos = new BABYLON.Vector3(0, 0, 0);
    }

    setupArena(arenaId) {
        const config = ARENAS[arenaId] || ARENAS["infinite"];
        this.currentArena = config;

        if (this.ground) this.ground.dispose();
        if (this._groundTexture) this._groundTexture.dispose();

        // Sol légèrement plus grand que la caméra ne voit
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width: config.width + 20,
            height: config.height + 20,
            subdivisions: 1 // Pas besoin de subdivisions pour le UV scroll
        }, this.scene);

        const groundMat = new BABYLON.StandardMaterial("groundMat", this.scene);

        // ── Texture avec tiling ──
        const tex = new BABYLON.Texture(config.groundTexture, this.scene);
        tex.uScale = config.textureScale; // Répétitions horizontales
        tex.vScale = config.textureScale; // Répétitions verticales
        tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;

        groundMat.diffuseTexture = tex;
        groundMat.specularColor = new BABYLON.Color3(0, 0, 0); // Pas de reflet
        this._groundTexture = tex;

        this.ground.material = groundMat;
        this.ground.receiveShadows = true;

        this._createWalls(config);
        return config;
    }

    // Appelé à chaque frame
    update(playerPos) {
        if (!this.ground || !this.currentArena) return;

        const type = this.currentArena.type;
        const scale = this.currentArena.textureScale;
        const groundSize = this.currentArena.width + 20;

        if (type === "infinite") {
            // Le sol suit le joueur
            this.ground.position.x = playerPos.x;//Math.round(playerPos.x);
            this.ground.position.z = playerPos.z;//Math.round(playerPos.z);

            // UV scroll : décale la texture à l'opposé du déplacement
            // Divisé par groundSize pour normaliser en coordonnées UV (0→1)
            this._groundTexture.uOffset = (playerPos.x / groundSize) * scale;
            this._groundTexture.vOffset = (playerPos.z / groundSize) * scale;
        }
        else if (type === "vertical_scroll") {
            this.ground.position.x = 0;
            this.ground.position.z = playerPos.z;

            const groundHeight = this.currentArena.height + 20; // ← 120 au lieu de 50

            this._groundTexture.uOffset = 0;
            this._groundTexture.vOffset = (playerPos.z / groundHeight) * scale;
        }
        else {
            // Fixe : ni position ni scroll
            this.ground.position.x = 0;
            this.ground.position.z = 0;
        }
    }

    _createWalls(config) {
        const wallHeight = 5;
        const mat = new BABYLON.StandardMaterial("wallMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.1, 0.1);
        mat.alpha = 0.5;

        if (config.type !== "infinite") {
            const wallLeft = BABYLON.MeshBuilder.CreateBox("wallL",
                { width: 1, height: wallHeight, depth: config.height * 3 }, this.scene);
            wallLeft.position.x = -config.width / 2;
            wallLeft.material = mat;
            wallLeft.parent = this.ground;

            const wallRight = BABYLON.MeshBuilder.CreateBox("wallR",
                { width: 1, height: wallHeight, depth: config.height * 3 }, this.scene);
            wallRight.position.x = config.width / 2;
            wallRight.material = mat;
            wallRight.parent = this.ground;
        }

        if (config.type === "fixed") {
            const wallTop = BABYLON.MeshBuilder.CreateBox("wallT",
                { width: config.width, height: wallHeight, depth: 1 }, this.scene);
            wallTop.position.z = config.height / 2;
            wallTop.material = mat;
            wallTop.parent = this.ground;

            const wallBot = BABYLON.MeshBuilder.CreateBox("wallB",
                { width: config.width, height: wallHeight, depth: 1 }, this.scene);
            wallBot.position.z = -config.height / 2;
            wallBot.material = mat;
            wallBot.parent = this.ground;
        }
    }
}