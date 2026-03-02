import './style.css';
import * as BABYLON from "@babylonjs/core";

// --- IMPORTS DES MODULES ---
import { createBaseScene } from './sceneSetup.js';
import { Player } from './player.js';
import { EnemyManager } from './manager/enemyManager.js';
import { ProjectileManager } from './manager/projectileManager.js';
import { UIManager } from './ui.js';
import { XpManager } from './manager/xpManager.js';
import { UpgradeManager } from './manager/upgradeManager.js';
import { CinematicManager } from './manager/cinematicManager.js';
import { ArenaManager, ARENAS } from './manager/arenaManager.js';
import { CHARACTERS } from './data/charactersData.js'; // L'import des personnages
import {AssetManager} from "./manager/assetManager.js";

// --- 1. CONFIGURATION MOTEUR & CANVAS ---
const CANVAS = document.createElement("canvas");
CANVAS.style.width = "100%";
CANVAS.style.height = "100%";
CANVAS.style.outline = "none";
CANVAS.tabIndex = 1;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(CANVAS);

const ENGINE = new BABYLON.Engine(CANVAS, true);

// --- VARIABLES POUR LA SÉLECTION DE PERSONNAGE ---
const charKeys = Object.keys(CHARACTERS);
let currentCharIndex = 0;

// --- 2. CRÉATION DE L'INTERFACE HTML (MENUS) ---
const createMenus = () => {
    // A. MENU PRINCIPAL (Divisé en 2 colonnes)
    const mainDiv = document.createElement("div");
    mainDiv.id = "main-menu";
    Object.assign(mainDiv.style, {
        position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
        background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "row", // ROW pour diviser gauche/droite
        justifyContent: "space-evenly", alignItems: "center", zIndex: "100"
    });

    // Colonne Gauche : Titre et Boutons
    const leftCol = document.createElement("div");
    leftCol.style.display = "flex";
    leftCol.style.flexDirection = "column";
    leftCol.style.alignItems = "center";
    leftCol.innerHTML = `
        <h1 style="text-align:center; font-size: 60px; color: red; text-shadow: 0 0 10px black; font-family: monospace; margin-bottom: 50px;">VAMPIRE SURVIVOR 3D</h1>
        <button id="btn-story" class="menu-btn">HISTOIRE</button>
        <button id="btn-endless" class="menu-btn">ENDLESS</button>
        <button id="btn-leaderboard" class="menu-btn" style="opacity:0.5; cursor:not-allowed;">LEADERBOARD (WIP)</button>
    `;

    // Colonne Droite : Aperçu du personnage
    const rightCol = document.createElement("div");
    rightCol.id = "char-preview-panel";
    Object.assign(rightCol.style, {
        width: "350px", padding: "20px", background: "rgba(20, 20, 20, 0.9)",
        border: "2px solid white", borderRadius: "15px", color: "white",
        fontFamily: "monospace", textAlign: "center", boxShadow: "0 0 20px rgba(0,0,0,0.8)"
    });

    mainDiv.appendChild(leftCol);
    mainDiv.appendChild(rightCol);

    // B. MENU SÉLECTION ARÈNE (Pour le mode Endless)
    const arenaDiv = document.createElement("div");
    arenaDiv.id = "arena-menu";
    Object.assign(arenaDiv.style, {
        position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
        background: "rgba(0,0,0,0.95)", display: "none",
        flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: "101"
    });

    let arenaButtons = "";
    Object.keys(ARENAS).forEach(key => {
        const a = ARENAS[key];
        arenaButtons += `
            <div class="arena-card" data-id="${key}" style="
                border:1px solid #555; padding:20px; margin:10px; width:300px; cursor:pointer; 
                text-align:center; transition:0.3s; background:#222; color:white; border-radius:8px;">
                <h2 style="color:#00ccff; margin-bottom:10px; font-family:monospace;">${a.name}</h2>
                <p style="font-size:14px; color:#aaa; font-family:sans-serif;">${a.description}</p>
            </div>`;
    });

    arenaDiv.innerHTML = `
        <h2 style="color:white; font-family:monospace; font-size:40px; margin-bottom:30px;">CHOISISSEZ UNE ARÈNE</h2>
        <div style="display:flex; flex-wrap:wrap; justify-content:center;">${arenaButtons}</div>
        <button id="btn-back" class="menu-btn" style="margin-top:40px; font-size:16px;">RETOUR</button>
    `;

    document.body.appendChild(mainDiv);
    document.body.appendChild(arenaDiv);

    return { main: mainDiv, arena: arenaDiv };
};

