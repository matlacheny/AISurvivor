import './style.css';
import * as BABYLON from "@babylonjs/core";
import { createBaseScene } from './sceneSetup.js';
import { Player } from './player.js';
import { EnemyManager } from './enemyManager.js';
import { ProjectileManager } from './projectileManager.js';
import { UIManager } from './ui.js';
import { XpManager } from './xpManager.js'; // <-- IMPORT

// --- INIT ENGINE ---
const CANVAS = document.createElement("canvas");
CANVAS.style.width = "100%";
CANVAS.style.height = "100%";
CANVAS.style.outline = "none";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(CANVAS);

const ENGINE = new BABYLON.Engine(CANVAS, true);

// --- INIT GAME ---
const { scene, camera, shadowGenerator, ground, CAM_OFFSET } = createBaseScene(ENGINE, CANVAS);
const ui = new UIManager();
const player = new Player(scene, shadowGenerator);
const enemyManager = new EnemyManager(scene, shadowGenerator, player);

// 1. Création du XpManager
const xpManager = new XpManager(scene, player);

// 2. Injection du xpManager dans le ProjectileManager
const projectileManager = new ProjectileManager(scene, player, enemyManager, xpManager);

// --- GAME LOOP ---
scene.onBeforeRenderObservable.add(() => {
    player.update();
    enemyManager.update();
    projectileManager.update();

    // 3. Update XP
    xpManager.update();

    ui.update(player.stats);

    // Caméra Suiveuse
    camera.position.x = player.mesh.position.x + CAM_OFFSET.x;
    camera.position.y = player.mesh.position.y + CAM_OFFSET.y;
    camera.position.z = player.mesh.position.z + CAM_OFFSET.z;
    camera.setTarget(player.mesh.position);

    ground.position.x = Math.round(player.mesh.position.x);
    ground.position.z = Math.round(player.mesh.position.z);
});

ENGINE.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    ENGINE.resize();
});