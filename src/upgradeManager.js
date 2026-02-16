import { WEAPONS, PASSIVES, EVOLUTIONS } from './itemsData.js';

export class UpgradeManager {
    constructor(scene, engine, player, projectileManager) {
        this.scene = scene;
        this.engine = engine; // Pour mettre en pause
        this.player = player;
        this.projManager = projectileManager; // Pour appliquer les nouvelles armes
        this.isPaused = false;

        this.uiContainer = this._createUI();
    }

    _getItemColor(type) {
        if (type === 'weapon') return 'red';
        if (type === 'passive') return 'cyan';
        return 'gold'; // Default for evolution
    }

    _createUI() {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.top = "0"; div.style.left = "0";
        div.style.width = "100%"; div.style.height = "100%";
        div.style.backgroundColor = "rgba(0,0,0,0.8)";
        div.style.display = "none"; // Caché par défaut
        div.style.flexDirection = "column";
        div.style.justifyContent = "center";
        div.style.alignItems = "center";
        div.style.zIndex = "10";

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

        // 1. Générer les 3 choix
        const choices = this._getRandomOptions();

        // 2. Afficher les cartes
        this.uiContainer.options.innerHTML = ""; // Vider
        choices.forEach(item => {
            const card = this._createCard(item);
            this.uiContainer.options.appendChild(card);
        });
    }

    _getRandomOptions() {
        let pool = [];
        const inventory = this.player.inventory;

        // --- A. ÉVOLUTIONS (Priorité Absolue) ---
        // Si on a une arme niveau 5 + le passif requis -> On propose l'évolution
        inventory.weapons.forEach(w => {
            const data = WEAPONS[w.id];
            if(w.level >= data.maxLevel && data.evolutionId) {
                // Vérifier si on a le passif
                const hasPassive = inventory.passives.some(p => p.id === data.requiredPassive);
                // Vérifier qu'on n'a pas DÉJÀ l'évolution
                const hasEvo = inventory.weapons.some(ev => ev.id === data.evolutionId);

                if(hasPassive && !hasEvo) {
                    pool.push(EVOLUTIONS[data.evolutionId]);
                }
            }
        });

        // --- B. ITEMS EXISTANTS (Upgrades) ---
        // On ajoute les armes/passifs qu'on possède déjà et qui ne sont pas maxés
        [...inventory.weapons, ...inventory.passives].forEach(item => {
            // Si c'est une arme de base
            if(WEAPONS[item.id] && item.level < WEAPONS[item.id].maxLevel) {
                pool.push(WEAPONS[item.id]);
            }
            // Si c'est un passif
            if(PASSIVES[item.id] && item.level < PASSIVES[item.id].maxLevel) {
                pool.push(PASSIVES[item.id]);
            }
        });

        // --- C. NOUVEAUX ITEMS (Si on a de la place) ---
        // Slots restants ?
        const canAddWeapon = inventory.weapons.length < 6;
        const canAddPassive = inventory.passives.length < 6;

        if(canAddWeapon) {
            Object.values(WEAPONS).forEach(w => {
                // Si on ne l'a pas déjà
                if(!inventory.weapons.some(i => i.id === w.id)) pool.push(w);
            });
        }
        if(canAddPassive) {
            Object.values(PASSIVES).forEach(p => {
                if(!inventory.passives.some(i => i.id === p.id)) pool.push(p);
            });
        }

        // --- MÉLANGE ET SÉLECTION ---
        // On mélange le tableau
        pool = pool.sort(() => 0.5 - Math.random());
        // On prend les 3 premiers uniques (Set pour éviter doublons dans la pool logique, bien que géré au dessus)
        return [...new Set(pool)].slice(0, 3);
    }

    _createCard(item) {
        const div = document.createElement("div");
        div.style.width = "200px";
        div.style.height = "300px";
        div.style.border = "2px solid white";
        div.style.backgroundColor = "#222";
        div.style.color = "white";
        div.style.padding = "10px";
        div.style.cursor = "pointer";
        div.style.fontFamily = "monospace";
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.alignItems = "center";

        // Effet Hover
        div.onmouseenter = () => div.style.backgroundColor = "#444";
        div.onmouseleave = () => div.style.backgroundColor = "#222";

        // Contenu
        // Replace the nested ternary with this:
        const typeColor = this._getItemColor(item.type);

        let currentLevel = 0;
        const existing = [...this.player.inventory.weapons, ...this.player.inventory.passives].find(i => i.id === item.id);
        if(existing) currentLevel = existing.level;

        div.innerHTML = `
            <h3 style="color:${typeColor}">${item.name}</h3>
            <p style="font-size:12px; color:#aaa">${item.type.toUpperCase()}</p>
            <p>${item.description}</p>
            <div style="margin-top:auto">
                ${item.type === 'evolution' ? 'EVOLUTION!' : `Level: ${currentLevel} -> ${currentLevel + 1}`}
            </div>
        `;

        div.onclick = () => this.selectItem(item);
        return div;
    }

    selectItem(itemData) {
        this.player.addItem(itemData);

        // Cacher le menu
        this.uiContainer.main.style.display = "none";
        this.isPaused = false;

        // --- FIX : REDONNER LE FOCUS AU JEU ---
        // On récupère le canvas via le moteur et on force le focus dessus
        const canvas = this.engine.getRenderingCanvas();
        if (canvas) {
            canvas.focus();
        }
    }


}