// UnitSystem.js

class UnitSystem {
    static unitTypes = {
        "OrcBarbarian": { symbol: "O", name: "Orc Barbarian", maxHp: 20, hp: 20, move: 2, attack: 5, range: 1 },
        "ElfArcher": { symbol: "E", name: "Elf Archer", maxHp: 15, hp: 15, move: 3, attack: 4, range: 2 },
        "Troll": { symbol: "T", name: "Troll", maxHp: 30, hp: 30, move: 1, attack: 6, range: 1 },
        "Catapult": { symbol: "C", name: "Catapult", maxHp: 10, hp: 10, move: 1, attack: 8, range: 3 }
    };

    static createUnit(type, q, r, playerIndex) {
        const unitGroup = new THREE.Group();

        // Create shadow circle with radial gradient
        const shadowGeometry = new THREE.CircleGeometry(0.6, 32);
        const shadowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x000000) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying vec2 vUv;
                void main() {
                    float dist = length(vUv - vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    alpha = pow(alpha, 0.5);
                    gl_FragColor = vec4(color, alpha * 0.5);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2 + MAP_TILT_ANGLE;
        shadow.position.y = 0.01;
        unitGroup.add(shadow);

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = `#${players[playerIndex].color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, 128, 64);
        ctx.font = '40px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(this.unitTypes[type].symbol, 64, 48);
        ctx.fillStyle = '#ff0000';
        const healthRatio = this.unitTypes[type].hp / this.unitTypes[type].maxHp;
        ctx.fillRect(0, 80, 128 * healthRatio, 32);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(this.unitTypes[type].name, 64, 144);
        const unitSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        unitSprite.scale.set(1, 1.5, 1);
        unitSprite.position.y = 0.9;
        unitSprite.rotation.x = -MAP_TILT_ANGLE;
        unitGroup.add(unitSprite);

        unitGroup.userData = {
            type,
            q,
            r,
            hp: this.unitTypes[type].hp,
            maxHp: this.unitTypes[type].maxHp,
            move: this.unitTypes[type].move,
            attack: this.unitTypes[type].attack,
            range: this.unitTypes[type].range,
            playerIndex
        };

        const miniUnit = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: players[playerIndex].color })
        );
        miniUnit.scale.set(0.5, 0.5, 0.5);
        miniUnit.position.y = 0.5;
        miniMapScene.add(miniUnit);
        unitGroup.userData.miniUnit = miniUnit;

        const hex = HexCoord.findHex(q, r);
        if (hex) {
            const coord = new HexCoord(q, r);
            this.setPosition(unitGroup, coord, hex);
        }

        // Add the unit to the main scene
        scene.add(unitGroup);
        allUnits.push(unitGroup);

        return unitGroup;
    }

    static setPosition(unit, coord, hex) {
        const worldPos = coord.getWorldPosition();
        const height = TerrainSystem.getHeight(hex);

        // Transform position in world space
        const localToWorldMatrix = new THREE.Matrix4().makeRotationX(MAP_TILT_ANGLE);
        const position = new THREE.Vector3(worldPos.x, height + TERRAIN_HEIGHT.UNIT_OFFSET, worldPos.z);
        position.applyMatrix4(localToWorldMatrix);

        unit.position.copy(position);
        unit.userData.q = coord.q;
        unit.userData.r = coord.r;
        unit.userData.miniUnit.position.set(worldPos.x, 0.5, worldPos.z);
    }

    static getUnitStats(type) {
        return this.unitTypes[type];
    }

    static isHexOccupied(q, r, excludeUnit = null) {
        return allUnits.some(u => u.userData.q === q && u.userData.r === r && u !== excludeUnit);
    }

    static move(unit, path) {
        let delay = 0;
        path.forEach((hex) => {
            setTimeout(() => {
                const coord = new HexCoord(hex.userData.q, hex.userData.r);
                this.setPosition(unit, coord, hex);
            }, delay);
            delay += 200;
        });
    }

    static handleSelection(unit) {
        selectedUnit = unit;
        VisualizationSystem.clearPathLine();
        this.highlightMoveRange(unit);
    }

    static handleMovement(unit, targetHex) {
        const unitCoord = new HexCoord(unit.userData.q, unit.userData.r);
        const targetCoord = new HexCoord(targetHex.userData.q, targetHex.userData.r);
        const path = PathfindingSystem.getPath(unitCoord.q, unitCoord.r, targetCoord.q, targetCoord.r, unit.userData.move);

        if (path.length > 0) {
            unit.userData.move -= unitCoord.distanceTo(targetCoord);
            this.move(unit, path);
            VisualizationSystem.clearPathLine();
            selectedUnit = null;
            VisualizationSystem.clearHighlights();
            return true;
        }
        return false;
    }

    static highlightMoveRange(unit) {
        VisualizationSystem.clearHighlights();
        const unitCoord = new HexCoord(unit.userData.q, unit.userData.r);
        const { reachable } = PathfindingSystem.dijkstra(unitCoord.q, unitCoord.r, unit.userData.move);

        reachable.forEach(key => {
            const coord = HexCoord.fromKey(key);
            const hex = coord.getHex();
            if (hex && !coord.isOccupied(unit)) {
                VisualizationSystem.highlightHex(hex);
            }
        });
    }

    static isValidMove(unit, targetHex) {
        if (!targetHex || targetHex.userData.moveCost === Infinity) return false;

        const unitCoord = new HexCoord(unit.userData.q, unit.userData.r);
        const targetCoord = new HexCoord(targetHex.userData.q, targetHex.userData.r);
        const { reachable } = PathfindingSystem.dijkstra(unitCoord.q, unitCoord.r, unit.userData.move);

        return reachable.has(targetCoord.getKey());
    }
}

console.log('UnitSystem.js loaded'); 