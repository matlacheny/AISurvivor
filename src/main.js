import './style.css';
import * as BABYLON from "@babylonjs/core";

// --- IMPORTS DES MODULES ---
import { createBaseScene } from './sceneSetup.js';
import { Player } from './player.js';
import { EnemyManager } from './enemyManager.js';
import { ProjectileManager } from './projectileManager.js';
import { UIManager } from './ui.js';
import { XpManager } from './xpManager.js';
import { UpgradeManager } from './upgradeManager.js';
import { CinematicManager } from './cinematicManager.js';
import { ArenaManager, ARENAS } from './arenaManager.js';

// --- 1. CONFIGURATION MOTEUR & CANVAS ---
const CANVAS = document.createElement("canvas");
CANVAS.style.width = "100%";
CANVAS.style.height = "100%";
CANVAS.style.outline = "none";
CANVAS.tabIndex = 1; // Permet de recevoir le focus clavier
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(CANVAS);

const ENGINE = new BABYLON.Engine(CANVAS, true);

// --- 2. CRÉATION DE L'INTERFACE HTML (MENUS) ---
const createMenus = () => {
    // A. MENU PRINCIPAL
    const mainDiv = document.createElement("div");
    mainDiv.id = "main-menu";
    mainDiv.innerHTML = `
        <h1>AI Survivor</h1>
        <button id="btn-story" class="menu-btn">HISTOIRE</button>
        <button id="btn-endless" class="menu-btn">ENDLESS</button>
        <button id="btn-leaderboard" class="menu-btn" style="opacity:0.5; cursor:not-allowed;">LEADERBOARD (WIP)</button>
    `;
    mainDiv.style.display = "flex"; // Visible par défaut

    // B. MENU SÉLECTION ARÈNE (Caché)
    const arenaDiv = document.createElement("div");
    arenaDiv.id = "arena-menu";
    Object.assign(arenaDiv.style, {
        position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
        background: "rgba(0,0,0,0.95)", display: "none",
        flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: "101"
    });

    // Génération dynamique des cartes d'arènes
    let arenaButtons = "";
    Object.keys(ARENAS).forEach(key => {
        const a = ARENAS[key];
        arenaButtons += `
            <div class="arena-card" data-id="${key}" style="
                border:1px solid #555; padding:20px; margin:10px; width:300px; cursor:pointer; 
                text-align:center; transition:0.3s; background:#222; color:white; border-radius:8px;">
                <h2 style="color:#00ccff; margin-bottom:10px;">${a.name}</h2>
                <p style="font-size:14px; color:#aaa;">${a.description}</p>
            </div>`;
    });

    arenaDiv.innerHTML = `
        <h2 style="color:white; font-family:monospace; font-size:40px; margin-bottom:30px;">CHOISISSEZ UNE ARÈNE</h2>
        <div style="display:flex; flex-wrap:wrap; justify-content:center;">
            ${arenaButtons}
        </div>
        <button id="btn-back" class="menu-btn" style="margin-top:40px; font-size:16px;">RETOUR</button>
    `;

    document.body.appendChild(mainDiv);
    document.body.appendChild(arenaDiv);

    return { main: mainDiv, arena: arenaDiv };
};

const menus = createMenus();

// --- 3. INITIALISATION SCÈNE DE BASE ---
// On crée la scène vide (lumières, caméra) pour l'arrière-plan du menu
const { scene, camera, shadowGenerator, CAM_OFFSET } = createBaseScene(ENGINE, CANVAS);

// --- 4. GESTIONNAIRES GLOBAUX ---
let player, enemyManager, xpManager, projectileManager, upgradeManager, ui;
let arenaManager = new ArenaManager(scene);
let cinematicManager = new CinematicManager();

// États du Jeu
let gameState = "MENU"; // MENU, CINEMATIC, GAME, GAMEOVER
let isGamePaused = false;
let gameTime = 0;

// --- 5. LOGIQUE DE DÉMARRAGE DU GAMEPLAY ---
const startGameplay = (arenaId = "infinite") => {
    console.log("Démarrage du jeu - Arène :", arenaId);

    // 1. Setup de l'arène (Sol + Murs)
    const arenaConfig = arenaManager.setupArena(arenaId);

    // 2. Instanciation des Modules
    ui = new UIManager();
    player = new Player(scene, shadowGenerator);

    // On applique les limites de l'arène au joueur
    player.setLimits(arenaConfig.limits);

    enemyManager = new EnemyManager(scene, shadowGenerator, player);
    xpManager = new XpManager(scene, player);
    projectileManager = new ProjectileManager(scene, player, enemyManager, xpManager);
    upgradeManager = new UpgradeManager(scene, ENGINE, player, projectileManager);

    // 3. Connexions Événements
    player.onLevelUp = () => upgradeManager.triggerLevelUp();

    // 4. Reset États
    gameTime = 0;
    gameState = "GAME";
    isGamePaused = false;

    // Focus pour les contrôles clavier
    CANVAS.focus();
};

