// GridSystem.js - Manages the hex grid and provides grid-related utilities

class GridSystem {
    static hexGrid = [];

    static addHex(hex) {
        this.hexGrid.push(hex);
    }

    static getHexIntersects(raycaster) {
        const intersectObjects = [];
        GridSystem.hexGrid.forEach(hexGroup => {
            hexGroup.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    intersectObjects.push(child);
                }
            });
        });
        return raycaster.intersectObjects(intersectObjects);
    }

    static createHexShape(radius = HEX_RADIUS) {
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

    static createHexGeometry(radius = HEX_RADIUS, height = 1) {
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 6);
        geometry.rotateY(Math.PI / 2);
        return geometry;
    }

    static getAll() {
        return this.hexGrid;
    }

    static clear() {
        this.hexGrid.length = 0;
    }

    static findHex(q, r) {
        return this.hexGrid.find(h => h.userData.q === q && h.userData.r === r);
    }

    static createHexPrism(color, x, z, height, moveCost) {
        const geometry = this.createHexGeometry(HEX_RADIUS, height);
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
            moveCost: moveCost
        };

        return hexGroup;
    }

    static createMiniHex(color, x, z) {
        const geometry = new THREE.BoxGeometry(1, 0.01, 1);
        const material = new THREE.MeshBasicMaterial({ color });
        const miniHex = new THREE.Mesh(geometry, material);
        miniHex.position.set(x, 0, z);
        return miniHex;
    }

    static createMap(gameState) {
        const mapCenterX = (MAP_COLS * HEX_RADIUS * 1.5) / 2;
        const mapCenterZ = (MAP_ROWS * HEX_RADIUS * Math.sqrt(3)) / 2;

        for (let q = 0; q < MAP_COLS; q++) {
            for (let r = 0; r < MAP_ROWS; r++) {
                // Calculate x and z positions correctly for odd/even columns
                const x = HEX_RADIUS * 1.5 * q;
                const z = HEX_RADIUS * Math.sqrt(3) * (r + (q % 2) / 2);

                const tile = gameState.map.getTile(q, r);
                if (tile) {
                    const type = tile.type;
                    const color = tile.color;
                    const height = tile.height;
                    const moveCost = tile.moveCost;

                    const hex = this.createHexPrism(color, x, z, height, moveCost);
                    hex.userData.q = q;  // Store the actual grid coordinates
                    hex.userData.r = r;
                    hex.userData.type = type.toLowerCase();
                    group.add(hex);
                    this.addHex(hex);

                    const miniHex = this.createMiniHex(color, x, z);
                    miniMapScene.add(miniHex);

                    const edges = new THREE.EdgesGeometry(hex.geometry);
                    const border = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 }));
                    border.position.set(x, height + 0.005, z);
                    border.rotation.x = Math.PI / 2;
                    group.add(border);
                }
            }
        }
        group.rotation.x = MAP_TILT_ANGLE;

        console.log("miniMapScene children after hexes:", miniMapScene.children.length);
        return { mapCenterX, mapCenterZ };
    }
}

// Export hexGrid for backward compatibility
window.hexGrid = GridSystem.hexGrid;

console.log('GridSystem.js loaded'); 