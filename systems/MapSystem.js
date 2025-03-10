// MapSystem.js - Manages the game map and tiles

class Tile {
    constructor(height, type, color, moveCost) {
        this.height = height;
        this.type = type;
        this.color = color;
        this.moveCost = moveCost;
    }
}

class GameMap {
    constructor(rows = MAP_ROWS, cols = MAP_COLS) {
        this.rows = rows;
        this.cols = cols;
        this.tiles = [];
        // Initialize the 2D array
        for (let r = 0; r < rows; r++) {
            this.tiles[r] = [];
        }
        this.generateMap();
    }

    generateMap() {
        for (let q = 0; q < MAP_COLS; q++) {
            for (let r = 0; r < MAP_ROWS; r++) {
                // Normalize noise value from [-1,1] to [0,1]
                const rawNoise = perlinNoise(q / PERLIN_SCALE, r / PERLIN_SCALE);
                const noiseValue = (rawNoise + 1) / 2;

                const terrainType = TerrainSystem.getTerrainTypeFromNoise(noiseValue);

                const baseHeight = TerrainSystem.getTerrainBaseHeight(terrainType);
                const heightVariation = TerrainSystem.getTerrainHeightVariation(terrainType);
                const height = baseHeight + Math.random() * heightVariation;

                const color = TerrainSystem.getTerrainColor(terrainType);
                const moveCost = TerrainSystem.getTerrainMoveCost(terrainType);

                this.tiles[r][q] = new Tile(height, terrainType, color, moveCost);
            }
        }
    }

    getTile(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.tiles[row][col];
        }
        return null;
    }
}

console.log('MapSystem.js loaded'); 