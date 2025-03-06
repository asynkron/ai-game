// utils.js
console.log('utils.js starting');

// Perlin noise implementation
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
    return a + t * (b - a);
}

function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlinNoise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X] + Y;
    const AA = p[A];
    const AB = p[A + 1];
    const B = p[X + 1] + Y;
    const BA = p[B];
    const BB = p[B + 1];

    return lerp(v, lerp(u, grad(p[AA], x, y), grad(p[BA], x - 1, y)),
        lerp(u, grad(p[AB], x, y - 1), grad(p[BB], x - 1, y - 1)));
}

// Permutation table
const p = new Array(512);
const permutation = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142,
    8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117,
    35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41,
    55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89,
    18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226,
    250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182,
    189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43,
    172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97,
    228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
    49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138,
    236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i] = permutation[i];
}

function noise(q, r) {
    return (Math.sin(q * 12.9898 + r * 78.233) * 43758.5453123) % 1;
}

function getHexPosition(q, r) {
    const x = HEX_RADIUS * 1.5 * q;
    const z = HEX_RADIUS * Math.sqrt(3) * (r + (q % 2) / 2);
    return { x, z };
}

function getWorldPosition(q, r, height = 0) {
    const pos = getHexPosition(q, r);
    return new THREE.Vector3(pos.x, height, pos.z);
}

function getDistance(q1, r1, q2, r2) {
    return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs((q1 + r1) - (q2 + r2)));
}

function getPath(q1, r1, q2, r2, move) {
    // Simplified stub—replace with actual pathfinding if needed
    const path = [];
    const steps = Math.min(move, Math.max(Math.abs(q2 - q1), Math.abs(r2 - r1)));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const q = Math.round(q1 + (q2 - q1) * t);
        const r = Math.round(r1 + (r2 - r1) * t);
        const hex = hexGrid.find(h => h.userData.q === q && h.userData.r === r);
        if (hex) path.push(hex);
    }
    return path.slice(1); // Exclude starting hex
}

function moveUnit(unit, path) {
    let delay = 0;
    path.forEach((hex) => {
        setTimeout(() => {
            const pos = getWorldPosition(hex.userData.q, hex.userData.r);
            unit.position.copy(pos);
            unit.userData.q = hex.userData.q;
            unit.userData.r = hex.userData.r;

            // Update minimap unit position
            const miniPos = getWorldPosition(hex.userData.q, hex.userData.r, 0.5);
            unit.userData.miniUnit.position.copy(miniPos);
        }, delay);
        delay += 200;
    });
}

function highlightMoveRange(q, r, move) {
    const highlights = group.getObjectByName("highlights") || new THREE.Group();
    highlights.name = "highlights";
    while (highlights.children.length > 0) highlights.remove(highlights.children[0]);

    // Create a hexagon shape that matches the hex tiles
    const shape = new THREE.Shape();
    const radius = HEX_RADIUS;
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) {
            shape.moveTo(x, y);
        } else {
            shape.lineTo(x, y);
        }
    }

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });

    for (let dq = -move; dq <= move; dq++) {
        for (let dr = -move; dr <= move; dr++) {
            if (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr) <= move * 2) {
                const hex = hexGrid.find(h => h.userData.q === q + dq && h.userData.r === r + dr);
                if (hex && hex.userData.moveCost !== Infinity) {
                    const highlight = new THREE.Mesh(geometry, material);
                    const pos = getWorldPosition(hex.userData.q, hex.userData.r, hex.userData.height + 0.01);
                    highlight.position.copy(pos);
                    highlight.rotation.x = -Math.PI / 2;
                    highlights.add(highlight);
                }
            }
        }
    }
    group.add(highlights);
}

function drawPath(unit, path) {
    if (pathLine) {
        group.remove(pathLine);
    }
    const points = [];
    const pathHeight = 0.3;

    // Add unit's current position
    points.push(getWorldPosition(unit.userData.q, unit.userData.r, pathHeight));

    // Add each hex in the path
    path.forEach(hex => {
        points.push(getWorldPosition(hex.userData.q, hex.userData.r, pathHeight));
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 10 });
    pathLine = new THREE.Line(geometry, material);
    pathLine.computeLineDistances();
    group.add(pathLine);
}

function getHexIntersects(raycaster) {
    const intersectObjects = [];
    hexGrid.forEach(hexGroup => {
        hexGroup.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
                intersectObjects.push(child);
            }
        });
    });
    return raycaster.intersectObjects(intersectObjects);
}

function getMinimapWorldPosition(event, minimapOverlay) {
    const rect = minimapOverlay.getBoundingClientRect();
    const clickX = (event.clientX - rect.left) / MINIMAP_WIDTH;
    const clickY = (event.clientY - rect.top) / MINIMAP_HEIGHT;
    if (clickX >= 0 && clickX <= 1 && clickY >= 0 && clickY <= 1) {
        const mapWidth = MAP_COLS * HEX_RADIUS * 1.5;
        const mapHeight = MAP_ROWS * HEX_RADIUS * Math.sqrt(3);
        return {
            x: clickX * mapWidth,
            z: clickY * mapHeight
        };
    }
    return null;
}

function updateCameraLookAt(camera, worldPos, matrices) {
    const worldLookDirection = getLookDirection(cameraHeight).clone().applyMatrix4(matrices.localToWorldMatrix);
    camera.lookAt(worldPos.clone().add(worldLookDirection.multiplyScalar(10)));
}

console.log('utils.js loaded');