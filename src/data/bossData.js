import * as BABYLON from "@babylonjs/core";

export const BOSSES = {
    // --- 1. ARÈNE INFINIE ---
    "infinite": [
        { // Boss à 5 minutes
            name: "ROI GLUANT",
            hp: 5000, damage: 25, speed: 0.15, scale: 4,
            color: new BABYLON.Color3(0, 1, 0.2), pattern: "charge", dropXp: 1000
        },
        { // Boss à 10 minutes
            name: "REINE DES ESSAIMS",
            hp: 12000, damage: 35, speed: 0.2, scale: 3.5,
            color: new BABYLON.Color3(0.8, 0.8, 0), pattern: "dash", dropXp: 3000
        },
        { // Boss à 15 minutes
            name: "SEIGNEUR DES ABYSSES",
            hp: 25000, damage: 60, speed: 0.12, scale: 6,
            color: new BABYLON.Color3(0.1, 0.1, 0.3), pattern: "tank", dropXp: 8000
        }
    ],

    // --- 2. LE COULOIR ---
    "corridor": [
        { // Boss à 5 minutes
            name: "LE BROYEUR",
            hp: 8000, damage: 50, speed: 0.08, scale: 6,
            color: new BABYLON.Color3(0.8, 0.1, 0.1), pattern: "tank", dropXp: 1500
        },
        { // Boss à 10 minutes
            name: "SPECTRE HURLEUR",
            hp: 15000, damage: 45, speed: 0.18, scale: 4,
            color: new BABYLON.Color3(0, 1, 1), pattern: "charge", dropXp: 3500
        },
        { // Boss à 15 minutes
            name: "COLOSSE D'ACIER",
            hp: 35000, damage: 100, speed: 0.05, scale: 8,
            color: new BABYLON.Color3(0.5, 0.5, 0.5), pattern: "tank", dropXp: 10000
        }
    ],

    // --- 3. L'ARÈNE FERMÉE (COLISEUM) ---
    "coliseum": [
        { // Boss à 5 minutes
            name: "CHAMPION DÉCHU",
            hp: 6000, damage: 40, speed: 0.25, scale: 2.5,
            color: new BABYLON.Color3(0.5, 0, 1), pattern: "dash", dropXp: 1500
        },
        { // Boss à 10 minutes
            name: "BÊTE DE L'OMBRE",
            hp: 14000, damage: 60, speed: 0.3, scale: 3.5,
            color: new BABYLON.Color3(0.1, 0, 0), pattern: "charge", dropXp: 4000
        },
        { // Boss à 15 minutes
            name: "EMPEREUR IMMORTEL",
            hp: 30000, damage: 75, speed: 0.22, scale: 4.5,
            color: new BABYLON.Color3(1, 0.8, 0), pattern: "tank", dropXp: 12000
        }
    ]
};