const menus = createMenus();

// --- 3. FONCTION D'AFFICHAGE DU PERSONNAGE DYNAMIQUE ---
const updateCharacterDisplay = () => {
    const charId = charKeys[currentCharIndex];
    const c = CHARACTERS[charId];
    const panel = document.getElementById("char-preview-panel");

    // On recrée l'intérieur du panneau de droite
    panel.innerHTML = `
        <h2 style="color:white; margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px;">HÉROS ACTUEL</h2>
        
        <div style="display:flex; justify-content:center; align-items:center; margin-bottom:20px;">
            <button id="btn-prev-char" style="background:transparent; color:white; border:none; font-size:40px; cursor:pointer; padding: 10px;">&#9664;</button>
            
            <div style="width: 120px; height: 120px; background-color: ${c.color}; border-radius: 50%; margin: 0 20px; border: 4px solid #fff; box-shadow: 0 0 20px ${c.color};"></div>
            
            <button id="btn-next-char" style="background:transparent; color:white; border:none; font-size:40px; cursor:pointer; padding: 10px;">&#9654;</button>
        </div>
        
        <h3 style="color:${c.color}; font-size:32px; margin: 10px 0; text-shadow: 0 0 5px black;">${c.name}</h3>
        <p style="color:#aaa; font-size:15px; min-height: 50px;">${c.description}</p>
        
        <p style="font-size: 16px;"><strong>❤️ HP:</strong> ${c.stats.maxHp} &nbsp;|&nbsp; <strong>👟 VIT:</strong> ${c.stats.moveSpeed}</p>
        
        <div style="background:#222; padding:15px; border-radius:8px; margin-top:20px; border: 1px solid #555;">
            <span style="color:gold; font-size: 18px; font-weight: bold;">PASSIF UNIQUE</span><br>
            <span style="font-size:14px; color:#ddd; display: block; margin-top: 5px;">Type : ${c.passive.type.toUpperCase()}</span>
        </div>
    `;

    // Événements des flèches
    document.getElementById("btn-prev-char").onclick = () => {
        // Le modulo + longueur permet de boucler vers la fin si on est à 0
        currentCharIndex = (currentCharIndex - 1 + charKeys.length) % charKeys.length;
        updateCharacterDisplay();
    };
    document.getElementById("btn-next-char").onclick = () => {
        // Boucle vers 0 si on dépasse la fin
        currentCharIndex = (currentCharIndex + 1) % charKeys.length;
        updateCharacterDisplay();
    };
};

// Initialiser l'affichage au démarrage
updateCharacterDisplay();


// --- 4. INITIALISATION SCÈNE DE BASE ---
const { scene, camera, shadowGenerator, CAM_OFFSET } = createBaseScene(ENGINE, CANVAS);
const assetManager = new AssetManager(scene);

let player, enemyManager, xpManager, projectileManager, upgradeManager, ui;
let arenaManager = new ArenaManager(scene);
let cinematicManager = new CinematicManager();

let gameState = "MENU";
let isGamePaused = false;
let gameTime = 0;

// --- 5. LOGIQUE DE DÉMARRAGE DU GAMEPLAY ---
// On s'assure de bien récupérer le charId
const startGameplay = (arenaId = "infinite", mode = "ENDLESS", charId = "paladin") => {
    console.log(`Démarrage [${mode}] - Arène : ${arenaId} - Perso : ${charId}`);
    player = new Player(scene, shadowGenerator, assetManager, charId);
    enemyManager = new EnemyManager(scene, shadowGenerator, player, assetManager);

    // Nettoyage
    if (player) player.mesh.dispose();
    if (ui) {
        ui.hud.remove();
        ui.bossContainer.remove();
        ui.gameOverScreen.remove();
    }
    if (enemyManager) enemyManager.enemies.forEach(e => e.dispose());
    if (projectileManager) projectileManager.projectiles.forEach(p => p.mesh.dispose());
    if (xpManager) xpManager.gems.forEach(g => g.dispose());

    const arenaConfig = arenaManager.setupArena(arenaId);

    // Instanciation
    ui = new UIManager();
    player = new Player(scene, shadowGenerator, charId); // <-- Le personnage est transmis ici !
    player.setLimits(arenaConfig.limits);

    enemyManager = new EnemyManager(scene, shadowGenerator, player);
    enemyManager.setCurrentArena(arenaId);
    enemyManager.gameMode = mode;

    xpManager = new XpManager(scene, player);
    projectileManager = new ProjectileManager(scene, player, enemyManager, xpManager);
    upgradeManager = new UpgradeManager(scene, ENGINE, player, projectileManager);

    player.onLevelUp = () => upgradeManager.triggerLevelUp();

    enemyManager.onBossDefeated = (defeatedIndex) => {
        if (mode === "STORY" && defeatedIndex === 2) {
            if (arenaId === "infinite") startGameplay("corridor", "STORY", charId);
            else if (arenaId === "corridor") startGameplay("coliseum", "STORY", charId);
            else { gameState = "GAMEOVER"; ui.showVictory(player.stats.kills, gameTime); }
        }
    };

    gameTime = 0;
    gameState = "GAME";
    isGamePaused = false;
    CANVAS.focus();
};

