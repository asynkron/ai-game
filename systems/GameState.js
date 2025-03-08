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

    removeUnit(unit) {
        const index = this.units.indexOf(unit);
        if (index > -1) {
            this.units.splice(index, 1);
        }
    }
}

class GameState {
    constructor() {
        this.map = new GameMap();
        this.players = [];
        this.currentTurn = 0;
        this.selectedUnit = null;
        this.initialize();
    }

    initialize() {
        // Create players to match existing setup
        this.players.push(new Player(0, "human", 0x0000ff));  // Blue for player
        this.players.push(new Player(1, "cpu1", 0xff0000));   // Red for AI

        // Initialize starting units for each player
        this.initializeUnits();
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

    getCurrentPlayer() {
        return this.players[this.currentTurn];
    }

    nextTurn() {
        // Reset move points for current player's units
        this.getCurrentPlayer().units.forEach(unit => {
            unit.userData.move = UnitSystem.unitTypes[unit.userData.type].move;
        });

        // Advance turn
        this.currentTurn = (this.currentTurn + 1) % this.players.length;

        // Clear selection
        this.selectedUnit = null;
    }

    selectUnit(unit) {
        if (unit && unit.userData.playerIndex === this.currentTurn) {
            this.selectedUnit = unit;
            return true;
        }
        return false;
    }

    moveUnit(unit, targetQ, targetR) {
        if (!unit || unit.userData.playerIndex !== this.currentTurn) {
            return false;
        }

        const tile = this.map.getTile(targetQ, targetR);
        if (!tile || tile.moveCost === Infinity) {
            return false;
        }

        // Check if target hex is occupied
        const targetHex = GridSystem.findHex(targetQ, targetR);
        const existingUnit = this.players.flatMap(p => p.units)
            .find(u => u.userData.q === targetQ && u.userData.r === targetR);

        if (existingUnit) {
            return false;
        }

        // Update unit position
        unit.userData.q = targetQ;
        unit.userData.r = targetR;
        const pos = HexCoord.getHexPosition(targetQ, targetR);
        unit.position.set(pos.x, tile.height, pos.z);

        return true;
    }

    getUnitAt(q, r) {
        return this.players.flatMap(p => p.units)
            .find(unit => unit.userData.q === q && unit.userData.r === r);
    }

    removeUnit(unit) {
        const player = this.players[unit.userData.playerIndex];
        if (player) {
            player.removeUnit(unit);
        }
    }
}

console.log('GameState.js loaded'); 