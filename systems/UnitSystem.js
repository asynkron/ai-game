// UnitSystem.js

class UnitSystem {
    static setPosition(unit, coord, hex) {
        const pos = coord.getWorldPosition(TerrainSystem.getHeight(hex) + TERRAIN_HEIGHT.UNIT_OFFSET);
        unit.position.copy(pos);
        unit.userData.q = coord.q;
        unit.userData.r = coord.r;

        const miniPos = coord.getWorldPosition(0.5);
        unit.userData.miniUnit.position.copy(miniPos);
    }

    static move(unit, path) {
        let delay = 0;
        path.forEach((hex) => {
            setTimeout(() => {
                const coord = new HexCoord(hex.userData.q, hex.userData.r);
                this.setPosition(unit, coord, hex);
            }, delay);
            delay += 200;
        });
    }

    static handleSelection(unit) {
        selectedUnit = unit;
        VisualizationSystem.clearPathLine();
        this.highlightMoveRange(unit);
    }

    static handleMovement(unit, targetHex) {
        const unitCoord = new HexCoord(unit.userData.q, unit.userData.r);
        const targetCoord = new HexCoord(targetHex.userData.q, targetHex.userData.r);
        const path = getPath(unitCoord.q, unitCoord.r, targetCoord.q, targetCoord.r, unit.userData.move);

        if (path.length > 0) {
            unit.userData.move -= unitCoord.distanceTo(targetCoord);
            this.move(unit, path);
            VisualizationSystem.clearPathLine();
            selectedUnit = null;
            VisualizationSystem.clearHighlights();
            return true;
        }
        return false;
    }

    static highlightMoveRange(unit) {
        VisualizationSystem.clearHighlights();
        const unitCoord = new HexCoord(unit.userData.q, unit.userData.r);
        const { reachable } = dijkstra(unitCoord.q, unitCoord.r, unit.userData.move);

        reachable.forEach(key => {
            const coord = HexCoord.fromKey(key);
            const hex = coord.getHex();
            if (hex && !coord.isOccupied(unit)) {
                VisualizationSystem.highlightHex(hex);
            }
        });
    }

    static isValidMove(unit, targetHex) {
        if (!targetHex || targetHex.userData.moveCost === Infinity) return false;

        const unitCoord = new HexCoord(unit.userData.q, unit.userData.r);
        const targetCoord = new HexCoord(targetHex.userData.q, targetHex.userData.r);
        const { reachable } = dijkstra(unitCoord.q, unitCoord.r, unit.userData.move);

        return reachable.has(targetCoord.getKey());
    }
}

console.log('UnitSystem.js loaded'); 