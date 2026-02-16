import './style.css';
import * as BABYLON from "@babylonjs/core";
import {createBaseScene} from './sceneSetup.js';
import {Player} from './player.js';
import {EnemyManager} from './enemyManager.js';
import {ProjectileManager} from './projectileManager.js';
import {UIManager} from './ui.js';
import {XpManager} from './xpManager.js';
import {UpgradeManager} from './upgradeManager.js';

// --- INIT ENGINE ---
const CANVAS = document.createElement("canvas");
CANVAS.style.width = "100%";
CANVAS.style.height = "100%";
CANVAS.style.outline = "none";
CANVAS.tabIndex = 1;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(CANVAS);
CANVAS.focus();

const ENGINE = new BABYLON.Engine(CANVAS, true);

// --- INIT MODULES ---
const { scene, camera, shadowGenerator, ground, CAM_OFFSET } = createBaseScene(ENGINE, CANVAS);
const ui = new UIManager();
const player = new Player(scene, shadowGenerator);
const enemyManager = new EnemyManager(scene, shadowGenerator, player);
const xpManager = new XpManager(scene, player);
const projectileManager = new ProjectileManager(scene, player, enemyManager, xpManager);
const upgradeManager = new UpgradeManager(scene, ENGINE, player, projectileManager);

// Connexion Level Up
player.onLevelUp = () => {
    upgradeManager.triggerLevelUp();
};

// --- GESTION DU JEU (PAUSE, CHRONO, MORT) ---
let isGamePaused = false;
let isGameOver = false;
let gameTime = 0; // En secondes
let lastTime = Date.now();

// Input Pause (P)
globalThis.addEventListener("keydown", (ev) => {
    if (ev.key.toLowerCase() === "p" && !upgradeManager.isPaused && !isGameOver) {
        isGamePaused = !isGamePaused;

        // Petit effet visuel pour la pause
        if(isGamePaused) document.title = "PAUSED";
        else document.title = "Vampire Survivor 3D";
    }
});

// --- GAME LOOP ---
scene.onBeforeRenderObservable.add(() => {
    // 1. Vérification des états bloquants (Level Up, Pause, Game Over)
    if (upgradeManager.isPaused || isGamePaused || isGameOver) {
        return; // On arrête tout calcul
    }

    // 2. Gestion du Temps (Chrono)
    lastTime = Date.now();

    // On incrémente le compteur seulement si on joue (pour éviter de sauter le temps pendant la pause)
    // Astuce : comme la boucle peut être stoppée par le return en haut, on met à jour lastTime
    // juste avant pour ne pas avoir un saut de temps à la reprise.
    // Pour simplifier ici : on ajoute 1/60eme de seconde à chaque frame (si 60fps)
    // Ou mieux : on utilise un compteur de frames
    gameTime += 0.0166; // approx 1 frame à 60fps

    // 3. Updates Modules
    player.update();

    // 3. Updates Modules
    player.update();

    // --- CHANGEMENT ICI ---
    // On envoie le temps actuel au manager pour qu'il calcule la difficulté
    enemyManager.update(gameTime);

    projectileManager.update();
    xpManager.update();

    // 4. Vérification Dégâts Ennemis (Contact)
    // On vérifie si un ennemi touche le joueur
    enemyManager.enemies.forEach(enemy => {
        if (BABYLON.Vector3.DistanceSquared(player.mesh.position, enemy.position) < 1.5) {
            // Dégâts par contact (ex: 10 PV)
            const isDead = player.takeDamage(10);

            if (isDead) {
                isGameOver = true;
                ui.showGameOver(player.stats.kills, gameTime);
            }
        }
    });

    // 5. Mise à jour UI
    ui.update(player.stats, gameTime, player.currentHp, player.maxHp);

    // 6. Camera & Sol
    camera.position.x = player.mesh.position.x + CAM_OFFSET.x;
    camera.position.y = player.mesh.position.y + CAM_OFFSET.y;
    camera.position.z = player.mesh.position.z + CAM_OFFSET.z;
    camera.setTarget(player.mesh.position);

    ground.position.x = Math.round(player.mesh.position.x);
    ground.position.z = Math.round(player.mesh.position.z);
});

// Correction DeltaTime pour la pause :
// Quand on reprend après une pause, il ne faut pas que le jeu calcule un "saut" de temps énorme.
// Le plus simple avec la structure actuelle est de réinitialiser lastTime à chaque frame rendue
// Mais comme on utilise un incrément fixe gameTime += 0.0166, le chrono est lié aux frames, c'est suffisant pour ce type de jeu.

ENGINE.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    ENGINE.resize();
});