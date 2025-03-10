// TerrainSystem.js

class TerrainSystem {
    static terrainTypes = {
        WATER: {
            name: 'water',
            moveCost: Infinity,
            color: 0x293D86,
            baseHeight: -0.1,
            heightVariation: 0,
            heightModifier: 0,
            threshold: 0.4,
            impassable: true
        },
        GRASS: {
            name: 'grass',
            moveCost: 1,
            color: 0x495627,
            baseHeight: 0.1,
            heightVariation: 0.1,
            heightModifier: 0,
            threshold: 0.6,
            impassable: false
        },
        FOREST: {
            name: 'forest',
            moveCost: 2,
            color: 0x2A390C,
            baseHeight: 0.3,
            heightVariation: 0.4,
            heightModifier: 0.3,
            threshold: 0.7,
            impassable: false
        },
        MOUNTAIN: {
            name: 'mountain',
            moveCost: 3,
            color: 0x6F6D64,
            baseHeight: 0.6,
            heightVariation: 0.5,
            heightModifier: 1.5,
            threshold: 1.0,
            impassable: true
        }
    };

    static getTerrainMoveCost(terrainType) {
        return this.terrainTypes[terrainType]?.moveCost || 1;
    }

    static getTerrainColor(terrainType) {
        return this.terrainTypes[terrainType]?.color || this.terrainTypes.GRASS.color;
    }

    static getTerrainName(terrainType) {
        return this.terrainTypes[terrainType]?.name || 'grass';
    }

    static getTerrainBaseHeight(terrainType) {
        return this.terrainTypes[terrainType]?.baseHeight || this.terrainTypes.GRASS.baseHeight;
    }

    static getTerrainHeightVariation(terrainType) {
        return this.terrainTypes[terrainType]?.heightVariation || this.terrainTypes.GRASS.heightVariation;
    }

    static getTerrainHeightModifier(terrainType) {
        return this.terrainTypes[terrainType]?.heightModifier || 0;
    }

    static getTerrainThreshold(terrainType) {
        return this.terrainTypes[terrainType]?.threshold || this.terrainTypes.GRASS.threshold;
    }

    static isImpassable(terrainType) {
        return this.terrainTypes[terrainType]?.impassable || false;
    }

    static getMoveCost(hex) {
        const terrainType = hex.userData.type?.toUpperCase();
        return this.terrainTypes[terrainType]?.moveCost || 1;
    }

    static getHeight(hex) {
        const terrainType = hex.userData.type?.toUpperCase();
        const baseHeight = hex.userData.height || 0;
        const heightModifier = this.getTerrainHeightModifier(terrainType);
        return baseHeight + heightModifier;
    }

    static getTerrainTypeFromNoise(noiseValue) {
        // Convert terrainTypes to array and sort by threshold
        const sortedTypes = Object.entries(this.terrainTypes)
            .sort(([, a], [, b]) => a.threshold - b.threshold);

        // Check thresholds in ascending order
        for (const [type, data] of sortedTypes) {
            if (noiseValue <= data.threshold) {
                return type;
            }
        }
        return 'MOUNTAIN'; // Default to mountain if above all thresholds
    }
}

console.log('TerrainSystem.js loaded'); 