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
const MOUNTAIN_BASE_HEIGHT = 0.5;
const MOUNTAIN_HEIGHT_VARIATION = 0.3;

const players = [
    { id: "human", color: 0x0000ff, units: [] },
    { id: "cpu1", color: 0xff0000, units: [] }
];
const PERLIN_SCALE = 10;
const WATER_THRESHOLD = 0.4;
const GRASS_THRESHOLD = 0.6;
const FOREST_THRESHOLD = 0.7;
console.log('constants.js loaded');