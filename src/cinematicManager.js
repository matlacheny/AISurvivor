// --- CONFIGURATION DE L'HISTOIRE ---
const STORY_LINES = [
    "En l'an 20XX, les ténèbres ont englouti le monde.",
    "Les légions vampiriques ont détruit toute civilisation.",
    "Vous êtes le dernier survivant...",
    "Votre seul but : SURVIVRE."
];

export class CinematicManager {
    constructor() {
        this.overlay = document.createElement("div");
        this.overlay.id = "cinematic-overlay";
        this.overlay.innerHTML = `
            <div id="cinematic-text"></div>
            <div id="cinematic-hint">(Cliquez pour continuer)</div>
        `;
        document.body.appendChild(this.overlay);

        this.textElement = this.overlay.querySelector("#cinematic-text");
        this.currentIndex = 0;
        this.onComplete = null;

        // Gestion du clic pour avancer
        this.overlay.onclick = () => this.nextSlide();
    }

    play(onCompleteCallback) {
        this.onComplete = onCompleteCallback;
        this.currentIndex = 0;
        this.overlay.style.display = "flex";
        this.showText(STORY_LINES[0]);
    }

    nextSlide() {
        this.currentIndex++;
        if (this.currentIndex < STORY_LINES.length) {
            this.showText(STORY_LINES[this.currentIndex]);
        } else {
            this.finish();
        }
    }

    showText(text) {
        // Petit effet de fade-in (simplifié)
        this.textElement.style.opacity = 0;
        setTimeout(() => {
            this.textElement.innerText = text;
            this.textElement.style.opacity = 1;
        }, 200);
    }

    finish() {
        this.overlay.style.display = "none";
        if (this.onComplete) this.onComplete();
    }
}