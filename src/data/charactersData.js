export const CHARACTERS = {
    "paladin": {
        id: "paladin",
        name: "PALADIN",
        description: "Robuste. Son Aura sacrée brûle les ennemis proches.",
        color: "#dddddd", // Gris clair / Blanc
        stats: { maxHp: 150, moveSpeed: 0.25, damageMult: 1 },
        passive: {
            type: "aura",
            radius: 5,
            baseDamage: 2 // Dégâts par frame (très rapide)
        }
    },
    "summoner": {
        id: "summoner",
        name: "INVOCATEUR",
        description: "Fragile. Son familier foudroie l'ennemi le plus proche.",
        color: "#aa00ff", // Violet
        stats: { maxHp: 80, moveSpeed: 0.28, damageMult: 1.2 },
        passive: {
            type: "companion",
            cooldown: 60, // Frappe toutes les secondes (60 frames)
            baseDamage: 15,
            range: 15
        }
    },
    "vampire": {
        id: "vampire",
        name: "VAMPIRE",
        description: "Rapide. Draine la vie : soigne 1 PV tous les 10 kills.",
        color: "#ff0000", // Rouge
        stats: { maxHp: 100, moveSpeed: 0.35, damageMult: 0.9 },
        passive: {
            type: "lifesteal",
            killsRequired: 10,
            healAmount: 1
        }
    }
};