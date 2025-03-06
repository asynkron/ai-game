// Remove these lines if defined in constants.js
// const MAP_ROWS = 10;
// const MAP_COLS = 10;
// const HEX_RADIUS = 5;
// const MAP_TILT_ANGLE = Math.PI / 6;

function addHex(hex) {
    hexGrid.push(hex);
}

function createMap() {
    const mapCenterX = (MAP_COLS * HEX_RADIUS * 1.5) / 2;
    const mapCenterZ = (MAP_ROWS * HEX_RADIUS * Math.sqrt(3)) / 2;

    // const hexShape = new THREE.Shape();
    // for (let i = 0; i < 6; i++) {
    //     const angle = (Math.PI / 3) * i;
    //     const x = HEX_RADIUS * Math.cos(angle);
    //     const z = HEX_RADIUS * Math.sin(angle);
    //     if (i === 0) hexShape.moveTo(x, z);
    //     else hexShape.lineTo(x, z);
    // }
    // hexShape.closePath();

    for (let q = 0; q < MAP_COLS; q++) {
        for (let r = 0; r < MAP_ROWS; r++) {
            // Calculate x and z positions correctly for odd/even columns
            const x = HEX_RADIUS * 1.5 * q;
            const z = HEX_RADIUS * Math.sqrt(3) * (r + (q % 2) / 2);
            const n = ((perlinNoise(q / PERLIN_SCALE, r / PERLIN_SCALE) + 1) / 2) + (Math.random() - 0.5) * 0.1;
            let type, color, moveCost, height;

            if (n < WATER_THRESHOLD) {
                type = "water";
                color = TERRAIN_COLORS.WATER;
                moveCost = Infinity;
                height = WATER_BASE_HEIGHT + Math.random() * WATER_HEIGHT_VARIATION;
            } else if (n < GRASS_THRESHOLD) {
                type = "grass";
                color = TERRAIN_COLORS.GRASS;
                moveCost = 1;
                height = GRASS_BASE_HEIGHT + Math.random() * GRASS_HEIGHT_VARIATION;
            } else if (n < FOREST_THRESHOLD) {
                type = "forest";
                color = TERRAIN_COLORS.FOREST;
                moveCost = 1;
                height = FOREST_BASE_HEIGHT + Math.random() * FOREST_HEIGHT_VARIATION;
            } else {
                type = "mountain";
                color = TERRAIN_COLORS.MOUNTAIN;
                moveCost = 2;
                height = MOUNTAIN_BASE_HEIGHT + Math.random() * MOUNTAIN_HEIGHT_VARIATION;
            }

            const hex = createHexPrism(color, x, z, height);
            hex.userData.q = q;  // Store the actual grid coordinates
            hex.userData.r = r;
            group.add(hex);
            addHex(hex);

            const miniHex = createMiniHex(color, x, z);
            miniMapScene.add(miniHex);

            const edges = new THREE.EdgesGeometry(hex.geometry);
            const border = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 }));
            border.position.set(x, height + 0.005, z);
            border.rotation.x = Math.PI / 2;
            group.add(border);
        }
    }
    group.rotation.x = MAP_TILT_ANGLE;

    console.log("miniMapScene children after hexes:", miniMapScene.children.length);
    return { mapCenterX, mapCenterZ };
}

function createHexPrism(color, x, z, height) {
    const geometry = createHexGeometry(HEX_RADIUS, height);
    const material = new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.8,
        flatShading: true
    });
    const hexPrism = new THREE.Mesh(geometry, material);
    hexPrism.position.set(x, height / 2, z);
    hexPrism.castShadow = true;
    hexPrism.receiveShadow = true;

    const hexGroup = new THREE.Group();
    hexGroup.add(hexPrism);

    // Create the wireframe border using the same geometry
    const edges = new THREE.EdgesGeometry(geometry);
    const border = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 1,
            transparent: true,
            opacity: 0.5
        })
    );
    border.position.set(x, height / 2, z);
    hexGroup.add(border);

    // Add userData to the hexGroup for minimap highlighting
    hexGroup.userData = {
        x: x,
        z: z,
        height: height,
        moveCost: material.color.getHex() === TERRAIN_COLORS.WATER ? Infinity : // Water
            material.color.getHex() === TERRAIN_COLORS.MOUNTAIN ? 2 : // Mountain
                1 // Grass and Forest
    };

    return hexGroup;
}

function createMiniHex(color, x, z) {
    const geometry = new THREE.BoxGeometry(1, 0.01, 1);
    const material = new THREE.MeshBasicMaterial({ color });
    const miniHex = new THREE.Mesh(geometry, material);
    miniHex.position.set(x, 0, z);
    return miniHex;
}

function getTerrainColor(noiseValue) {
    let color;
    if (noiseValue < WATER_THRESHOLD) {
        color = TERRAIN_COLORS.WATER;
    } else if (noiseValue < GRASS_THRESHOLD) {
        color = TERRAIN_COLORS.GRASS;
    } else if (noiseValue < FOREST_THRESHOLD) {
        color = TERRAIN_COLORS.FOREST;
    } else {
        color = TERRAIN_COLORS.MOUNTAIN;
    }
    return color;
}

function isValidMove(unit, targetQ) {
    if (!targetQ || !targetQ.userData) return false;
    const material = targetQ.children[0].material;
    const moveCost = material.color.getHex() === TERRAIN_COLORS.WATER ? Infinity : // Water
        material.color.getHex() === TERRAIN_COLORS.MOUNTAIN ? 2 : // Mountain
            1; // Grass and Forest
    return unit.userData.move >= moveCost;
}