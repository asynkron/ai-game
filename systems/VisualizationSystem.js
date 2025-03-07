// VisualizationSystem.js

class VisualizationSystem {
    static clearPathLine() {
        if (pathLine) {
            group.remove(pathLine);
            pathLine = null;
        }
    }

    static clearHighlights() {
        const highlights = group.getObjectByName("highlights");
        if (highlights) {
            group.remove(highlights);
        }
    }

    static highlightHex(hex) {
        const highlights = group.getObjectByName("highlights") || new THREE.Group();
        highlights.name = "highlights";

        const shape = createHexShape();
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
            color: HIGHLIGHT_COLORS.MOVE_RANGE,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const highlight = new THREE.Mesh(geometry, material);
        const coord = new HexCoord(hex.userData.q, hex.userData.r);
        const pos = coord.getWorldPosition(hex.userData.height + TERRAIN_HEIGHT.HIGHLIGHT_OFFSET);
        highlight.position.copy(pos);
        highlight.rotation.x = -Math.PI / 2;
        highlights.add(highlight);

        group.add(highlights);
    }

    static drawPath(unit, path) {
        this.clearPathLine();
        const points = [];

        const unitCoord = new HexCoord(unit.userData.q, unit.userData.r);
        points.push(unitCoord.getWorldPosition(TERRAIN_HEIGHT.PATH_HEIGHT));

        path.forEach(hex => {
            const coord = new HexCoord(hex.userData.q, hex.userData.r);
            points.push(coord.getWorldPosition(TERRAIN_HEIGHT.PATH_HEIGHT));
        });

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: VISUAL_COLORS.PATH,
            linewidth: 10
        });
        pathLine = new THREE.Line(geometry, material);
        pathLine.computeLineDistances();
        group.add(pathLine);
    }
}

console.log('VisualizationSystem.js loaded'); 