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

        // ==========================================
        // 1. TES PLACEHOLDERS ACTUELS
        // (Tu supprimeras ce bloc quand tu auras tes vrais modèles)
        // ==========================================

        // Joueur
        this.meshes.player = BABYLON.MeshBuilder.CreateCylinder("playerMaster", {diameter: 1, height: 1.8, tessellation: 16}, this.scene);

        // Ennemi standard
        this.meshes.enemy = BABYLON.MeshBuilder.CreateBox("enemyMaster", {size: 1.2}, this.scene);

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