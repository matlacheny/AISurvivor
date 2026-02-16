import './style.css';
import * as BABYLON from "@babylonjs/core";
import { createBaseScene } from './sceneSetup.js';
import { Player } from './player.js';
import { EnemyManager } from './enemyManager.js';
import { ProjectileManager } from './projectileManager.js';
import { UIManager } from './ui.js';
import { XpManager } from './xpManager.js';
import { UpgradeManager } from './upgradeManager.js'; // <-- IMPORT

// --- INIT ENGINE ---
const CANVAS = document.createElement("canvas");
CANVAS.style.width = "100%";
CANVAS.style.height = "100%";
CANVAS.style.outline = "none";

// AJOUT IMPORTANT : Permet au canvas de recevoir le focus clavier
CANVAS.tabIndex = 1;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(CANVAS);

// On donne le focus immédiatement au lancement
CANVAS.focus();

const ENGINE = new BABYLON.Engine(CANVAS, true);

// --- INIT MODULES ---
const { scene, camera, shadowGenerator, ground, CAM_OFFSET } = createBaseScene(ENGINE, CANVAS);
const ui = new UIManager();
const player = new Player(scene, shadowGenerator);
const enemyManager = new EnemyManager(scene, shadowGenerator, player);
const xpManager = new XpManager(scene, player);
const projectileManager = new ProjectileManager(scene, player, enemyManager, xpManager);

// Nouveau Manager
const upgradeManager = new UpgradeManager(scene, ENGINE, player, projectileManager);

// Connexion de l'événement Level Up
player.onLevelUp = () => {
    upgradeManager.triggerLevelUp();
};

// --- GAME LOOP ---
scene.onBeforeRenderObservable.add(() => {
    // SI LE JEU EST EN PAUSE (Menu Level Up ouvert), on bloque la logique
    if(upgradeManager.isPaused) {
        return;
    }

    // 1. Logique normale
    player.update();
    enemyManager.update();
    projectileManager.update();
    xpManager.update();
    ui.update(player.stats);

    // 2. Camera & Sol
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