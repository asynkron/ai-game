// PathfindingSystem.js - Handles pathfinding and movement range calculations

class PathfindingSystem {
    static dijkstra(startQ, startR, maxCost = Infinity) {
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
        const visited = new Set();
        const reachable = new Set();

        // Initialize distances
        hexGrid.forEach(hex => {
            const coord = new HexCoord(hex.userData.q, hex.userData.r);
            const key = coord.getKey();
            distances.set(key, Infinity);
            unvisited.add(key);
        });

        const startCoord = new HexCoord(startQ, startR);
        const startKey = startCoord.getKey();
        distances.set(startKey, 0);
        reachable.add(startKey);

        while (unvisited.size > 0) {
            let currentKey = null;
            let minDistance = Infinity;
            unvisited.forEach(key => {
                if (distances.get(key) < minDistance) {
                    minDistance = distances.get(key);
                    currentKey = key;
                }
            });

            if (minDistance > maxCost) break;

            unvisited.delete(currentKey);
            visited.add(currentKey);

            const currentCoord = HexCoord.fromKey(currentKey);
            const currentHex = currentCoord.getHex();
            if (!currentHex) continue;

            const validNeighbors = currentCoord.getValidNeighbors(visited);

            validNeighbors.forEach(({ coord, hex }) => {
                if (coord.isOccupied()) return;

                const neighborKey = coord.getKey();
                const cost = TerrainSystem.getMoveCost(hex);
                if (cost === Infinity) return;

                const newDistance = distances.get(currentKey) + cost;

                if (newDistance < distances.get(neighborKey)) {
                    distances.set(neighborKey, newDistance);
                    previous.set(neighborKey, currentKey);
                    if (newDistance <= maxCost) {
                        reachable.add(neighborKey);
                    }
                }
            });
        }

        return { distances, previous, reachable };
    }

    static getPath(q1, r1, q2, r2, move) {
        const startCoord = new HexCoord(q1, r1);
        const endCoord = new HexCoord(q2, r2);
        const { previous, reachable } = this.dijkstra(startCoord.q, startCoord.r, move);
        const path = [];
        let currentKey = endCoord.getKey();

        if (!reachable.has(currentKey)) {
            return [];
        }

        while (previous.has(currentKey)) {
            const coord = HexCoord.fromKey(currentKey);
            const hex = coord.getHex();
            if (hex) {
                path.unshift(hex);
            }
            currentKey = previous.get(currentKey);
        }

        const startHex = startCoord.getHex();
        if (startHex) {
            path.unshift(startHex);
        }

        return path.slice(1);
    }

    static getHexesInPath(q1, r1, q2, r2) {
        const path = [];
        const steps = Math.max(Math.abs(q2 - q1), Math.abs(r2 - r1));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const q = Math.round(q1 + (q2 - q1) * t);
            const r = Math.round(r1 + (r2 - r1) * t);
            const hex = HexCoord.findHex(q, r);
            if (hex) path.push(hex);
        }
        return path;
    }

    static getHexesInRange(q, r, range) {
        const hexes = [];
        const visited = new Set();
        const startCoord = new HexCoord(q, r);
        const queue = [{ coord: startCoord, distance: 0 }];
        visited.add(startCoord.getKey());

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.distance >= range) continue;

            const validNeighbors = current.coord.getValidNeighbors(visited);

            validNeighbors.forEach(({ coord, hex }) => {
                if (TerrainSystem.getMoveCost(hex) !== Infinity) {
                    hexes.push(hex);
                    visited.add(coord.getKey());
                    queue.push({
                        coord,
                        distance: current.distance + 1
                    });
                }
            });
        }

        return hexes;
    }
}

console.log('PathfindingSystem.js loaded'); 