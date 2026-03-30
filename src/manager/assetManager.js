import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * Ajoute récursivement tous les AbstractMesh enfants d'un nœud
 * comme shadow casters. À utiliser à la place de addShadowCaster(transformNode).
 */
export function addShadowCastersDeep(shadowGenerator, node) {
    if (node instanceof BABYLON.AbstractMesh) {
        shadowGenerator.addShadowCaster(node);
    }
    node.getChildren(null, false).forEach(child => addShadowCastersDeep(shadowGenerator, child));
}

export class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.meshes = {};
        this.isReady = false;
    }

    async _loadGLB(masterName, folder, fileName) {
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", `/models/${folder}/`, fileName, this.scene);

        const root = result.meshes[0];
        const master = new BABYLON.TransformNode(masterName, this.scene);
        root.parent = master;
        root.position = BABYLON.Vector3.Zero();
        root.rotation = BABYLON.Vector3.Zero();
        master.position = BABYLON.Vector3.Zero();
        master.setEnabled(false);
        return master;
    }

    cloneEnemy(typeId, uniqueName) {
        const master = this.meshes[typeId];
        if (!master) throw new Error(`[AssetManager] Asset introuvable : ${typeId}`);

        const deepClone = (node, newParent) => {
            let cloned;
            if (node instanceof BABYLON.AbstractMesh) {
                cloned = node.clone(uniqueName + "_" + node.name, newParent);
                if (cloned) { cloned.isVisible = true; cloned.setEnabled(true); }
            } else {
                cloned = node.clone(uniqueName + "_" + node.name, newParent);
                if (cloned) cloned.setEnabled(true);
            }
            if (cloned) node.getChildren().forEach(c => deepClone(c, cloned));
            return cloned;
        };

        const clone = master.clone(uniqueName, null);
        clone.setEnabled(true);
        master.getChildren().forEach(c => deepClone(c, clone));
        return clone;
    }

    async loadAll() {
        console.log("[AssetManager] Chargement des assets...");

        const enemyConfigs = [
            // scale : ajuste ici si un modèle GLB est trop grand/petit.
            // La taille finale en jeu = scale_ici × typeConfig.scale (dans enemyData.js)
            { key: "enemy_standard", folder: "normal-bot",  file: "robot_bad_enemy.glb",                          scale: 1    },
            { key: "enemy_fast",     folder: "fast-bot",    file: "cnf_model_a__walker_detection_robot.glb",     scale: 0.01 },
            { key: "enemy_tank",     folder: "tank-bot",    file: "voxel_armored_guard_robot.glb",               scale: 1    },
            { key: "enemy_shooter",  folder: "shooter-bot", file: "cnf_model_b1__crawler_grenade_launcher.glb",  scale: 1    },
        ];

        await Promise.all(enemyConfigs.map(async ({ key, folder, file }) => {
            try {
                this.meshes[key] = await this._loadGLB(key + "Master", folder, file);
                console.log(`[AssetManager] ✓ ${key}`);
            } catch (err) {
                console.warn(`[AssetManager] ✗ ${key} → fallback primitif`, err.message);
                this.meshes[key] = this._makeFallbackEnemy(key);
            }
        }));

        // Projectile ennemi
        const eProj = BABYLON.MeshBuilder.CreateSphere("eProj", { diameter: 0.5 }, this.scene);
        const eProjMat = new BABYLON.StandardMaterial("eProjMat", this.scene);
        eProjMat.emissiveColor = new BABYLON.Color3(1, 0, 1);
        eProj.material = eProjMat;
        eProj.isVisible = false;
        this.meshes.enemy_proj = eProj;

        // Joueur
        this.meshes.player = this._makePlayerMesh();

        this.isReady = true;
        console.log("[AssetManager] ✓ Tous les assets sont prêts.");
    }

    _makeFallbackEnemy(key) {
        const colors = {
            enemy_standard: new BABYLON.Color3(0.2, 0.8, 0.2),
            enemy_fast:     new BABYLON.Color3(0.2, 0.6, 1.0),
            enemy_tank:     new BABYLON.Color3(0.7, 0.1, 0.1),
            enemy_shooter:  new BABYLON.Color3(1.0, 0.5, 0.0),
        };
        const color = colors[key] || new BABYLON.Color3(0.5, 0.5, 0.5);
        const master = new BABYLON.TransformNode(key + "FallbackMaster", this.scene);

        const body = BABYLON.MeshBuilder.CreateCapsule(key + "_body",
            { radius: 0.5, height: 1.6, tessellation: 8 }, this.scene);
        const mat = new BABYLON.StandardMaterial(key + "_mat", this.scene);
        mat.diffuseColor = color;
        mat.emissiveColor = color.scale(0.25);
        body.material = mat;
        body.parent = master;

        const eyeMat = new BABYLON.StandardMaterial(key + "_eyeMat", this.scene);
        eyeMat.emissiveColor = new BABYLON.Color3(1, 0.1, 0.1);
        [[-0.2, 0.4, 0.45], [0.2, 0.4, 0.45]].forEach(([x, y, z], i) => {
            const eye = BABYLON.MeshBuilder.CreateSphere(key + "_eye" + i,
                { diameter: 0.15, segments: 4 }, this.scene);
            eye.position = new BABYLON.Vector3(x, y, z);
            eye.material = eyeMat;
            eye.parent = body;
        });

        master.setEnabled(false);
        return master;
    }

    _makePlayerMesh() {
        const master = new BABYLON.TransformNode("playerMaster", this.scene);

        const body = BABYLON.MeshBuilder.CreateCylinder("playerBody",
            { diameter: 0.9, height: 1.4, tessellation: 12 }, this.scene);
        body.position.y = 0;
        body.parent = master;

        const head = BABYLON.MeshBuilder.CreateSphere("playerHead",
            { diameter: 0.65, segments: 8 }, this.scene);
        head.position.y = 1.05;
        head.parent = master;

        const arrow = BABYLON.MeshBuilder.CreateCylinder("playerArrow",
            { diameterTop: 0, diameterBottom: 0.25, height: 0.5, tessellation: 4 }, this.scene);
        arrow.rotation.x = Math.PI / 2;
        arrow.position.z = 0.6;
        arrow.position.y = 0.1;
        arrow.parent = master;

        master.setEnabled(false);
        return master;
    }
}