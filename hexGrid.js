// hexGrid.js
const hexGrid = [];

function addHex(hex) {
    hexGrid.push(hex);
}

function findHex(q, r) {
    return hexGrid.find(h => h.userData.q === q && h.userData.r === r);
}

function getHexesInRange(q, r, range) {
    const hexes = [];
    for (let dq = -range; dq <= range; dq++) {
        for (let dr = -range; dr <= range; dr++) {
            if (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr) <= range * 2) {
                const hex = findHex(q + dq, r + dr);
                if (hex) hexes.push(hex);
            }
        }
    }
    return hexes;
}

function getHexesInPath(q1, r1, q2, r2) {
    const path = [];
    const steps = Math.max(Math.abs(q2 - q1), Math.abs(r2 - r1));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const q = Math.round(q1 + (q2 - q1) * t);
        const r = Math.round(r1 + (r2 - r1) * t);
        const hex = findHex(q, r);
        if (hex) path.push(hex);
    }
    return path;
}

function isHexOccupied(q, r, excludeUnit = null) {
    return allUnits.some(u => u.userData.q === q && u.userData.r === r && u !== excludeUnit);
} 