// constants.js
const MAP_ROWS = 50;
const MAP_COLS = 50;
const HEX_RADIUS = 1;
const MAP_TILT_ANGLE = Math.PI / 6;
const INITIAL_CAMERA_HEIGHT = 15;
const MIN_CAMERA_HEIGHT = 5;
const MAX_CAMERA_HEIGHT = 30;
const ZOOM_SPEED = 1;
const MINIMAP_WIDTH = 300;
const MINIMAP_HEIGHT = 300;

// Terrain height constants
const WATER_BASE_HEIGHT = -0.1;
const WATER_HEIGHT_VARIATION = 0;
const GRASS_BASE_HEIGHT = 0.1;
const GRASS_HEIGHT_VARIATION = 0.1;
const FOREST_BASE_HEIGHT = 0.3;
const FOREST_HEIGHT_VARIATION = 0.4;
const MOUNTAIN_BASE_HEIGHT = 0.6;
const MOUNTAIN_HEIGHT_VARIATION = 0.5;

const players = [
    { id: "human", color: 0x0000ff, units: [] },
    { id: "cpu1", color: 0xff0000, units: [] }
];
const PERLIN_SCALE = 10;
const WATER_THRESHOLD = 0.4;
const GRASS_THRESHOLD = 0.6;
const FOREST_THRESHOLD = 0.7;

// Terrain colors
const TERRAIN_COLORS = {
    WATER: 0x293D86,
    GRASS: 0x495627,
    FOREST: 0x2A390C,
    MOUNTAIN: 0x6F6D64
};

// Highlight colors
const HIGHLIGHT_COLORS = {
    VISIBLE_AREA: 0xffff00,  // Yellow for visible area in minimap
    SELECTED: 0x00ff00,      // Green for selected unit
    MOVE_RANGE: 0xffff00     // Yellow for move range
};

// Visual effect colors
const VISUAL_COLORS = {
    PATH: 0xff0000,          // Red for path lines
    HEX_BORDER: 0x000000,    // Black for hex borders
    FOG: 0x87CEEB,          // Sky blue for fog
    BACKGROUND_LIGHT: 0xf0f0f0,  // Light gray for background
    BACKGROUND_DARK: 0x333333    // Dark gray for background
};

// Terrain height modifiers
const TERRAIN_HEIGHT = {
    MOUNTAIN_MODIFIER: 1.5,
    FOREST_MODIFIER: 0.3,
    UNIT_OFFSET: 0.1,        // Height offset for units above terrain
    PATH_HEIGHT: 0.3,        // Height for path visualization
    HIGHLIGHT_OFFSET: 0.01   // Height offset for hex highlights
};

// Function to get terrain type from color
function getTerrainTypeFromColor(color) {
    switch (color) {
        case TERRAIN_COLORS.WATER: return 'water';
        case TERRAIN_COLORS.GRASS: return 'grass';
        case TERRAIN_COLORS.FOREST: return 'forest';
        case TERRAIN_COLORS.MOUNTAIN: return 'mountain';
        default: return 'unknown';
    }
}

console.log('constants.js loaded');