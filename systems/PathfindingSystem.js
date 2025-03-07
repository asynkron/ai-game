// PathfindingSystem.js - Handles pathfinding and movement range calculations

class PathfindingSystem {
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
        for (let dq = -range; dq <= range; dq++) {
            for (let dr = -range; dr <= range; dr++) {
                if (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr) <= range * 2) {
                    const hex = HexCoord.findHex(q + dq, r + dr);
                    if (hex) hexes.push(hex);
                }
            }
        }
        return hexes;
    }
}

console.log('PathfindingSystem.js loaded'); 