const allUnits = [];

function initUnits() {
    players[0].units.push(UnitSystem.createUnit("ElfArcher", 2, 2, 0));
    players[0].units.push(UnitSystem.createUnit("Catapult", 3, 3, 0));
    players[1].units.push(UnitSystem.createUnit("OrcBarbarian", 5, 5, 1));
    players[1].units.push(UnitSystem.createUnit("Troll", 6, 6, 1));
    console.log("miniMapScene children after units:", miniMapScene.children.length);
}