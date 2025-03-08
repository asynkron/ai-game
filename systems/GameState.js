// GameState.js - Manages the overall game state

class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.units = [];
    }

    addUnit(unit) {
        this.units.push(unit);
    }
}

class GameState {
    constructor() {
        this.map = new GameMap();
        this.players = [];

        // Create players to match existing setup
        this.players.push(new Player(0, "human", 0x0000ff));  // Blue for player
        this.players.push(new Player(1, "cpu1", 0xff0000));   // Red for AI
    }

    getUnitAt(q, r) {
        return this.players.flatMap(p => p.units)
            .find(unit => unit.userData.q === q && unit.userData.r === r);
    }

    initializeUnits() {
        // Player units (matching existing setup)
        const playerStartingUnits = [
            { type: 'ElfArcher', q: 2, r: 2 },
            { type: 'Catapult', q: 3, r: 3 }
        ];

        // AI units (matching existing setup)
        const aiStartingUnits = [
            { type: 'OrcBarbarian', q: 5, r: 5 },
            { type: 'Troll', q: 6, r: 6 }
        ];

        // Create player units
        playerStartingUnits.forEach(unitData => {
            const unit = UnitSystem.createUnit(
                unitData.type,
                unitData.q,
                unitData.r,
                0  // playerIndex
            );
            if (unit) {
                this.players[0].addUnit(unit);
            }
        });

        // Create AI units
        aiStartingUnits.forEach(unitData => {
            const unit = UnitSystem.createUnit(
                unitData.type,
                unitData.q,
                unitData.r,
                1  // playerIndex
            );
            if (unit) {
                this.players[1].addUnit(unit);
            }
        });
    }
}

console.log('GameState.js loaded'); 