// IMPORTANT : On charge les assets en fond dès le lancement du site !
// (Pendant que le joueur regarde le menu)
assetManager.loadAll().then(() => {
    // Tu pourrais même désactiver les boutons "Histoire" / "Endless"
    // jusqu'à ce que ce bloc .then() soit déclenché pour éviter les bugs.
    console.log("Le jeu est prêt à être lancé !");
});

// --- 6. GESTION DES BOUTONS DU MENU ---

document.getElementById("btn-story").onclick = () => {
    menus.main.style.display = "none";
    gameState = "CINEMATIC";
    cinematicManager.play(() => {
        // On récupère la clé du perso actuellement sélectionné
        const selectedChar = charKeys[currentCharIndex];
        startGameplay("infinite", "STORY", selectedChar);
    });
};

document.getElementById("btn-endless").onclick = () => {
    menus.main.style.display = "none";
    menus.arena.style.display = "flex";
};

document.getElementById("btn-back").onclick = () => {
    menus.arena.style.display = "none";
    menus.main.style.display = "flex"; // Re-affiche l'écran principal (et le choix du perso)
};

document.querySelectorAll(".arena-card").forEach(card => {
    card.onclick = () => {
        const arenaId = card.getAttribute("data-id");
        menus.arena.style.display = "none";
        // On récupère la clé du perso actuellement sélectionné
        const selectedChar = charKeys[currentCharIndex];
        startGameplay(arenaId, "ENDLESS", selectedChar);
    };
    card.onmouseenter = () => card.style.backgroundColor = "#444";
    card.onmouseleave = () => card.style.backgroundColor = "#222";
});

// --- 7. INPUT PAUSE ---
window.addEventListener("keydown", (ev) => {
    if (gameState === "GAME" && ev.key.toLowerCase() === "p" && !upgradeManager.isPaused) {
        isGamePaused = !isGamePaused;
        document.title = isGamePaused ? "PAUSED - Vampire Survivor" : "Vampire Survivor 3D";
    }
});

// --- 8. BOUCLE PRINCIPALE ---
scene.onBeforeRenderObservable.add(() => {
    if (gameState === "MENU" || gameState === "CINEMATIC") {
        const alpha = Date.now() * 0.0002;
        camera.position.x = 60 * Math.cos(alpha);
        camera.position.z = 60 * Math.sin(alpha);
        camera.setTarget(BABYLON.Vector3.Zero());
        return;
    }

    if (gameState === "GAME") {
        if (upgradeManager.isPaused || isGamePaused) return;

        if (!enemyManager.activeBoss) gameTime += 0.0166;

        player.update(enemyManager);
        enemyManager.update(gameTime);
        projectileManager.update();
        xpManager.update();

        arenaManager.update(player.mesh.position);

        camera.position.x = player.mesh.position.x + CAM_OFFSET.x;
        camera.position.y = player.mesh.position.y + CAM_OFFSET.y;
        camera.position.z = player.mesh.position.z + CAM_OFFSET.z;
        camera.setTarget(player.mesh.position);

        for (let i = 0; i < enemyManager.enemies.length; i++) {
            const enemy = enemyManager.enemies[i];
            if (BABYLON.Vector3.DistanceSquared(player.mesh.position, enemy.position) < 1.5) {
                const isDead = player.takeDamage(10);
                if (isDead) {
                    gameState = "GAMEOVER";
                    ui.showGameOver(player.stats.kills, gameTime);
                    break;
                }
            }
        }

        ui.update(player.stats, gameTime, player.currentHp, player.maxHp, enemyManager.activeBoss);
    }
});

ENGINE.runRenderLoop(() => { scene.render(); });
window.addEventListener("resize", () => { ENGINE.resize(); });