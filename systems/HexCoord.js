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

    getKey() {
        return getHexKey(this.q, this.r);
    }

    getHex() {
        return findHex(this.q, this.r);
    }

    isValid() {
        return isWithinMapBounds(this.q, this.r);
    }

    getNeighbors() {
        return getHexNeighbors(this.q, this.r).map(n => new HexCoord(n.q, n.r));
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
        return getDistance(this.q, this.r, other.q, other.r);
    }

    getWorldPosition(height = 0) {
        const pos = getHexPosition(this.q, this.r);
        return new THREE.Vector3(pos.x, height, pos.z);
    }

    isOccupied(excludeUnit = null) {
        return isHexOccupied(this.q, this.r, excludeUnit);
    }
}

console.log('HexCoord.js loaded'); 