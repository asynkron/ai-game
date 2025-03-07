// HexCoord.js - Core hex coordinate system class

class HexCoord {
    constructor(q, r) {
        this.q = q;
        this.r = r;
    }

    static fromKey(key) {
        const [q, r] = key.split(',').map(Number);
        return new HexCoord(q, r);
    }

    static isWithinMapBounds(q, r) {
        return q >= 0 && q < MAP_COLS && r >= 0 && r < MAP_ROWS;
    }

    static findHex(q, r) {
        return hexGrid.find(h => h.userData.q === q && h.userData.r === r);
    }

    static getHexPosition(q, r) {
        const x = HEX_RADIUS * 1.5 * q;
        const z = HEX_RADIUS * Math.sqrt(3) * (r + (q % 2) / 2);
        return { x, z };
    }

    static getNeighbors(q, r) {
        const isOddColumn = q % 2 === 1;
        return [
            // NW
            { q: q - 1, r: r - (isOddColumn ? 0 : 1) },
            // N
            { q: q, r: r - 1 },
            // NE
            { q: q + 1, r: r - (isOddColumn ? 0 : 1) },
            // SE
            { q: q + 1, r: r + 1 - (isOddColumn ? 0 : 1) },
            // S
            { q: q, r: r + 1 },
            // SW
            { q: q - 1, r: r + 1 - (isOddColumn ? 0 : 1) }
        ];
    }

    static getDistance(q1, r1, q2, r2) {
        return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs((q1 + r1) - (q2 + r2)));
    }

    getKey() {
        return `${this.q},${this.r}`;
    }

    getHex() {
        return HexCoord.findHex(this.q, this.r);
    }

    isValid() {
        return HexCoord.isWithinMapBounds(this.q, this.r);
    }

    getNeighbors() {
        return HexCoord.getNeighbors(this.q, this.r).map(n => new HexCoord(n.q, n.r));
    }

    getValidNeighbors(visited = new Set()) {
        return this.getNeighbors()
            .filter(n => n.isValid() && !visited.has(n.getKey()))
            .map(n => ({
                coord: n,
                hex: n.getHex()
            }))
            .filter(n => n.hex !== undefined);
    }

    distanceTo(other) {
        return HexCoord.getDistance(this.q, this.r, other.q, other.r);
    }

    getWorldPosition(height = 0) {
        const pos = HexCoord.getHexPosition(this.q, this.r);
        return new THREE.Vector3(pos.x, height, pos.z);
    }

    isOccupied(excludeUnit = null) {
        return isHexOccupied(this.q, this.r, excludeUnit);
    }
}

console.log('HexCoord.js loaded'); 