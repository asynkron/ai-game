// utils.js
console.log('utils.js starting');

/*
 * Hex Grid Coordinate System and Neighbor Calculations
 * 
 * We use an offset coordinate system with flat-top hexes:
 * - q: column (horizontal position)
 * - r: row (vertical position)
 * 
 * The grid is offset, meaning odd columns are shifted up by half a hex height.
 * This creates a natural honeycomb pattern but requires special handling for neighbors.
 * 
 * For a hex at position (q,r):
 * 
 * Odd columns (q % 2 === 1):
 *   NW: (q-1, r)      N: (q, r-1)     NE: (q+1, r)
 *   SW: (q-1, r+1)    S: (q, r+1)     SE: (q+1, r+1)
 * 
 * Even columns (q % 2 === 0):
 *   NW: (q-1, r-1)    N: (q, r-1)     NE: (q+1, r-1)
 *   SW: (q-1, r+1)    S: (q, r+1)     SE: (q+1, r+1)
 * 
 * Key points:
 * 1. The N and S neighbors are always (q, r-1) and (q, r+1) regardless of column
 * 2. Diagonal neighbors (NW, NE, SW, SE) need to be adjusted based on column parity
 * 3. For odd columns, diagonal neighbors are shifted up by 1 in the r coordinate
 * 4. The getHexPosition function handles this offset in the visual layout
 */

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

// Dijkstra's algorithm implementation
function dijkstra(startQ, startR, maxCost = Infinity) {
    console.log('Dijkstra starting:', { startQ, startR, maxCost });
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();
    const visited = new Set();
    const reachable = new Set();

    // Initialize distances
    hexGrid.forEach(hex => {
        const key = `${hex.userData.q},${hex.userData.r}`;
        distances.set(key, Infinity);
        unvisited.add(key);
    });

    // Set start distance to 0
    const startKey = `${startQ},${startR}`;
    distances.set(startKey, 0);
    reachable.add(startKey);

    while (unvisited.size > 0) {
        // Find unvisited hex with smallest distance
        let currentKey = null;
        let minDistance = Infinity;
        unvisited.forEach(key => {
            if (distances.get(key) < minDistance) {
                minDistance = distances.get(key);
                currentKey = key;
            }
        });

        // If we've exceeded maxCost, we can stop
        if (minDistance > maxCost) break;

        // Remove current hex from unvisited
        unvisited.delete(currentKey);
        visited.add(currentKey);

        // Get current hex coordinates
        const [currentQ, currentR] = currentKey.split(',').map(Number);
        const currentHex = hexGrid.find(h => h.userData.q === currentQ && h.userData.r === currentR);
        if (!currentHex) continue;

        // Calculate neighbors using even/odd column logic
        const isOddColumn = currentQ % 2 === 1;
        const neighbors = [
            // NW
            { q: currentQ - 1, r: currentR - (isOddColumn ? 0 : 1) },
            // N
            { q: currentQ, r: currentR - 1 },
            // NE
            { q: currentQ + 1, r: currentR - (isOddColumn ? 0 : 1) },
            // SE
            { q: currentQ + 1, r: currentR + 1 - (isOddColumn ? 0 : 1) },
            // S
            { q: currentQ, r: currentR + 1 },
            // SW
            { q: currentQ - 1, r: currentR + 1 - (isOddColumn ? 0 : 1) }
        ];

        // Process each neighbor
        neighbors.forEach(neighbor => {
            const neighborKey = `${neighbor.q},${neighbor.r}`;
            if (visited.has(neighborKey)) return;

            // Check if the hex is within map bounds
            if (neighbor.q < 0 || neighbor.q >= MAP_COLS ||
                neighbor.r < 0 || neighbor.r >= MAP_ROWS) {
                return;
            }

            const neighborHex = hexGrid.find(h => h.userData.q === neighbor.q && h.userData.r === neighbor.r);
            if (!neighborHex) return;

            // Check if hex is occupied using the same function as highlightMoveRange
            if (isHexOccupied(neighbor.q, neighbor.r)) {
                console.log('Neighbor', neighborKey, 'is occupied by a unit');
                return;
            }

            // Calculate cost to reach this neighbor based on terrain
            let cost = 1; // Default cost for grass and forest
            if (neighborHex.userData.type === 'water' || neighborHex.userData.type === 'mountain') {
                cost = Infinity; // Impassable terrain
            }

            if (cost === Infinity) {
                console.log('Neighbor', neighborKey, 'is impassable terrain');
                return;
            }

            const newDistance = distances.get(currentKey) + cost;
            console.log('Checking neighbor', neighborKey, ':', {
                currentDistance: distances.get(neighborKey),
                newDistance,
                cost,
                terrain: neighborHex.userData.type
            });

            // Update distance if we found a shorter path
            if (newDistance < distances.get(neighborKey)) {
                distances.set(neighborKey, newDistance);
                previous.set(neighborKey, currentKey);
                // Only add to reachable if within move range
                if (newDistance <= maxCost) {
                    reachable.add(neighborKey);
                    console.log('Added to reachable:', neighborKey, 'with distance', newDistance);
                }
            }
        });
    }

    console.log('Dijkstra finished. Found', reachable.size, 'reachable tiles');
    console.log('Previous tiles:', Object.fromEntries(previous));
    return { distances, previous, reachable };
}

