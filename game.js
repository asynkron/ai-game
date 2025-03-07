// game.js
console.log('game.js starting');

// Ensure `group` is defined or imported correctly
// If using modules, import `group` from the appropriate file
// Example: import { group } from './render';

// Game Data
let currentTurn = 0;
let selectedUnit = null;
let pathLine = null;
let isDragging = false;
let isDraggingMinimap = false;
let previousMousePosition = { x: 0, y: 0 };

// Event Listeners
function setupEventListeners(matrices) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const minimapOverlay = document.getElementById('minimap-overlay');

    const highlightOutline = new THREE.Mesh(
        new THREE.TorusGeometry(
            HEX_RADIUS,  // Radius of the entire torus (center to middle of tube)
            0.1,        // Thickness of the tube
            6,          // Radial segments (keep low for hexagonal shape)
            6,          // Tubular segments (6 for hexagonal)
            Math.PI * 2 // Arc
        ),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        })
    );
    highlightOutline.rotation.x = -Math.PI / 2;  // Lay flat
    highlightOutline.renderOrder = 999;          // Ensure it renders on top
    highlightOutline.material.depthTest = false; // Make it always visible
    highlightOutline.visible = false;
    group.add(highlightOutline);

    function isMinimapPosition(x, y) {
        const rect = minimapOverlay.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    window.addEventListener('mousedown', (event) => {
        const x = event.clientX;
        const y = event.clientY;
        if (isMinimapPosition(x, y)) {
            isDraggingMinimap = true;
        } else {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });

    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if (isDraggingMinimap) {
            const worldPos = getMinimapWorldPosition(event, minimapOverlay);
            if (worldPos) {
                setCameraPosition(worldPos.x, worldPos.z, matrices);
            }
            event.preventDefault();
            event.stopPropagation();
        }

        const intersects = getHexIntersects(raycaster);
        if (intersects.length > 0) {
            const intersectedMesh = intersects[0].object;
            const hexGroup = intersectedMesh.parent;
            const coord = new HexCoord(hexGroup.userData.q, hexGroup.userData.r);
            const worldPos = coord.getWorldPosition(hexGroup.userData.height + 0.01);
            highlightOutline.position.copy(worldPos);
            highlightOutline.visible = true;

            // Show grid coordinates
            console.log(`Tile: (${hexGroup.userData.q}, ${hexGroup.userData.r})`);
        } else {
            highlightOutline.visible = false;
        }

        if (isDragging) {
            const deltaX = -(event.clientX - previousMousePosition.x) * 0.05;
            const deltaY = -(event.clientY - previousMousePosition.y) * 0.05;
            updateCameraPosition(deltaX, deltaY, matrices);
            previousMousePosition = { x: event.clientX, y: event.clientY };
        } else if (selectedUnit) {
            VisualizationSystem.clearPathLine();
            if (intersects.length > 0) {
                const hexGroup = intersects[0].object.parent;
                if (UnitSystem.isValidMove(selectedUnit, hexGroup)) {
                    const path = PathfindingSystem.getPath(selectedUnit.userData.q, selectedUnit.userData.r, hexGroup.userData.q, hexGroup.userData.r, selectedUnit.userData.move);
                    if (path.length > 0) {
                        VisualizationSystem.drawPath(selectedUnit, path);
                    }
                }
            }
        }
    });

    window.addEventListener('mouseup', (event) => {
        if (isDraggingMinimap) {
            const worldPos = getMinimapWorldPosition(event, minimapOverlay);
            if (worldPos) {
                setCameraPosition(worldPos.x, worldPos.z, matrices);
            }
            isDraggingMinimap = false;
            event.preventDefault();
            event.stopPropagation();
        } else if (isDragging) {
            isDragging = false;
        }
    });

    window.addEventListener('wheel', (event) => {
        event.preventDefault();
        const deltaHeight = event.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
        cameraHeight = Math.max(MIN_CAMERA_HEIGHT, Math.min(MAX_CAMERA_HEIGHT, cameraHeight + deltaHeight));
        updateCameraZoom(matrices);
    }, { passive: false });

    window.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = getHexIntersects(raycaster);
        if (intersects.length > 0) {
            const hexGroup = intersects[0].object.parent;
            const unitOnHex = allUnits.find(u => u.userData.q === hexGroup.userData.q && u.userData.r === hexGroup.userData.r);

            if (unitOnHex && currentTurn === 0 && players[0].units.includes(unitOnHex)) {
                UnitSystem.handleSelection(unitOnHex);
                return;
            } else if (selectedUnit && UnitSystem.isValidMove(selectedUnit, hexGroup)) {
                UnitSystem.handleMovement(selectedUnit, hexGroup);
            }
            return;
        }

        // Clear selection if clicking elsewhere
        if (selectedUnit) {
            selectedUnit = null;
            VisualizationSystem.clearPathLine();
            VisualizationSystem.clearHighlights();
        }
    });

    minimapOverlay.addEventListener('click', (event) => {
        const worldPos = getMinimapWorldPosition(event, minimapOverlay);
        if (worldPos) {
            setCameraPosition(worldPos.x, worldPos.z, matrices);
        }
        event.preventDefault();
        event.stopPropagation();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === "Enter") nextTurn();
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        minimapOverlay.style.top = '10px';
        minimapOverlay.style.right = '10px';
    });
}

