// TerrainSystem.js

class TerrainSystem {
    static terrainTypes = {
        GRASS: { name: 'grass', moveCost: 1, color: TERRAIN_COLORS.GRASS },
        FOREST: { name: 'forest', moveCost: 2, color: TERRAIN_COLORS.FOREST },
        MOUNTAIN: { name: 'mountain', moveCost: 3, color: TERRAIN_COLORS.MOUNTAIN },
        WATER: { name: 'water', moveCost: 4, color: TERRAIN_COLORS.WATER }
    };

    static getTerrainMoveCost(terrainType) {
        return this.terrainTypes[terrainType]?.moveCost || 1;
    }

    static getTerrainColor(terrainType) {
        return this.terrainTypes[terrainType]?.color || TERRAIN_COLORS.GRASS;
    }

    static getTerrainName(terrainType) {
        return this.terrainTypes[terrainType]?.name || 'grass';
    }

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
}

console.log('TerrainSystem.js loaded'); 