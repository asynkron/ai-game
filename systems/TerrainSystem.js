// TerrainSystem.js

class TerrainSystem {
    static isImpassable(hex) {
        return hex.userData.type === 'water' || hex.userData.type === 'mountain';
    }

    static getMoveCost(hex) {
        return this.isImpassable(hex) ? Infinity : 1;
    }

    static getHeight(hex) {
        const baseHeight = hex.userData.height || 0;
        switch (hex.userData.type) {
            case 'mountain':
                return baseHeight + TERRAIN_HEIGHT.MOUNTAIN_MODIFIER;
            case 'forest':
                return baseHeight + TERRAIN_HEIGHT.FOREST_MODIFIER;
            default:
                return baseHeight;
        }
    }

    static getColor(type) {
        switch (type) {
            case 'water':
                return TERRAIN_COLORS.WATER;
            case 'grass':
                return TERRAIN_COLORS.GRASS;
            case 'forest':
                return TERRAIN_COLORS.FOREST;
            case 'mountain':
                return TERRAIN_COLORS.MOUNTAIN;
            default:
                return TERRAIN_COLORS.GRASS;
        }
    }
}

console.log('TerrainSystem.js loaded'); 