export class UIManager {
    constructor() {
        // --- 1. HUD (AFFICHAGE TÊTE HAUTE) ---
        this.hud = document.createElement("div");
        Object.assign(this.hud.style, {
            position: "absolute",
            top: "20px",
            left: "20px",
            color: "#00ffcc",
            fontFamily: "Consolas, monospace",
            fontSize: "20px",
            textShadow: "0 0 5px #00ffcc",
            pointerEvents: "none", // Laisse passer les clics vers le jeu
            zIndex: "5",
            lineHeight: "1.5"
        });
        document.body.appendChild(this.hud);


        // --- 2. BARRE DE VIE DU BOSS ---
        this.bossContainer = document.createElement("div");
        Object.assign(this.bossContainer.style, {
            position: "absolute",
            bottom: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "30px",
            border: "3px solid white",
            display: "none",
            backgroundColor: "black",
            zIndex: "10",
            boxShadow: "0 0 15px red"
        });

        // La barre rouge qui se vide
        this.bossBar = document.createElement("div");
        Object.assign(this.bossBar.style, {
            width: "100%",
            height: "100%",
            backgroundColor: "#ff0000",
            transition: "width 0.2s linear"
        });

        // Le Nom du Boss
        this.bossName = document.createElement("div");
        Object.assign(this.bossName.style, {
            position: "absolute",
            top: "-35px",
            width: "100%",
            textAlign: "center",
            color: "#ff0000",
            fontFamily: "Impact, sans-serif",
            fontSize: "28px",
            textShadow: "0 0 5px black",
            letterSpacing: "2px"
        });

        this.bossContainer.appendChild(this.bossBar);
        this.bossContainer.appendChild(this.bossName);
        document.body.appendChild(this.bossContainer);


        // --- 3. ÉCRAN GAME OVER / VICTOIRE ---
        this.gameOverScreen = document.createElement("div");
        Object.assign(this.gameOverScreen.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(50, 0, 0, 0.95)",
            display: "none",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontFamily: "monospace",
            zIndex: "200"
        });

        this.gameOverScreen.innerHTML = `
            <h1 style="color: red; font-size: 80px; margin-bottom: 10px; text-shadow: 0 0 20px black;">YOU DIED</h1>
            <div id="go-stats" style="font-size: 24px; text-align: center; line-height: 2;"></div>
            <button id="restart-btn" style="
                margin-top: 40px; 
                padding: 15px 40px; 
                font-size: 24px; 
                background: white; 
                border: 2px solid red; 
                cursor: pointer; 
                font-family: monospace;
                text-transform: uppercase;
                font-weight: bold;
                transition: 0.3s;
            ">Try Again</button>
        `;
        document.body.appendChild(this.gameOverScreen);

        // Effet Hover sur le bouton
        const btn = document.getElementById("restart-btn");
        btn.onmouseenter = () => { btn.style.background = "red"; btn.style.color = "white"; };
        btn.onmouseleave = () => { btn.style.background = "white"; btn.style.color = "black"; };

        // Action Restart
        btn.onclick = () => window.location.reload();
    }

    update(stats, timeInSeconds, currentHp, maxHp, activeBoss) {
            // Formatage du temps (MM:SS)
            const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
            const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
            

        this.hud.innerHTML = `
            <span style="font-size: 30px;">⏱ ${minutes}:${seconds}</span><br>
            <span>❤️ ${Math.ceil(currentHp)} / ${maxHp}</span><br>
            <span>⚡ LVL: ${stats.level}</span><br>
            <span>💎 XP: ${Math.floor(stats.xp)} / ${stats.nextLevelXp}</span><br>
            <span>💀 KILLS: ${stats.kills}</span>
        `;

        const hpPercent = currentHp / maxHp;
        if(hpPercent < 0.3) this.hud.style.color = "#ff3333";
        else this.hud.style.color = "#00ffcc";

        if (activeBoss) {
            this.bossContainer.style.display = "block";
            this.bossName.innerText = activeBoss.name;
            const bossPercent = (activeBoss.hp / activeBoss.maxHp) * 100;
            this.bossBar.style.width = Math.max(0, bossPercent) + "%";
        } else {
            this.bossContainer.style.display = "none";
        }
    }

    showGameOver(kills, timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');

        const statsText = document.getElementById("go-stats");
        statsText.innerHTML = `
            Time Survived: <span style="color:#00ffcc">${minutes}:${seconds}</span><br>
            Total Kills: <span style="color:red">${kills}</span>
        `;

        this.hud.style.display = "none";
        this.bossContainer.style.display = "none";
        this.gameOverScreen.style.display = "flex";
    }

    /**
     * Affiche l'écran de Victoire
     */
    showVictory(kills, timeInSeconds) {
        this.showGameOver(kills, timeInSeconds); // Réutilise l'écran de base pour les stats

        // Change le fond
        this.gameOverScreen.style.backgroundColor = "rgba(10, 10, 50, 0.95)";

        // Modifie le texte pour la victoire
        const title = this.gameOverScreen.querySelector("h1");
        title.innerText = "VICTORY ACHIEVED";
        title.style.color = "gold";
        title.style.textShadow = "0 0 20px yellow";

        // Modifie le bouton
        const btn = document.getElementById("restart-btn");
        btn.innerText = "MAIN MENU";
        btn.style.borderColor = "gold";
        btn.style.color = "black";
        btn.onmouseenter = () => { btn.style.background = "gold"; btn.style.color = "black"; };
        btn.onmouseleave = () => { btn.style.background = "white"; btn.style.color = "black"; };
    }
}