import { WEAPONS, PASSIVES, EVOLUTIONS } from './itemsData.js';

export class UpgradeManager {
    constructor(scene, engine, player, projectileManager) {
        this.scene = scene;
        this.engine = engine;
        this.player = player;
        this.projManager = projectileManager;
        this.isPaused = false;

        this.uiContainer = this._createUI();
    }

    _createUI() {
        const div = document.createElement("div");
        Object.assign(div.style, {
            position: "absolute", top: "0", left: "0",
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "none",
            flexDirection: "column", justifyContent: "center", alignItems: "center",
            zIndex: "10"
        });

        const title = document.createElement("h1");
        title.innerText = "LEVEL UP!";
        title.style.color = "yellow";
        title.style.fontFamily = "Consolas, monospace";
        div.appendChild(title);

        const optionsContainer = document.createElement("div");
        optionsContainer.id = "options-container";
        optionsContainer.style.display = "flex";
        optionsContainer.style.gap = "20px";
        div.appendChild(optionsContainer);

        document.body.appendChild(div);
        return { main: div, options: optionsContainer };
    }

    triggerLevelUp() {
        this.isPaused = true;
        this.uiContainer.main.style.display = "flex";

        const choices = this._getRandomOptions();

        this.uiContainer.options.innerHTML = "";
        choices.forEach(item => {
            const card = this._createCard(item);
            this.uiContainer.options.appendChild(card);
        });
    }

    _getRandomOptions() {
        let pool = [];
        const inventory = this.player.inventory;

        // --- A. ÉVOLUTIONS ---
        inventory.weapons.forEach(w => {
            const data = WEAPONS[w.id];
            if (!data) return; // Sécurité si c'est déjà une évo

            if(w.level >= data.maxLevel && data.evolutionId) {
                const hasPassive = inventory.passives.some(p => p.id === data.requiredPassive);
                const hasEvo = inventory.weapons.some(ev => ev.id === data.evolutionId);

                if(hasPassive && !hasEvo) {
                    pool.push(EVOLUTIONS[data.evolutionId]);
                }
            }
        });

        // --- B. ITEMS EXISTANTS ---
        [...inventory.weapons, ...inventory.passives].forEach(item => {
            if(WEAPONS[item.id] && item.level < WEAPONS[item.id].maxLevel) {
                pool.push(WEAPONS[item.id]);
            }
            else if(PASSIVES[item.id] && item.level < PASSIVES[item.id].maxLevel) {
                pool.push(PASSIVES[item.id]);
            }
        });

        // --- C. NOUVEAUX ITEMS ---
        const canAddWeapon = inventory.weapons.length < 6;
        const canAddPassive = inventory.passives.length < 6;

        if(canAddWeapon) {
            Object.values(WEAPONS).forEach(w => {
                const hasWeapon = inventory.weapons.some(i => i.id === w.id);
                // Vérifie aussi qu'on n'a pas l'évolution de cette arme
                const hasEvo = inventory.weapons.some(i => i.id === w.evolutionId);
                if(!hasWeapon && !hasEvo) pool.push(w);
            });
        }
        if(canAddPassive) {
            Object.values(PASSIVES).forEach(p => {
                if(!inventory.passives.some(i => i.id === p.id)) pool.push(p);
            });
        }

        pool = pool.sort(() => 0.5 - Math.random());
        return [...new Set(pool)].slice(0, 3);
    }

    _getItemColor(type) {
        if (type === 'weapon') return 'red';
        if (type === 'passive') return 'cyan';
        return 'gold';
    }

    _createCard(item) {
        const div = document.createElement("div");
        Object.assign(div.style, {
            width: "200px", height: "320px", // Un peu plus haut pour le texte extra
            border: "2px solid white", backgroundColor: "#222",
            color: "white", padding: "10px", cursor: "pointer",
            fontFamily: "monospace", display: "flex", flexDirection: "column",
            alignItems: "center", textAlign: "center"
        });

        div.onmouseenter = () => div.style.backgroundColor = "#444";
        div.onmouseleave = () => div.style.backgroundColor = "#222";

        const typeColor = this._getItemColor(item.type);

        let currentLevel = 0;
        const existing = [...this.player.inventory.weapons, ...this.player.inventory.passives].find(i => i.id === item.id);
        if(existing) currentLevel = existing.level;

        // --- LOGIQUE D'INDICATION D'ÉVOLUTION ---
        let evolutionHint = "";

        // Si c'est un PASSIF, on cherche quelle arme il fait évoluer
        if (item.type === 'passive') {
            // On cherche dans toutes les armes celle qui a ce passif comme 'requiredPassive'
            const targetWeapon = Object.values(WEAPONS).find(w => w.requiredPassive === item.id);
            if (targetWeapon) {
                evolutionHint = `<p style="font-size:11px; color:#ffcc00; margin-top:5px; border-top:1px solid #555; padding-top:5px;">
                    Synergie : Évolue ${targetWeapon.name}
                </p>`;
            }
        }
        // Si c'est une ARME, on peut aussi dire quel passif elle nécessite (optionnel mais sympa)
        else if (item.type === 'weapon') {
            // On cherche le nom du passif requis
            const reqPassiveId = item.requiredPassive;
            const reqPassive = PASSIVES[reqPassiveId];
            if (reqPassive) {
                evolutionHint = `<p style="font-size:11px; color:#aaa; margin-top:5px; border-top:1px solid #555; padding-top:5px;">
                    Requiert : ${reqPassive.name}
                 </p>`;
            }
        }

        div.innerHTML = `
            <h3 style="color:${typeColor}">${item.name}</h3>
            <p style="font-size:12px; color:#aaa">${item.type.toUpperCase()}</p>
            <p style="font-size:13px; flex-grow: 1;">${item.description}</p>
            
            ${evolutionHint} <div style="margin-top:auto; font-weight:bold;">
                ${item.type === 'evolution' ? 'EVOLUTION!' : `Lvl ${currentLevel} ➜ ${currentLevel + 1}`}
            </div>
        `;

        div.onclick = () => this.selectItem(item);
        return div;
    }

    selectItem(itemData) {
        this.player.addItem(itemData);
        this.uiContainer.main.style.display = "none";
        this.isPaused = false;

        const canvas = this.engine.getRenderingCanvas();
        if (canvas) canvas.focus();
    }
}