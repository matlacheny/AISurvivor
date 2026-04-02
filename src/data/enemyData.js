// Configuration des types d'ennemis de base
export const ENEMY_TYPES = [
    // 60% de chance d'être Standard
    { id: "enemy_standard", prob: 0.6, hpMult: 1.0, speedMult: 1.0, isShooter: false, scale: 0.01 },

    // 20% de chance d'être Rapide
    { id: "enemy_fast", prob: 0.2, hpMult: 0.4, speedMult: 1.6, isShooter: false, scale: 0.8 },

    // 10% de chance d'être Tank
    { id: "enemy_tank", prob: 0.1, hpMult: 4.0, speedMult: 0.5, isShooter: false, scale: 2.0 },

    // 10% de chance d'être Artilleur (Tire à 20 unités de distance, toutes les 1.5s)
    { id: "enemy_shooter", prob: 0.1, hpMult: 0.8, speedMult: 0.8, isShooter: true, scale: 1.2, range: 20, fireRate: 90 }
];