// MapSystem.js - Manages the game map and tiles

class Tile {
    constructor(height, type, color, moveCost) {
        this.height = height;
        this.type = type;
        this.color = color;
        this.moveCost = moveCost;
    }
}

class Map {
    constructor(rows = MAP_ROWS, cols = MAP_COLS) {
        this.rows = rows;
        this.cols = cols;
        this.tiles = [];
        this.generateMap();
    }

    generateMap() {
        // Initialize the tiles array
        for (let r = 0; r < this.rows; r++) {
            this.tiles[r] = [];
            for (let q = 0; q < this.cols; q++) {
                // Generate perlin noise value
                const n = ((perlinNoise(q / PERLIN_SCALE, r / PERLIN_SCALE) + 1) / 2) + (Math.random() - 0.5) * 0.1;
                let height, type, moveCost;

                // Determine tile type based on noise value
                if (n < WATER_THRESHOLD) {
                    height = WATER_BASE_HEIGHT + Math.random() * WATER_HEIGHT_VARIATION;
                    type = "WATER";
                    moveCost = Infinity; // Water is impassable
                } else if (n < GRASS_THRESHOLD) {
                    height = GRASS_BASE_HEIGHT + Math.random() * GRASS_HEIGHT_VARIATION;
                    type = "GRASS";
                    moveCost = 1;
                } else if (n < FOREST_THRESHOLD) {
                    height = FOREST_BASE_HEIGHT + Math.random() * FOREST_HEIGHT_VARIATION;
                    type = "FOREST";
                    moveCost = 2;
                } else {
                    height = MOUNTAIN_BASE_HEIGHT + Math.random() * MOUNTAIN_HEIGHT_VARIATION;
                    type = "MOUNTAIN";
                    moveCost = Infinity; // Mountains are impassable
                }

                const color = TerrainSystem.getTerrainColor(type);
                console.log('TerrainSystem color for', type, ':', color, 'typeof:', typeof color);
                this.tiles[r][q] = new Tile(height, type, color, moveCost);
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