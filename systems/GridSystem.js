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
}

// Export hexGrid for backward compatibility
window.hexGrid = GridSystem.hexGrid;

console.log('GridSystem.js loaded'); 