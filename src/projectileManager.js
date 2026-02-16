import * as BABYLON from "@babylonjs/core";

export class ProjectileManager {
    // AJOUT: on passe xpManager dans le constructeur
    constructor(scene, player, enemyManager, xpManager) {
        this.scene = scene;
        this.player = player;
        this.enemyManager = enemyManager;
        this.xpManager = xpManager; // On le stocke
        this.projectiles = [];
        this.masterMesh = this._createMasterMesh();

        this.attackTimer = 0;
        this.attackDelay = 30;
    }

    // ... (Garde _createMasterMesh identique) ...
    _createMasterMesh() {
        const master = BABYLON.MeshBuilder.CreateSphere("projMaster", {diameter: 0.6}, this.scene);
        const mat = new BABYLON.StandardMaterial("projMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0, 1, 1);
        mat.emissiveColor = new BABYLON.Color3(0, 0.8, 0.8);
        master.material = mat;
        master.isVisible = false;
        return master;
    }

    update() {
        this.attackTimer++;
        if (this.attackTimer > this.attackDelay) {
            this._fireAtNearest();
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.mesh.position.addInPlace(p.dir.scale(0.7));
            p.life--;

            let hit = false;
            const enemies = this.enemyManager.enemies;

            for (let j = enemies.length - 1; j >= 0; j--) {
                if (BABYLON.Vector3.DistanceSquared(p.mesh.position, enemies[j].position) < 2) {

                    // --- CHANGEMENT ICI ---
                    // 1. On définit combien d'XP donne cet ennemi (ex: 10 XP)
                    const xpAmount = 10;

                    // 2. On fait apparaître la gemme via le manager
                    this.xpManager.spawn(enemies[j].position, xpAmount);

                    // 3. On tue l'ennemi
                    this.enemyManager.removeEnemy(j);
                    this.player.stats.kills++;
                    // Note: On n'appelle plus player.gainXp() ici, c'est le ramassage de gemme qui le fera !

                    hit = true;
                    break;
                }
            }

            if (p.life <= 0 || hit) {
                p.mesh.dispose();
                this.projectiles.splice(i, 1);
            }
        }
    }

    _fireAtNearest() {
        let nearest = null;
        let minDist = 400;

        this.enemyManager.enemies.forEach(e => {
            const d = BABYLON.Vector3.DistanceSquared(this.player.mesh.position, e.position);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        });

        if (nearest) {
            const proj = this.masterMesh.createInstance("proj");
            proj.position = this.player.mesh.position.clone();
            const dir = nearest.position.subtract(this.player.mesh.position).normalize();
            this.projectiles.push({ mesh: proj, dir: dir, life: 70 });
            this.attackTimer = 0;
        }
    }
}