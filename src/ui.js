export class UIManager {
    constructor() {
        this.div = document.createElement("div");
        this.div.style.position = "absolute";
        this.div.style.top = "20px";
        this.div.style.left = "20px";
        this.div.style.color = "#00ffcc";
        this.div.style.fontFamily = "Consolas, monospace";
        this.div.style.fontSize = "20px";
        this.div.style.textShadow = "0 0 5px #00ffcc";
        this.div.style.pointerEvents = "none";
        document.body.appendChild(this.div);
    }

    update(stats) {
        this.div.innerHTML = `LVL: ${stats.level} <br> XP: ${stats.xp}/${stats.nextLevelXp} <br> KILLS: ${stats.kills}`;
    }
}