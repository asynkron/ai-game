const unitTypes = {
    "OrcBarbarian": { symbol: "O", name: "Orc Barbarian", maxHp: 20, hp: 20, move: 2, attack: 5, range: 1 },
    "ElfArcher": { symbol: "E", name: "Elf Archer", maxHp: 15, hp: 15, move: 3, attack: 4, range: 2 },
    "Troll": { symbol: "T", name: "Troll", maxHp: 30, hp: 30, move: 1, attack: 6, range: 1 },
    "Catapult": { symbol: "C", name: "Catapult", maxHp: 10, hp: 10, move: 1, attack: 8, range: 3 }
};

const allUnits = [];

function initUnits() {
    players[0].units.push(createUnit("ElfArcher", 2, 2, 0));
    players[0].units.push(createUnit("Catapult", 3, 3, 0));
    players[1].units.push(createUnit("OrcBarbarian", 5, 5, 1));
    players[1].units.push(createUnit("Troll", 6, 6, 1));
    console.log("miniMapScene children after units:", miniMapScene.children.length);
}

function createUnit(type, q, r, playerIndex) {
    const unitGroup = new THREE.Group();

    // Create shadow circle with radial gradient
    const shadowGeometry = new THREE.CircleGeometry(0.6, 32); // Smaller radius (0.6 instead of 0.8)
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
                // Make center darker by using a power function
                alpha = pow(alpha, 0.5);
                gl_FragColor = vec4(color, alpha * 0.5);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2; // Make it flat on the ground
    shadow.position.y = 0.01; // Slightly above the tile to prevent z-fighting
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
    ctx.fillText(unitTypes[type].symbol, 64, 48);
    ctx.fillStyle = '#ff0000';
    const healthRatio = unitTypes[type].hp / unitTypes[type].maxHp;
    ctx.fillRect(0, 80, 128 * healthRatio, 32);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(unitTypes[type].name, 64, 144);
    const unitSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
    unitSprite.scale.set(1, 1.5, 1);
    unitSprite.position.y = 0.9; // Above tallest tile (0.5) + sprite offset
    unitGroup.add(unitSprite);

    unitGroup.userData = { type, q, r, hp: unitTypes[type].hp, maxHp: unitTypes[type].maxHp, move: unitTypes[type].move, attack: unitTypes[type].attack, range: unitTypes[type].range, playerIndex };
    group.add(unitGroup);
    players[playerIndex].units.push(unitGroup);
    allUnits.push(unitGroup);

    const miniUnit = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: players[playerIndex].color })
    );
    miniUnit.scale.set(0.5, 0.5, 0.5);
    miniUnit.position.y = 0.5;
    miniMapScene.add(miniUnit);
    unitGroup.userData.miniUnit = miniUnit;

    // Set initial position using the new function
    const hex = findHex(q, r);
    if (hex) {
        const coord = new HexCoord(q, r);
        UnitSystem.setPosition(unitGroup, coord, hex);
    }

    return unitGroup;
}