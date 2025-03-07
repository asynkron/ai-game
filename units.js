const unitTypes = {
    "OrcBarbarian": { symbol: "O", name: "Orc Barbarian", maxHp: 20, hp: 20, move: 2, attack: 5, range: 1 },
    "ElfArcher": { symbol: "E", name: "Elf Archer", maxHp: 15, hp: 15, move: 3, attack: 4, range: 2 },
    "Troll": { symbol: "T", name: "Troll", maxHp: 30, hp: 30, move: 1, attack: 6, range: 1 },
    "Catapult": { symbol: "C", name: "Catapult", maxHp: 10, hp: 10, move: 1, attack: 8, range: 3 }
};

const allUnits = [];

function initUnits() {
    players[0].units.push(UnitSystem.createUnit("ElfArcher", 2, 2, 0));
    players[0].units.push(UnitSystem.createUnit("Catapult", 3, 3, 0));
    players[1].units.push(UnitSystem.createUnit("OrcBarbarian", 5, 5, 1));
    players[1].units.push(UnitSystem.createUnit("Troll", 6, 6, 1));
    console.log("miniMapScene children after units:", miniMapScene.children.length);
}