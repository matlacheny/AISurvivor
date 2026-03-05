import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders"; // Indispensable pour charger des .glb plus tard

export class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.meshes = {}; // Dictionnaire de tes modèles "Maîtres"
    }


    // Cette fonction devient 'async' car charger de vrais fichiers 3D prend du temps
    async loadAll() {
        console.log("Chargement des assets...");

        // --- FONCTION UTILITAIRE POUR CRÉER LES ENNEMIS ---
        const createEnemyMaster = (name, colorHex, size) => {
            const mesh = BABYLON.MeshBuilder.CreateBox(name, {size}, this.scene);
            const mat = new BABYLON.StandardMaterial(name+"Mat", this.scene);
            mat.diffuseColor = BABYLON.Color3.FromHexString(colorHex);
            mesh.material = mat;
            mesh.isVisible = false;
            return mesh;
        };

        // ==========================================
        // 1. TES PLACEHOLDERS ACTUELS
        // (Tu supprimeras ce bloc quand tu auras tes vrais modèles)
        // ==========================================

        // Joueur
        this.meshes.player = BABYLON.MeshBuilder.CreateCylinder("playerMaster", {diameter: 1, height: 1.8, tessellation: 16}, this.scene);

        // --- LES 4 TYPES D'ENNEMIS ---
        this.meshes.enemy_standard = createEnemyMaster("e_standard", "#ff3333", 1.2); // Rouge
        this.meshes.enemy_fast = createEnemyMaster("e_fast", "#ffff33", 0.8);     // Jaune (Petit)
        this.meshes.enemy_tank = createEnemyMaster("e_tank", "#3333ff", 2.0);     // Bleu (Gros)
        this.meshes.enemy_shooter = createEnemyMaster("e_shooter", "#ff33ff", 1.2); // Violet

        // --- LE PROJECTILE ENNEMI ---
        this.meshes.enemy_proj = BABYLON.MeshBuilder.CreateSphere("eProj", {diameter: 0.5}, this.scene);
        const pMat = new BABYLON.StandardMaterial("eProjMat", this.scene);
        pMat.emissiveColor = new BABYLON.Color3(1, 0, 1); // Violet brillant
        this.meshes.enemy_proj.material = pMat;
        this.meshes.enemy_proj.isVisible = false;

        // Boss (Exemple)
        this.meshes.boss = BABYLON.MeshBuilder.CreateBox("bossMaster", {size: 1}, this.scene);


        // ==========================================
        // 2. COMMENT CHARGER TES VRAIS ASSETS (PLUS TARD)
        // ==========================================
        /*
        // Quand tu seras prêt, mets tes fichiers .glb dans le dossier public/models/ de ton projet Vite.
        // Puis décommente ceci :

        // Charger le Joueur
        const playerResult = await BABYLON.SceneLoader.ImportMeshAsync("", "/models/", "mon_chevalier.glb", this.scene);
        this.meshes.player = playerResult.meshes[0];
        // Optionnel : this.meshes.player.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5); // Si trop grand

        // Charger l'Ennemi
        const enemyResult = await BABYLON.SceneLoader.ImportMeshAsync("", "/models/", "mon_zombie.glb", this.scene);
        this.meshes.enemy = enemyResult.meshes[0];
        */

        // ==========================================
        // 3. FINALISATION (On cache les modèles maîtres)
        // ==========================================
        for (const key in this.meshes) {
            this.meshes[key].isVisible = false;
        }

        console.log("Assets chargés !");
    }
}