function getPath(q1, r1, q2, r2, move) {
    console.log('Getting path from', q1, r1, 'to', q2, r2, 'with move', move);
    const { previous, reachable } = dijkstra(q1, r1, move);
    const path = [];
    let currentKey = `${q2},${r2}`;

    console.log('Reachable tiles:', Array.from(reachable));
    console.log('Previous tiles:', Object.fromEntries(previous));

    // Check if target is reachable
    if (!reachable.has(currentKey)) {
        console.log('Target is not reachable');
        return [];
    }

    console.log('Starting path reconstruction from', currentKey);
    // Reconstruct path by backtracking from target to start
    while (previous.has(currentKey)) {
        const [q, r] = currentKey.split(',').map(Number);
        const hex = hexGrid.find(h => h.userData.q === q && h.userData.r === r);
        if (hex) {
            path.unshift(hex);
            console.log('Added to path:', q, r);
        } else {
            console.log('Could not find hex for:', q, r);
        }
        currentKey = previous.get(currentKey);
        console.log('Moving to previous tile:', currentKey);
    }

    // Add start hex
    const startHex = hexGrid.find(h => h.userData.q === q1 && h.userData.r === r1);
    if (startHex) {
        path.unshift(startHex);
        console.log('Added start hex:', q1, r1);
    } else {
        console.log('Could not find start hex:', q1, r1);
    }

    console.log('Final path:', path.map(h => `${h.userData.q},${h.userData.r}`));
    return path.slice(1); // Exclude starting hex
}

function highlightMoveRange(unit) {
    // Clear previous highlights
    clearHighlights();

    // Get the unit's position
    const q = unit.userData.q;
    const r = unit.userData.r;

    // Get all reachable tiles using Dijkstra
    const { reachable } = dijkstra(q, r, unit.userData.move);

    // Highlight each reachable tile
    reachable.forEach(key => {
        const [checkQ, checkR] = key.split(',').map(Number);
        const hex = findHex(checkQ, checkR);
        if (hex && !isHexOccupied(checkQ, checkR, unit)) {
            highlightHex(hex);
        }
    });
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

function createHexShape(radius = HEX_RADIUS) {
    const shape = new THREE.Shape();
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
    return shape;
}

function createHexGeometry(radius = HEX_RADIUS, height = 1) {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 6);
    geometry.rotateY(Math.PI / 2);
    return geometry;
}

function clearPathLine() {
    if (pathLine) {
        group.remove(pathLine);
        pathLine = null;
    }
}

function clearHighlights() {
    const highlights = group.getObjectByName("highlights");
    if (highlights) {
        group.remove(highlights);
    }
}

function isValidMove(unit, targetHex) {
    if (!targetHex || targetHex.userData.moveCost === Infinity) return false;

    const dist = getDistance(unit.userData.q, unit.userData.r, targetHex.userData.q, targetHex.userData.r);
    if (dist <= 0 || dist > unit.userData.move) return false;

    return !allUnits.some(u => u.userData.q === targetHex.userData.q && u.userData.r === targetHex.userData.r && u !== unit);
}

function handleUnitSelection(unit) {
    selectedUnit = unit;
    clearPathLine();
    highlightMoveRange(unit);
}

function handleUnitMovement(unit, targetHex) {
    const path = getPath(unit.userData.q, unit.userData.r, targetHex.userData.q, targetHex.userData.r, unit.userData.move);
    if (path.length > 0) {
        unit.userData.move -= getDistance(unit.userData.q, unit.userData.r, targetHex.userData.q, targetHex.userData.r);
        moveUnit(unit, path);
        clearPathLine();
        selectedUnit = null;
        clearHighlights();
        return true;
    }
    return false;
}

function highlightHex(hex) {
    const highlights = group.getObjectByName("highlights") || new THREE.Group();
    highlights.name = "highlights";

    const shape = createHexShape();
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });

    const highlight = new THREE.Mesh(geometry, material);
    const pos = getWorldPosition(hex.userData.q, hex.userData.r, hex.userData.height + 0.01);
    highlight.position.copy(pos);
    highlight.rotation.x = -Math.PI / 2;
    highlights.add(highlight);

    group.add(highlights);
}

function getHexesInRange(q, r, range) {
    const hexes = [];
    const visited = new Set();
    const queue = [{ q, r, distance: 0 }];
    visited.add(`${q},${r}`);

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.distance >= range) continue;

        const isOddColumn = current.q % 2 === 1;

        // Get all six neighbors using the correct even/odd column offsets
        const neighbors = [
            // NW
            { q: current.q - 1, r: current.r - (isOddColumn ? 0 : 1) },
            // N
            { q: current.q, r: current.r - 1 },
            // NE
            { q: current.q + 1, r: current.r - (isOddColumn ? 0 : 1) },
            // SE
            { q: current.q + 1, r: current.r + 1 - (isOddColumn ? 0 : 1) },
            // S
            { q: current.q, r: current.r + 1 },
            // SW
            { q: current.q - 1, r: current.r + 1 - (isOddColumn ? 0 : 1) }
        ];

        // Process each neighbor
        neighbors.forEach(neighbor => {
            const key = `${neighbor.q},${neighbor.r}`;
            if (visited.has(key)) return;

            // Check if the hex is within map bounds
            if (neighbor.q < 0 || neighbor.q >= MAP_COLS ||
                neighbor.r < 0 || neighbor.r >= MAP_ROWS) {
                return;
            }

            const hex = findHex(neighbor.q, neighbor.r);
            if (hex && hex.userData.moveCost !== Infinity) {
                hexes.push(hex);
                visited.add(key);
                queue.push({
                    q: neighbor.q,
                    r: neighbor.r,
                    distance: current.distance + 1
                });
            }
        });
    }

    return hexes;
}

console.log('utils.js loaded');