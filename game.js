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
            const worldPos = getWorldPosition(hexGroup.userData.q, hexGroup.userData.r, hexGroup.userData.height + 0.01);
            highlightOutline.position.copy(worldPos);
            highlightOutline.visible = true;
        } else {
            highlightOutline.visible = false;
        }

        if (isDragging) {
            const deltaX = -(event.clientX - previousMousePosition.x) * 0.05;
            const deltaY = -(event.clientY - previousMousePosition.y) * 0.05;
            updateCameraPosition(deltaX, deltaY, matrices);
            previousMousePosition = { x: event.clientX, y: event.clientY };
        } else if (selectedUnit) {
            clearPathLine();
            if (intersects.length > 0) {
                const hexGroup = intersects[0].object.parent;
                if (isValidMove(selectedUnit, hexGroup)) {
                    const path = getPath(selectedUnit.userData.q, selectedUnit.userData.r, hexGroup.userData.q, hexGroup.userData.r, selectedUnit.userData.move);
                    if (path.length > 0) {
                        drawPath(selectedUnit, path);
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
                handleUnitSelection(unitOnHex);
                return;
            } else if (selectedUnit && isValidMove(selectedUnit, hexGroup)) {
                handleUnitMovement(selectedUnit, hexGroup);
            }
            return;
        }

        // Clear selection if clicking elsewhere
        if (selectedUnit) {
            selectedUnit = null;
            clearPathLine();
            clearHighlights();
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
    players[currentTurn].units.forEach(u => u.userData.move = unitTypes[u.userData.type].move);
    if (currentTurn !== 0) cpuTurn();
    selectedUnit = null;
    clearPathLine();
    clearHighlights();
}

function cpuTurn() {
    setTimeout(nextTurn, 1000);
}

function initGame() {
    console.log('initGame called');
    initRenderer();
    const { mapCenterX, mapCenterZ } = createMap();
    initUnits();
    const matrices = setupCamera(mapCenterX, mapCenterZ);
    const minimap = setupMinimap(mapCenterX, mapCenterZ);
    setupEventListeners(matrices);
    animate(minimap.miniMapCamera, matrices, minimap.mapWidth, minimap.mapHeight, minimap.highlightGroup);
}

console.log('game.js loaded, initGame defined');