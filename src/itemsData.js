export const WEAPONS = {
    // 1. BAGUETTE (Mono-cible, rapide)
    "magic_wand": {
        id: "magic_wand",
        name: "Baguette Magique",
        type: "weapon",
        description: "Tir rapide sur l'ennemi le plus proche.",
        maxLevel: 5,
        damage: 10,
        cooldown: 50,
        speed: 0.8,
        pierce: 1, // Disparait au premier impact
        area: 0,   // Pas d'explosion
        pattern: "nearest"
    },
    // 2. HACHE (Ligne droite, Transperce, Dégâts moyens)
    "axe": {
        id: "axe",
        name: "Hache de Guerre",
        type: "weapon",
        description: "Tire droit et transperce les ennemis.",
        maxLevel: 5,
        damage: 15, // Dégâts modérés
        cooldown: 70,
        speed: 0.5,
        pierce: 999, // Infini
        area: 0,
        pattern: "straight" // Modifié : plus d'arc, tir tout droit
    },
    // 3. MISSILE (Droit, Explosion Moyenne)
    "missile": {
        id: "missile",
        name: "Missile Magique",
        type: "weapon",
        description: "Explose au contact.",
        maxLevel: 5,
        damage: 30,
        cooldown: 120, // Lent
        speed: 0.7,
        pierce: 1, // Touche 1 ennemi et explose
        area: 6,   // Rayon d'explosion (3 mètres)
        pattern: "nearest"
    },
    // 4. GRENADE ÉLECTRIQUE (Parabolique, Grosse Zone)
    "grenade": {
        id: "grenade",
        name: "Grenade Volt",
        type: "weapon",
        description: "Lance une bombe en cloche.",
        maxLevel: 5,
        damage: 50,
        cooldown: 150,
        speed: 0.4,
        pierce: 1,
        area: 10,  // Grosse zone (5 mètres)
        pattern: "lob" // Tir en cloche
    }
};

// ... (Garder PASSIVES et EVOLUTIONS, tu peux ajouter les évolutions pour missile/grenade plus tard)
export const PASSIVES = {
    "spinach": { id: "spinach", name: "Épinards", type: "passive", statBonus: { damage: 0.2 } },
    "clover":  { id: "clover",  name: "Trèfle",   type: "passive", statBonus: { crit: 0.1 } }
};
export const EVOLUTIONS = {}; // Vide pour l'instant pour alléger