function nextTurn() {
    currentTurn = (currentTurn + 1) % players.length;
    players[currentTurn].units.forEach(u => u.userData.move = UnitSystem.unitTypes[u.userData.type].move);
    if (currentTurn !== 0) cpuTurn();
    selectedUnit = null;
    VisualizationSystem.clearPathLine();
    VisualizationSystem.clearHighlights();
}

function cpuTurn() {
    setTimeout(nextTurn, 1000);
}

function initGame() {
    console.log('initGame called');
    initRenderer();
    const { mapCenterX, mapCenterZ } = GridSystem.createMap();
    const matrices = setupCamera(mapCenterX, mapCenterZ);
    const { miniMapCamera, mapWidth, mapHeight, highlightGroup } = setupMinimap(mapCenterX, mapCenterZ);
    initUnits();
    setupEventListeners(matrices);
    animate(miniMapCamera, matrices, mapWidth, mapHeight, highlightGroup);
}

console.log('game.js loaded, initGame defined');

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Add fog for depth - adjusted for camera zoom range
    scene.fog = new THREE.Fog(0x87CEEB, 30, 50); // Sky blue color, start at 30 units, end at 50 units
}

function handleHexClick(event) {
    // ... existing code ...
    if (path) {
        VisualizationSystem.clearPathLine();
        // Check if the selected unit can move to the clicked hex
        if (UnitSystem.isValidMove(selectedUnit, hexGroup)) {
            // Draw the path the unit will take
            VisualizationSystem.drawPath(selectedUnit, path);
        }
    }
}

function handleHexHover(event) {
    // ... existing code ...
    if (unitOnHex && unitOnHex.userData.playerIndex === currentPlayerIndex) {
        UnitSystem.handleSelection(unitOnHex);
    } else if (selectedUnit && UnitSystem.isValidMove(selectedUnit, hexGroup)) {
        UnitSystem.handleMovement(selectedUnit, hexGroup);
    }
}

function handleHexLeave(event) {
    // ... existing code ...
    VisualizationSystem.clearPathLine();
    VisualizationSystem.clearHighlights();
}

function handleMinimapClick(event) {
    // ... existing code ...
    VisualizationSystem.clearPathLine();
    VisualizationSystem.clearHighlights();
}

function handleKeyPress(event) {
    // ... existing code ...
    if (event.key === 'Enter') {
        if (UnitSystem.handleMovement(selectedUnit, hexGroup)) {
            // ... existing code ...
        }
    }
}

function selectUnit(unit) {
    UnitSystem.handleSelection(unit);
}