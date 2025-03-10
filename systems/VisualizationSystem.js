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

        const shape = GridSystem.createHexShape();
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
            color: HIGHLIGHT_COLORS.MOVE_RANGE,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const highlight = new THREE.Mesh(geometry, material);
        const coord = new HexCoord(hex.userData.q, hex.userData.r);
        const pos = coord.getWorldPosition(hex.userData.height + VISUAL_OFFSETS.HIGHLIGHT_OFFSET);
        highlight.position.copy(pos);
        highlight.rotation.x = -Math.PI / 2;
        highlights.add(highlight);

        group.add(highlights);
    }

    static drawPath(unit, path) {
        this.clearPathLine();
        const points = [];

        const unitCoord = new HexCoord(unit.userData.q, unit.userData.r);
        points.push(unitCoord.getWorldPosition(VISUAL_OFFSETS.PATH_HEIGHT));

        path.forEach(hex => {
            const coord = new HexCoord(hex.userData.q, hex.userData.r);
            points.push(coord.getWorldPosition(VISUAL_OFFSETS.PATH_HEIGHT));
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

    static createHexGeometry(radius = 1) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const uvs = [];

        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            vertices.push(
                radius * Math.cos(angle),
                0,
                radius * Math.sin(angle)
            );
            uvs.push(
                (Math.cos(angle) + 1) / 2,
                (Math.sin(angle) + 1) / 2
            );
        }

        // Add center vertex
        vertices.push(0, 0, 0);
        uvs.push(0.5, 0.5);

        // Create triangles
        for (let i = 0; i < 6; i++) {
            indices.push(6, i, (i + 1) % 6);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }

    static createHexMaterial(color = 0x00ff00) {
        return new THREE.MeshStandardMaterial({
            color: color,
            side: THREE.DoubleSide
        });
    }

    static createHexMesh(geometry, material) {
        return new THREE.Mesh(geometry, material);
    }

    static createHexHighlight(color = 0xffff00) {
        const geometry = this.createHexGeometry(1.1); // Slightly larger than regular hex
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        return this.createHexMesh(geometry, material);
    }

    static createHexOutline(color = 0x000000) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];

        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            vertices.push(
                Math.cos(angle),
                0,
                Math.sin(angle)
            );
        }

        // Create outline indices
        for (let i = 0; i < 6; i++) {
            indices.push(i, (i + 1) % 6);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);

        const material = new THREE.LineBasicMaterial({ color: color });
        return new THREE.LineSegments(geometry, material);
    }
}

console.log('VisualizationSystem.js loaded'); 