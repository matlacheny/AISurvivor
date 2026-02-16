export class UIManager {
    constructor() {
        // --- HUD (Score + Chrono) ---
        this.hud = document.createElement("div");
        this.hud.style.position = "absolute";
        this.hud.style.top = "20px";
        this.hud.style.left = "20px";
        this.hud.style.color = "#00ffcc";
        this.hud.style.fontFamily = "Consolas, monospace";
        this.hud.style.fontSize = "20px";
        this.hud.style.textShadow = "0 0 5px #00ffcc";
        this.hud.style.pointerEvents = "none";
        this.hud.style.zIndex = "5";
        document.body.appendChild(this.hud);

        // --- GAME OVER SCREEN ---
        this.gameOverScreen = document.createElement("div");
        Object.assign(this.gameOverScreen.style, {
            position: "absolute", top: "0", left: "0",
            width: "100%", height: "100%",
            backgroundColor: "rgba(50, 0, 0, 0.9)",
            display: "none", // Caché par défaut
            flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            color: "white", fontFamily: "monospace", zIndex: "20"
        });

        this.gameOverScreen.innerHTML = `
            <h1 style="color: red; font-size: 60px; margin-bottom: 20px;">YOU DIED</h1>
            <h2 id="go-stats"></h2>
            <button id="restart-btn" style="
                margin-top: 30px; padding: 15px 30px; font-size: 24px; 
                background: white; border: none; cursor: pointer; font-family: monospace;">
                TRY AGAIN
            </button>
        `;
        document.body.appendChild(this.gameOverScreen);

        // Event Restart
        document.getElementById("restart-btn").onclick = () => globalThis.location.reload();
    }

    update(stats, timeInSeconds, currentHp, maxHp) {
        // Formatage du temps MM:SS
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');

        this.hud.innerHTML = `
            TIME: ${minutes}:${seconds} <br>
            HP: ${Math.ceil(currentHp)} / ${maxHp} <br>
            LVL: ${stats.level} <br>
            XP: ${stats.xp}/${stats.nextLevelXp} <br>
            KILLS: ${stats.kills}
        `;
    }

    showGameOver(kills, timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');

        const statsText = document.getElementById("go-stats");
        statsText.innerHTML = `Time Survived: ${minutes}:${seconds} <br> Total Kills: ${kills}`;

        this.hud.style.display = "none"; // Cacher le HUD normal
        this.gameOverScreen.style.display = "flex";
    }
}