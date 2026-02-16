import * as BABYLON from "@babylonjs/core";

export class EnemyManager {
    constructor(scene, shadowGenerator, player) {
        this.scene = scene;
        this.player = player;
        this.enemies = []; // Liste active
        this.masterMesh = this._createMasterMesh();
        this.shadowGenerator = shadowGenerator;
        this.spawnRate = 40; // Frames
    }

    _createMasterMesh() {
        const master = BABYLON.MeshBuilder.CreateBox("enemyMaster", {size: 1.2}, this.scene);
        const mat = new BABYLON.StandardMaterial("enemyMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
        mat.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
        master.material = mat;
        master.isVisible = false;
        return master;
    }

    spawn() {
        const enemy = this.masterMesh.createInstance("enemy_" + Date.now());
        const angle = Math.random() * Math.PI * 2;
        const radius = 30; // Spawn hors écran

        enemy.position.x = this.player.mesh.position.x + Math.cos(angle) * radius;
        enemy.position.z = this.player.mesh.position.z + Math.sin(angle) * radius;
        enemy.position.y = 0.6;

        this.shadowGenerator.addShadowCaster(enemy);
        this.enemies.push(enemy);
    }

    update() {
        // Spawn logique
        if (this.scene.getFrameId() % this.spawnRate === 0) {
            this.spawn();
        }

        // Mouvement
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const direction = this.player.mesh.position.subtract(enemy.position).normalize();

            // Vitesse augmente légèrement avec le niveau du joueur
            const speed = 0.1 + (this.player.stats.level * 0.01);
            enemy.position.addInPlace(direction.scale(speed));
            enemy.rotation.y += 0.05;

            // Despawn si trop loin (nettoyage)
            if (BABYLON.Vector3.Distance(this.player.mesh.position, enemy.position) > 60) {
                enemy.dispose();
                this.enemies.splice(i, 1);
            }
        }
    }

    removeEnemy(index) {
        this.enemies[index].dispose();
        this.enemies.splice(index, 1);
    }
}