// --- 6. GESTION DES BOUTONS DU MENU ---

// A. Mode Histoire
document.getElementById("btn-story").onclick = () => {
    menus.main.style.display = "none";
    gameState = "CINEMATIC";

    // Lance la cinématique -> puis le jeu (Arène par défaut)
    cinematicManager.play(() => {
        startGameplay("infinite");
    });
};

// B. Mode Endless (Ouvre sélection arène)
document.getElementById("btn-endless").onclick = () => {
    menus.main.style.display = "none";
    menus.arena.style.display = "flex";
};

// C. Retour au menu principal
document.getElementById("btn-back").onclick = () => {
    menus.arena.style.display = "none";
    menus.main.style.display = "flex";
};

// D. Clic sur une carte d'arène
document.querySelectorAll(".arena-card").forEach(card => {
    card.onclick = () => {
        const id = card.getAttribute("data-id");
        menus.arena.style.display = "none";
        // Lancement direct du jeu
        startGameplay(id);
    };
    // Effet Hover JS
    card.onmouseenter = () => card.style.backgroundColor = "#444";
    card.onmouseleave = () => card.style.backgroundColor = "#222";
});

// --- 7. INPUT PAUSE (Touche P) ---
globalThis.addEventListener("keydown", (ev) => {
    if (gameState === "GAME" && ev.key.toLowerCase() === "p" && !upgradeManager.isPaused) {
        isGamePaused = !isGamePaused;
        document.title = isGamePaused ? "PAUSED - Vampire Survivor" : "Vampire Survivor 3D";
    }
});

// --- 8. BOUCLE PRINCIPALE (RENDER LOOP) ---
scene.onBeforeRenderObservable.add(() => {

    // --- CAS 1 : MENU OU CINÉMATIQUE ---
    if (gameState === "MENU" || gameState === "CINEMATIC") {
        // Petite rotation de caméra pour rendre le menu vivant
        const alpha = Date.now() * 0.0002;
        camera.position.x = 60 * Math.cos(alpha);
        camera.position.z = 60 * Math.sin(alpha);
        camera.setTarget(BABYLON.Vector3.Zero());
        return;
    }

    // --- CAS 2 : JEU EN COURS ---
    if (gameState === "GAME") {
        // Pause ou Menu LevelUp ouvert ? On arrête tout.
        if (upgradeManager.isPaused || isGamePaused) return;

        // Mise à jour du temps (approx 60 FPS)
        gameTime += 0.0166;

        // Mises à jour Logiques
        player.update();
        enemyManager.update(gameTime); // Difficulté augmente avec le temps
        projectileManager.update();
        xpManager.update();

        // Mise à jour du Sol (Arena Manager)
        arenaManager.update(player.mesh.position);

        // Caméra suit le joueur
        camera.position.x = player.mesh.position.x + CAM_OFFSET.x;
        camera.position.y = player.mesh.position.y + CAM_OFFSET.y;
        camera.position.z = player.mesh.position.z + CAM_OFFSET.z;
        camera.setTarget(player.mesh.position);

        // Gestion Mort du Joueur (Contact Ennemi)
        // On vérifie quelques ennemis proches pour optimiser
        for (let i = 0; i < enemyManager.enemies.length; i++) {
            const enemy = enemyManager.enemies[i];
            // Distance au carré < 1.5 (contact)
            if (BABYLON.Vector3.DistanceSquared(player.mesh.position, enemy.position) < 1.5) {
                const isDead = player.takeDamage(10); // 10 Dégâts

                if (isDead) {
                    gameState = "GAMEOVER";
                    ui.showGameOver(player.stats.kills, gameTime);
                    break; // Pas besoin de vérifier les autres
                }
            }
        }

        // Mise à jour HUD
        ui.update(player.stats, gameTime, player.currentHp, player.maxHp);
    }
});

// --- 9. LANCEMENT DU MOTEUR ---
ENGINE.runRenderLoop(() => {
    scene.render();
});

// Gestion du redimensionnement de la fenêtre
window.addEventListener("resize", () => {
    ENGINE.resize();
});