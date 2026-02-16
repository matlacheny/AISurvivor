import * as BABYLON from "@babylonjs/core";

export class EnemyManager {
    constructor(scene, shadowGenerator, player) {
        this.scene = scene;
        this.player = player;
        this.enemies = [];
        this.masterMesh = this._createMasterMesh();
        this.shadowGenerator = shadowGenerator;

        this.startTime = Date.now(); // Pour le scaling
        this.spawnRate = 40;
    }

    _createMasterMesh() {
        // Un cube simple pour l'instant
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
        enemy.uniqueId = Date.now() + "_" + Math.random();

        // Spawn circulaire
        const angle = Math.random() * Math.PI * 2;
        const radius = 35;
        enemy.position.x = this.player.mesh.position.x + Math.cos(angle) * radius;
        enemy.position.z = this.player.mesh.position.z + Math.sin(angle) * radius;
        enemy.position.y = 0.6;

        // --- SCALING HP ---
        // 10 PV de base + 1 PV toutes les 10 secondes de jeu
        const timePlayedSeconds = (Date.now() - this.startTime) / 1000;
        const scaledHp = 10 + Math.floor(timePlayedSeconds / 10);

        enemy.maxHp = scaledHp;
        enemy.hp = scaledHp;

        this.shadowGenerator.addShadowCaster(enemy);
        this.enemies.push(enemy);
    }

    update() {
        if (this.scene.getFrameId() % this.spawnRate === 0) this.spawn();

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const direction = this.player.mesh.position.subtract(enemy.position).normalize();

            // Vitesse
            const speed = 0.12;
            enemy.position.addInPlace(direction.scale(speed));
            enemy.rotation.y += 0.05;

            // Despawn distance
            if (BABYLON.Vector3.Distance(this.player.mesh.position, enemy.position) > 60) {
                enemy.dispose();
                this.enemies.splice(i, 1);
            }
        }
    }

    // Méthode pour appliquer des dégâts
    takeDamage(index, amount) {
        const enemy = this.enemies[index];
        if(!enemy) return false;

        enemy.hp -= amount;

        // Effet visuel (clignote blanc)
        // Note: instancedMesh ne supporte pas bien les changements de matériel individuels sans astuce,
        // mais on peut scaler brièvement pour montrer l'impact
        enemy.scaling = new BABYLON.Vector3(1.4, 1.4, 1.4);
        setTimeout(() => { if(enemy) enemy.scaling = new BABYLON.Vector3(1, 1, 1); }, 100);

        if (enemy.hp <= 0) {
            this.removeEnemy(index);
            return true; // Est mort
        }
        return false; // Survivant
    }

    removeEnemy(index) {
        if(this.enemies[index]) {
            this.enemies[index].dispose();
            this.enemies.splice(index, 1);
        }
    }
}