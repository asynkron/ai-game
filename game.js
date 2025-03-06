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
            const rect = minimapOverlay.getBoundingClientRect();
            const clickX = (event.clientX - rect.left) / MINIMAP_WIDTH;
            const clickY = (event.clientY - rect.top) / MINIMAP_HEIGHT;
            if (clickX >= 0 && clickX <= 1 && clickY >= 0 && clickY <= 1) {
                const mapWidth = MAP_COLS * HEX_RADIUS * 1.5;
                const mapHeight = MAP_ROWS * HEX_RADIUS * Math.sqrt(3);
                const worldX = clickX * mapWidth;
                const worldZ = clickY * mapHeight;
                setCameraPosition(worldX, worldZ, matrices);
            }
            event.preventDefault();
            event.stopPropagation();
        }

        // Get all meshes from the hexGrid groups
        const intersectObjects = [];
        hexGrid.forEach(hexGroup => {
            hexGroup.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    intersectObjects.push(child);
                }
            });
        });

        const intersects = raycaster.intersectObjects(intersectObjects);
        if (intersects.length > 0) {
            const intersectedMesh = intersects[0].object;
            const hexGroup = intersectedMesh.parent;
            highlightOutline.position.set(hexGroup.userData.x, hexGroup.userData.height + 0.01, hexGroup.userData.z);
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
            // Draw path on mouse move
            if (pathLine) {
                group.remove(pathLine);
                pathLine = null;
            }
            if (intersects.length > 0) {
                const hexGroup = intersects[0].object.parent;
                const dist = getDistance(selectedUnit.userData.q, selectedUnit.userData.r, hexGroup.userData.q, hexGroup.userData.r);
                if (dist > 0 && dist <= selectedUnit.userData.move && hexGroup.userData.moveCost !== Infinity && !allUnits.some(u => u.userData.q === hexGroup.userData.q && u.userData.r === hexGroup.userData.r && u !== selectedUnit)) {
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
            const rect = minimapOverlay.getBoundingClientRect();
            const clickX = (event.clientX - rect.left) / MINIMAP_WIDTH;
            const clickY = (event.clientY - rect.top) / MINIMAP_HEIGHT;
            if (clickX >= 0 && clickX <= 1 && clickY >= 0 && clickY <= 1) {
                const mapWidth = MAP_COLS * HEX_RADIUS * 1.5;
                const mapHeight = MAP_ROWS * HEX_RADIUS * Math.sqrt(3);
                const worldX = clickX * mapWidth;
                const worldZ = clickY * mapHeight;
                setCameraPosition(worldX, worldZ, matrices);
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

        const intersectsUnits = raycaster.intersectObjects(allUnits);
        if (intersectsUnits.length > 0 && currentTurn === 0) {
            const unit = intersectsUnits[0].object.parent;
            if (players[0].units.includes(unit)) {
                selectedUnit = unit;
                if (pathLine) {
                    group.remove(pathLine);
                    pathLine = null;
                }
                highlightMoveRange(unit.userData.q, unit.userData.r, unit.userData.move);
                return;
            }
        }

        const intersectsHexes = raycaster.intersectObjects(hexGrid);
        if (intersectsHexes.length > 0 && selectedUnit) {
            const hex = intersectsHexes[0].object;
            const dist = getDistance(selectedUnit.userData.q, selectedUnit.userData.r, hex.userData.q, hex.userData.r);
            if (dist > 0 && dist <= selectedUnit.userData.move && hex.userData.moveCost !== Infinity && !allUnits.some(u => u.userData.q === hex.userData.q && u.userData.r === hex.userData.r && u !== selectedUnit)) {
                const path = getPath(selectedUnit.userData.q, selectedUnit.userData.r, hex.userData.q, hex.userData.r, selectedUnit.userData.move);
                if (path.length > 0) {
                    selectedUnit.userData.move -= dist;
                    moveUnit(selectedUnit, path);
                    if (pathLine) {
                        group.remove(pathLine);
                        pathLine = null;
                    }
                    selectedUnit = null;
                    scene.remove(scene.getObjectByName("highlights"));
                }
            }
            return;
        }

        // Clear selection if clicking elsewhere
        if (selectedUnit && intersectsHexes.length === 0) {
            selectedUnit = null;
            if (pathLine) {
                group.remove(pathLine);
                pathLine = null;
            }
            scene.remove(scene.getObjectByName("highlights"));
        }
    });

    minimapOverlay.addEventListener('click', (event) => {
        const rect = minimapOverlay.getBoundingClientRect();
        const clickX = (event.clientX - rect.left) / MINIMAP_WIDTH;
        const clickY = (event.clientY - rect.top) / MINIMAP_HEIGHT;
        const mapWidth = MAP_COLS * HEX_RADIUS * 1.5;
        const mapHeight = MAP_ROWS * HEX_RADIUS * Math.sqrt(3);
        const worldX = clickX * mapWidth;
        const worldZ = clickY * mapHeight;
        setCameraPosition(worldX, worldZ, matrices);
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
    if (pathLine) {
        group.remove(pathLine);
        pathLine = null;
    }
    scene.remove(scene.getObjectByName("highlights"));
}

function cpuTurn() {
    setTimeout(nextTurn, 1000);
}

function drawPath(unit, path) {
    if (pathLine) {
        group.remove(pathLine);
    }
    const points = [];
    const pathHeight = 0.3;
    points.push(new THREE.Vector3(unit.position.x, pathHeight, unit.position.z));
    path.forEach(hex => {
        points.push(new THREE.Vector3(hex.userData.x, pathHeight, hex.userData.z));
    });
    console.log("Path points:", points);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 10 });
    pathLine = new THREE.Line(geometry, material);
    pathLine.computeLineDistances();
    group.add(pathLine);
    console.log("Path line added:", pathLine.visible);
}

function setCameraPosition(worldX, worldZ, matrices) {
    const localPos = new THREE.Vector3(worldX, cameraHeight, worldZ);
    const worldPos = localPos.clone().applyMatrix4(matrices.localToWorldMatrix);
    camera.position.copy(worldPos);
    const worldLookDirection = getLookDirection(cameraHeight).clone().applyMatrix4(matrices.localToWorldMatrix);
    camera.lookAt(worldPos.clone().add(worldLookDirection.multiplyScalar(10)));
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