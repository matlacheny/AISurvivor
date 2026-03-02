// --- 1. LES PASSIFS (Nécessaires pour évoluer les armes) ---
export const PASSIVES = {
    "spinach": {
        id: "spinach",
        name: "Épinards",
        type: "passive",
        description: "Augmente les dégâts de 10%.",
        statBonus: { damage: 0.1 }
    },
    "clover": {
        id: "clover",
        name: "Trèfle",
        type: "passive",
        description: "Augmente la chance de critique.",
        statBonus: { crit: 0.1 }
    },
    "empty_tome": {
        id: "empty_tome",
        name: "Tome Vide",
        type: "passive",
        description: "Réduit les temps de recharge de 10%.",
        statBonus: { cooldown: 0.1 }
    },
    "candelabrador": {
        id: "candelabrador",
        name: "Candélabre",
        type: "passive",
        description: "Augmente la taille des zones d'effet.",
        statBonus: { area: 0.2 }
    },
    "bracer": {
        id: "bracer",
        name: "Brassard",
        type: "passive",
        description: "Augmente la vitesse des projectiles.",
        statBonus: { speed: 0.05 }
    },
    "wings": {
        id: "wings",
        name: "Ailes",
        type: "passive",
        description: "Le personnage se déplace 10% plus vite.",
        statBonus: { moveSpeed: 0.03 } // +0.03 car la vitesse de base est 0.3 (donc +10%)
    },
    "spellbinder": {
        id: "spellbinder",
        name: "Envoûteur",
        type: "passive",
        description: "Augmente la durée de vie des attaques.",
        statBonus: { duration: 0.2 }
    }
};

// --- 2. LES ARMES DE BASE ---
export const WEAPONS = {
    // 1. BAGUETTE (Évolution avec Tome Vide)
    "magic_wand": {
        id: "magic_wand",
        name: "Baguette Magique",
        type: "weapon",
        description: "Tir rapide sur l'ennemi le plus proche.",
        maxLevel: 5,
        evolutionId: "holy_wand",
        requiredPassive: "empty_tome",
        // Stats
        damage: 10, cooldown: 50, speed: 0.8, pierce: 1, area: 0,
        pattern: "nearest"
    },
    "nuke": {
        id: "nuke",
        name: "Nuke",
        type: "weapon",
        description: "Détruit tout",
        maxLevel: 5,
        // Stats
        damage: 999999, cooldown: 50, speed: 0.8, pierce: 1, area: 99999,
        pattern: "nearest"
    },

    // 2. HACHE (Évolution avec Candélabre)
    "axe": {
        id: "axe",
        name: "Hache de Guerre",
        type: "weapon",
        description: "Tire droit et transperce les ennemis.",
        maxLevel: 5,
        evolutionId: "death_spiral",
        requiredPassive: "candelabrador",
        // Stats
        damage: 20, cooldown: 70, speed: 0.5, pierce: 3, area: 0,
        pattern: "straight"
    },

    // 3. MISSILE (Évolution avec Épinards)
    "missile": {
        id: "missile",
        name: "Missile Magique",
        type: "weapon",
        description: "Explose au contact.",
        maxLevel: 5,
        evolutionId: "nuclear_missile",
        requiredPassive: "spinach",
        // Stats
        damage: 30, cooldown: 120, speed: 0.7, pierce: 1, area: 5,
        pattern: "nearest" // Vise l'ennemi, explose au contact
    },

    // 4. GRENADE (Évolution avec Brassard)
    "grenade": {
        id: "grenade",
        name: "Grenade Volt",
        type: "weapon",
        description: "Lance une bombe en cloche.",
        maxLevel: 5,
        evolutionId: "plasma_grenade",
        requiredPassive: "bracer",
        // Stats
        damage: 40, cooldown: 140, speed: 0.4, pierce: 1, area: 8,
        pattern: "lob" // Parabole
    },

    // 5. NOUVEAU : BOULE DE FEU (Lent, Gros Dégâts - Évolution avec Envoûteur)
    "fireball": {
        id: "fireball",
        name: "Boule de Feu",
        type: "weapon",
        description: "Lent mais dévastateur.",
        maxLevel: 5,
        evolutionId: "hellfire",
        requiredPassive: "spellbinder",
        // Stats
        damage: 60, cooldown: 90, speed: 0.3, pierce: 2, area: 0,
        pattern: "straight" // Tir tout droit
    },

    // 6. NOUVEAU : FOUDRE (Frappe aléatoire - Évolution avec Trèfle)
    "lightning": {
        id: "lightning",
        name: "Anneau de Foudre",
        type: "weapon",
        description: "Frappe des ennemis aléatoires.",
        maxLevel: 5,
        evolutionId: "thunder_loop",
        requiredPassive: "clover",
        // Stats
        damage: 15, cooldown: 60, speed: 0, pierce: 1, area: 4,
        pattern: "random_sky" // Nouveau pattern (voir note plus bas)
    }
};

// --- 3. LES ÉVOLUTIONS (Armes Ultimes) ---
export const EVOLUTIONS = {
    // Évolution Baguette : Mitraillette
    "holy_wand": {
        id: "holy_wand",
        name: "BAGUETTE SAINTE",
        type: "evolution",
        description: "Tir continu sans temps de recharge.",
        damage: 15, cooldown: 8, speed: 1.2, pierce: 1, area: 0,
        pattern: "nearest"
    },

    // Évolution Hache : Spirale de la Mort (Faux qui partent dans toutes les directions)
    "death_spiral": {
        id: "death_spiral",
        name: "SPIRALE DE LA MORT",
        type: "evolution",
        description: "Lance des faux géantes tout autour.",
        damage: 40, cooldown: 100, speed: 0.6, pierce: 999, area: 0,
        pattern: "radial" // Tir à 360 degrés
    },

    // Évolution Missile : Nuke
    "nuclear_missile": {
        id: "nuclear_missile",
        name: "OGIVE NUCLÉAIRE",
        type: "evolution",
        description: "Explosion massive qui nettoie l'écran.",
        damage: 200, cooldown: 200, speed: 0.5, pierce: 1, area: 20, // Zone énorme
        pattern: "nearest"
    },

    // Évolution Grenade : Plasma
    "plasma_grenade": {
        id: "plasma_grenade",
        name: "GRENADE PLASMA",
        type: "evolution",
        description: "Explosion rapide et zone électrique.",
        damage: 80, cooldown: 80, speed: 0.6, pierce: 1, area: 12,
        pattern: "lob"
    },

    // Évolution Boule de Feu : Enfers
    "hellfire": {
        id: "hellfire",
        name: "FLAMMES DE L'ENFER",
        type: "evolution",
        description: "Traverse tout et grossit.",
        damage: 100, cooldown: 80, speed: 0.5, pierce: 999, area: 2, // Zone sert ici pour la taille du projectile
        pattern: "straight"
    },

    // Évolution Foudre : Tonnerre
    "thunder_loop": {
        id: "thunder_loop",
        name: "BOUCLE DE TONNERRE",
        type: "evolution",
        description: "Frappe deux fois au même endroit.",
        damage: 50, cooldown: 40, speed: 0, pierce: 1, area: 8,
        pattern: "random_sky"
    }
};