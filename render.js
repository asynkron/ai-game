// Scene Objects
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const group = new THREE.Group();
const miniMapScene = new THREE.Scene();
let cameraHeight = INITIAL_CAMERA_HEIGHT;

// Lighting Setup
function setupLighting() {
    // Ambient light for overall scene brightness
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Directional light (sunlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add some fog for depth
    scene.fog = new THREE.Fog(0xf0f0f0, 50, 100);
}

// Renderer Initialization
function initRenderer() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    scene.add(group);
    setupLighting();
}

// Camera Setup
function setupCamera(mapCenterX, mapCenterZ) {
    const localToWorldMatrix = new THREE.Matrix4().makeRotationX(MAP_TILT_ANGLE);
    const worldToLocalMatrix = new THREE.Matrix4().makeRotationX(-MAP_TILT_ANGLE);
    let localCameraPos = new THREE.Vector3(mapCenterX, cameraHeight, mapCenterZ);
    let worldCameraPos = localCameraPos.clone().applyMatrix4(localToWorldMatrix);
    camera.position.copy(worldCameraPos);

    const localLookDirection = getLookDirection(cameraHeight);
    const worldLookDirection = localLookDirection.clone().applyMatrix4(localToWorldMatrix);
    camera.lookAt(worldCameraPos.clone().add(worldLookDirection.multiplyScalar(10)));

    return { localToWorldMatrix, worldToLocalMatrix, localCameraPos };
}

function getLookDirection(height) {
    const minDownwardTilt = -1;
    const maxDownwardTilt = -3;
    const tiltFactor = (height - MIN_CAMERA_HEIGHT) / (MAX_CAMERA_HEIGHT - MIN_CAMERA_HEIGHT);
    const downwardTilt = minDownwardTilt + tiltFactor * (maxDownwardTilt - minDownwardTilt);
    return new THREE.Vector3(0, downwardTilt, -1).normalize();
}

function setCameraPosition(worldX, worldZ, matrices) {
    const localPos = new THREE.Vector3(worldX, cameraHeight, worldZ);
    const worldPos = localPos.clone().applyMatrix4(matrices.localToWorldMatrix);
    camera.position.copy(worldPos);
    updateCameraLookAt(camera, worldPos, matrices);
}

function updateCameraPosition(deltaX, deltaY, matrices) {
    const localCameraPos = camera.position.clone().applyMatrix4(matrices.worldToLocalMatrix);
    localCameraPos.x += deltaX;
    localCameraPos.z += deltaY;
    const worldCameraPos = localCameraPos.clone().applyMatrix4(matrices.localToWorldMatrix);
    camera.position.copy(worldCameraPos);
    updateCameraLookAt(camera, worldCameraPos, matrices);
}

function updateCameraZoom(matrices) {
    const localCameraPos = camera.position.clone().applyMatrix4(matrices.worldToLocalMatrix);
    localCameraPos.y = cameraHeight;
    const worldCameraPos = localCameraPos.clone().applyMatrix4(matrices.localToWorldMatrix);
    camera.position.copy(worldCameraPos);
    updateCameraLookAt(camera, worldCameraPos, matrices);
}

// Minimap Setup
function setupMinimap(mapCenterX, mapCenterZ) {
    const mapWidth = MAP_COLS * HEX_RADIUS * 1.5;  // 75
    const mapHeight = MAP_ROWS * HEX_RADIUS * Math.sqrt(3);  // ~86.6

    const miniMapCamera = new THREE.OrthographicCamera(
        -mapWidth / 2, mapWidth / 2,    // x: -37.5 to 37.5
        mapHeight / 2, -mapHeight / 2,  // z: 43.3 to -43.3
        0.1, 1000
    );
    miniMapCamera.position.set(mapCenterX, 100, mapCenterZ);
    miniMapCamera.rotation.x = -Math.PI / 2;
    miniMapCamera.updateProjectionMatrix();
    console.log("miniMapCamera frustum:", -mapWidth / 2, mapWidth / 2, mapHeight / 2, -mapHeight / 2);

    // Centered border
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const borderPoints = [
        new THREE.Vector3(-mapWidth / 2, 0.1, -mapHeight / 2), // Bottom-left
        new THREE.Vector3(mapWidth / 2, 0.1, -mapHeight / 2),  // Bottom-right
        new THREE.Vector3(mapWidth / 2, 0.1, mapHeight / 2),   // Top-right
        new THREE.Vector3(-mapWidth / 2, 0.1, mapHeight / 2),  // Top-left
        new THREE.Vector3(-mapWidth / 2, 0.1, -mapHeight / 2)  // Back to start
    ];
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const border = new THREE.Line(borderGeometry, borderMaterial);
    border.position.set(mapCenterX, 0, mapCenterZ);
    miniMapScene.add(border);
    console.log("Border added with extents:", -mapWidth / 2, mapWidth / 2, -mapHeight / 2, mapHeight / 2);

    // Group for highlight hexes
    const highlightGroup = new THREE.Group();
    highlightGroup.name = "miniMapHighlights";
    miniMapScene.add(highlightGroup);

    console.log("miniMapScene children after setup:", miniMapScene.children.length);

    return { miniMapCamera, mapWidth, mapHeight, highlightGroup };
}

// Animation Loop
function animate(miniMapCamera, matrices, mapWidth, mapHeight, highlightGroup) {
    requestAnimationFrame(() => animate(miniMapCamera, matrices, mapWidth, mapHeight, highlightGroup));

    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.setClearColor(0xf0f0f0, 1);
    renderer.render(scene, camera);

    const left = window.innerWidth - MINIMAP_WIDTH - 10;
    const bottom = window.innerHeight - MINIMAP_HEIGHT - 10;
    renderer.setViewport(left, bottom, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    renderer.setScissor(left, bottom, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    renderer.setClearColor(0x333333, 1);

    updateMiniMapHighlights(highlightGroup, matrices);
    renderer.render(miniMapScene, miniMapCamera);

    renderer.setScissorTest(false);
}

// Update minimap highlights
function updateMiniMapHighlights(highlightGroup, matrices) {
    while (highlightGroup.children.length > 0) {
        highlightGroup.remove(highlightGroup.children[0]);
    }

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(
        new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    );

    const visibleHexes = hexGrid.filter(hex => {
        const localPos = new THREE.Vector3(hex.userData.x, 0, hex.userData.z);
        const worldPos = localPos.clone().applyMatrix4(matrices.localToWorldMatrix);
        return frustum.containsPoint(worldPos);
    });

    const highlightGeometry = new THREE.CircleGeometry(HEX_RADIUS * 1.5, 6);
    const highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });

    visibleHexes.forEach(hex => {
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.set(hex.userData.x, 0.6, hex.userData.z);
        highlight.rotation.x = -Math.PI / 2;
        highlightGroup.add(highlight);
    });

    console.log("Visible hexes in minimap:", visibleHexes.length);
}

// Adjust camera position to be above the map
camera.position.set(0, 50, 0);
camera.lookAt(new THREE.Vector3(0, 0, 0));