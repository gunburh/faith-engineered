/**
 * seasonal-peaks.js — Faith Engineered · Chapter 03 · The Offering Economy
 *
 * Renders the "Seasonal Peaks" visualization. Two modes:
 *   • Mobile (< 768px): the original 12-column flat bar chart (CSS-driven).
 *   • Desktop (>= 768px): a Three.js scene — rolling terrain mesh with 12
 *     hairline light beams (gold / oxblood / gray), helix particle streams
 *     wrapping the 5 peak-month beams (JAN/APR/JUN/OCT/DEC), three layers
 *     of drifting particles + a white stardust layer, exponential fog,
 *     mouse parallax, and a one-shot scroll-in entrance via GSAP.
 *
 * Three.js is loaded globally as window.THREE (vendor/three.min.js).
 * GSAP is loaded globally as window.gsap (vendor/gsap.min.js).
 */

const REDUCED_MOTION =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BREAKPOINT = 768;

const SEASONS = [
    { month: 'JAN', height: 8, kind: 'gold',    peak: 'Chinese New Year', elev: 0.7 },
    { month: 'FEB', height: 4, kind: 'gray',    peak: null,               elev: 0.4 },
    { month: 'MAR', height: 3, kind: 'gray',    peak: null,               elev: 0.3 },
    { month: 'APR', height: 9, kind: 'gold',    peak: 'Songkran',         elev: 0.8 },
    { month: 'MAY', height: 3, kind: 'gray',    peak: null,               elev: 0.3 },
    { month: 'JUN', height: 6, kind: 'gold',    peak: 'Buddhist Lent',    elev: 0.5 },
    { month: 'JUL', height: 3, kind: 'gray',    peak: null,               elev: 0.3 },
    { month: 'AUG', height: 3, kind: 'gray',    peak: null,               elev: 0.3 },
    { month: 'SEP', height: 4, kind: 'gray',    peak: null,               elev: 0.4 },
    { month: 'OCT', height: 7, kind: 'oxblood', peak: 'Veg Festival',     elev: 0.6 },
    { month: 'NOV', height: 3, kind: 'gray',    peak: null,               elev: 0.3 },
    { month: 'DEC', height: 9, kind: 'gold',    peak: 'New Year',         elev: 0.8 },
];

const COLOR = {
    gold:           0xC9A961,
    oxblood:        0x6B1F2E,
    oxblood_helix:  0xB8334A, // brighter — additive needs more red to read as red
    gray:           0x4a4a4a,
    bg:             0x000000,
    cream:          0xF5F1EA,
};

// ─────────────────────────────────────────────────────────
// Flat (mobile) fallback
// ─────────────────────────────────────────────────────────

function renderFlat(container) {
    container.dataset.seasonalMode = 'flat';
    container.innerHTML = SEASONS.map((s) => `
        <div class="ch03-seasonal-col">
            <span class="ch03-seasonal-col__peak">${s.peak || ''}</span>
            <div class="ch03-seasonal-col__bar ch03-seasonal-col__bar--${s.kind}"
                 style="--h: 0%;"
                 role="img"
                 aria-label="${s.month}: relative demand ${s.height} of 10${s.peak ? ', peak: ' + s.peak : ''}"></div>
            <span class="ch03-seasonal-col__label">${s.month}</span>
        </div>
    `).join('');

    const bars = container.querySelectorAll('.ch03-seasonal-col__bar');
    const setHeights = () => {
        bars.forEach((bar, i) => {
            bar.style.setProperty('--h', `${SEASONS[i].height * 10}%`);
        });
    };

    if (REDUCED_MOTION) {
        setHeights();
        return () => {};
    }

    let triggered = false;
    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting || triggered) continue;
                triggered = true;
                setHeights();
                io.disconnect();
            }
        },
        { threshold: 0.25 }
    );
    io.observe(container);

    return () => {
        io.disconnect();
        container.innerHTML = '';
        delete container.dataset.seasonalMode;
    };
}

// ─────────────────────────────────────────────────────────
// Three.js (desktop) renderer
// ─────────────────────────────────────────────────────────

// Soft radial-gradient texture used by the ambient particle layers AND the
// helix streams. Particles render as soft glowing dots instead of squares.
function makeGlowTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0,   'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function renderThree(container) {
    const THREE = window.THREE;
    if (!THREE) {
        return renderFlat(container);
    }

    container.dataset.seasonalMode = 'three';
    container.innerHTML = '';

    // ── DOM scaffolding ──────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.className = 'ch03-seasonal__canvas';
    container.appendChild(canvas);

    const labelsRoot = document.createElement('div');
    labelsRoot.className = 'ch03-seasonal__labels';
    container.appendChild(labelsRoot);

    // ── Scene ────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0A0A, 0.08);

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );
    const CAM_BASE  = { x: 0, y: 1.8, z: 7.5 };
    const CAM_START = { x: 0, y: 2.6, z: 9.5 };
    const CAM_LOOK  = new THREE.Vector3(0, 2.6, 0);
    camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z);
    camera.lookAt(CAM_LOOK);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight, false);

    // ── Lights ───────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const keyLight = new THREE.DirectionalLight(COLOR.gold, 0.6);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    // ── Terrain ──────────────────────────────────────────
    const TERRAIN_W = 14;
    const TERRAIN_D = 5;
    const SEG_X = 80;
    const SEG_Z = 28;

    const terrainGeo = new THREE.PlaneGeometry(TERRAIN_W, TERRAIN_D, SEG_X, SEG_Z);
    terrainGeo.rotateX(-Math.PI / 2);

    // Beam X centers: -5.5, -4.5, …, +5.5
    const beamX = SEASONS.map((_, i) => -5.5 + i * 1.0);

    const positions = terrainGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Mood waves
        let y = Math.sin(x * 0.6) * 0.15 + Math.cos(z * 0.5) * 0.12;

        // Data bias: gaussian falloff under each beam (centered on z=0)
        for (let m = 0; m < SEASONS.length; m++) {
            const dx = x - beamX[m];
            const dz = z;
            const distSq = dx * dx + dz * dz;
            const falloff = Math.exp(-distSq / 0.5);
            y += SEASONS[m].elev * 0.6 * falloff;
        }

        positions.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: false,
        fog: true,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrain);

    // Wireframe overlay
    const wireGeo = terrainGeo.clone();
    const wireMat = new THREE.MeshBasicMaterial({
        color: COLOR.gold,
        wireframe: true,
        transparent: true,
        opacity: 0.04,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        depthWrite: false,
        fog: true,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    wireMesh.position.y = 0.001;
    scene.add(wireMesh);

    // Sample terrain Y at world (x, z=0). Mirrors the displacement loop above.
    const sampleTerrainY = (worldX) => {
        let y = Math.sin(worldX * 0.6) * 0.15 + Math.cos(0) * 0.12;
        for (let m = 0; m < SEASONS.length; m++) {
            const dx = worldX - beamX[m];
            const distSq = dx * dx;
            const falloff = Math.exp(-distSq / 0.5);
            y += SEASONS[m].elev * 0.6 * falloff;
        }
        return y;
    };

    // Tiny offset so beam bases sit clearly above the wireframe overlay
    // (which is at terrainY + 0.001) and never visually clip into it.
    const BEAM_BASE_LIFT = 0.02;

    // ── Beams ────────────────────────────────────────────
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);

    // Shared glow texture — built once, used by ambient particles + helices.
    const glowTexture = makeGlowTexture(THREE);

    const beams = []; // { mesh, kind, height, baseOpacity, terrainY, beamBaseY, x, phase }
    const pointLights = [];

    SEASONS.forEach((s, i) => {
        const x = beamX[i];
        const terrainY = sampleTerrainY(x);
        const beamBaseY = terrainY + BEAM_BASE_LIFT;
        const height = s.height * 0.35;
        const colorHex = COLOR[s.kind];

        const baseOpacity = s.kind === 'gold' ? 0.95 : s.kind === 'oxblood' ? 0.95 : 0.5;

        // Hairline core beam
        const coreGeo = new THREE.CylinderGeometry(0.012, 0.012, height, 8, 1, true);
        coreGeo.translate(0, height / 2, 0);
        const coreMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: baseOpacity,
            blending: s.kind === 'gray' ? THREE.NormalBlending : THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: true,
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(x, beamBaseY, 0);
        beamGroup.add(core);

        beams.push({
            mesh: core,
            kind: s.kind,
            height,
            baseOpacity,
            terrainY,
            beamBaseY,
            x,
            phase: i * 0.7,
        });

        // Subtle terrain illumination on peak beams
        if (s.kind !== 'gray') {
            const pl = new THREE.PointLight(colorHex, 0.6, 3);
            pl.position.set(x, beamBaseY + height, 0);
            scene.add(pl);
            pointLights.push(pl);
        }
    });

    // ── Helix particle streams (peak months only) ────────
    const HELIX_COUNT_PER_BEAM = 800;
    const HELIX_RADIUS         = 0.18;
    const HELIX_TURNS          = 3;
    const HELIX_FLOW_SPEED     = 0.15;
    const HELIX_OPACITY        = 0.85;

    const helices = []; // { points, geometry, material, beamX, beamBaseY, beamHeight, count, dirSign }

    function createHelix({ beamX: bx, beamBaseY: by, beamHeight: bh, color, direction }) {
        const count = HELIX_COUNT_PER_BEAM;
        const geometry = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const offsets = new Float32Array(count);
        const speeds  = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            offsets[i] = Math.random();              // 0..1 — phase along helix
            speeds[i]  = 0.85 + Math.random() * 0.3; // 0.85..1.15 vertical-speed variance
            // Initial dummy positions — overwritten on first frame.
            pos[i * 3 + 0] = bx;
            pos[i * 3 + 1] = by;
            pos[i * 3 + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geometry.setAttribute('aOffset',  new THREE.BufferAttribute(offsets, 1));
        geometry.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds, 1));

        const material = new THREE.PointsMaterial({
            color,
            map: glowTexture,
            size: 0.045,
            transparent: true,
            opacity: HELIX_OPACITY,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            fog: true,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        helices.push({
            points,
            geometry,
            material,
            beamX: bx,
            beamBaseY: by,
            beamHeight: bh,
            count,
            dirSign: direction === 'CCW' ? 1 : -1,
        });
    }

    // Direction alternates per peak in calendar order:
    // JAN=CCW, APR=CW, JUN=CCW, OCT=CW, DEC=CCW
    let peakIdx = 0;
    SEASONS.forEach((s, i) => {
        if (!s.peak) return;
        const direction = peakIdx % 2 === 0 ? 'CCW' : 'CW';
        const helixColor = s.kind === 'oxblood' ? COLOR.oxblood_helix : COLOR.gold;
        const beam = beams[i];
        createHelix({
            beamX:      beam.x,
            beamBaseY:  beam.beamBaseY,
            beamHeight: beam.height,
            color:      helixColor,
            direction,
        });
        peakIdx++;
    });

    // CPU-update one helix's particle positions in place.
    const updateHelix = (helix, time) => {
        const { count, beamX: bx, beamBaseY: by, beamHeight: bh, dirSign } = helix;
        const pos     = helix.geometry.attributes.position.array;
        const offsets = helix.geometry.attributes.aOffset.array;
        const speeds  = helix.geometry.attributes.aSpeed.array;

        for (let i = 0; i < count; i++) {
            // t = vertical position 0→1, animated upward, wraps at 1.
            let t = (offsets[i] + time * HELIX_FLOW_SPEED * speeds[i]) % 1;
            if (t < 0) t += 1; // safety for negative time edge cases

            const y = by + t * bh;
            const angle = dirSign * (t * HELIX_TURNS * Math.PI * 2);

            // Pinch radius at top and bottom for an organic spindle shape.
            const radiusFalloff = Math.sin(t * Math.PI); // 0 at ends, 1 in middle
            const r = HELIX_RADIUS * (0.6 + 0.4 * radiusFalloff);

            pos[i * 3 + 0] = bx + Math.cos(angle) * r;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = Math.sin(angle) * r;
        }

        helix.geometry.attributes.position.needsUpdate = true;
    };

    // ── Particles — three parallax layers + cream stardust ─
    const particleLayers = [];

    function makeParticleLayer({ count, sizeAvg, baseOpacity, yRange, drift, color }) {
        const geometry = new THREE.BufferGeometry();
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            arr[i * 3 + 0] = (Math.random() - 0.5) * 16;                  // X: -8..8
            arr[i * 3 + 1] = yRange[0] + Math.random() * (yRange[1] - yRange[0]);
            arr[i * 3 + 2] = (Math.random() - 0.5) * 6;                   // Z: -3..3
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));

        const material = new THREE.PointsMaterial({
            color: color ?? COLOR.gold,
            map: glowTexture,
            size: sizeAvg,
            transparent: true,
            opacity: baseOpacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            fog: true,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);
        particleLayers.push({ points, geometry, count, yRange, drift });
    }

    makeParticleLayer({
        count: 300,
        sizeAvg: 0.11,
        baseOpacity: 0.55,
        yRange: [0.3, 2],
        drift: { y: 0.0008, x: 0.0004 },
    });
    makeParticleLayer({
        count: 400,
        sizeAvg: 0.07,
        baseOpacity: 0.4,
        yRange: [1, 4],
        drift: { y: 0.0005, x: 0.0002 },
    });
    makeParticleLayer({
        count: 300,
        sizeAvg: 0.045,
        baseOpacity: 0.25,
        yRange: [2, 6],
        drift: { y: 0.0002, x: 0.0001 },
    });
    // White stardust layer
    makeParticleLayer({
        count: 350,
        sizeAvg: 0.06,
        baseOpacity: 0.85,
        yRange: [0.5, 5],
        drift: { y: 0.0004, x: 0.0002 },
        color: COLOR.cream,
    });

    // ── Labels (HTML overlay) ────────────────────────────
    const labels = []; // { el, world: Vector3, kind, screenYOffset }

    SEASONS.forEach((s, i) => {
        const x = beamX[i];
        const beam = beams[i];
        const height = beam.height;
        const beamBaseY = beam.beamBaseY;

        const monthEl = document.createElement('div');
        monthEl.className = 'ch03-seasonal__label ch03-seasonal__label--month';
        monthEl.textContent = s.month;
        labelsRoot.appendChild(monthEl);
        labels.push({
            el: monthEl,
            world: new THREE.Vector3(x, beamBaseY + 0.05, 0),
            kind: 'month',
            screenYOffset: 20,
        });

        if (s.peak) {
            const peakEl = document.createElement('div');
            peakEl.className = 'ch03-seasonal__label ch03-seasonal__label--peak';
            peakEl.textContent = s.peak;
            labelsRoot.appendChild(peakEl);
            labels.push({
                el: peakEl,
                world: new THREE.Vector3(x, beamBaseY + height + 0.3, 0),
                kind: 'peak',
                screenYOffset: 0,
            });
        }
    });

    // ── State ────────────────────────────────────────────
    let rafId = null;
    let inViewport = false;
    let entered = false;
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let currentOffsetX = 0;
    let currentOffsetY = 0;
    const startTime = performance.now();
    const projVec = new THREE.Vector3();

    // ── Label projection ─────────────────────────────────
    const updateLabels = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            projVec.copy(label.world).project(camera);

            if (projVec.z > 1) {
                if (label.el.style.display !== 'none') label.el.style.display = 'none';
                continue;
            } else if (label.el.style.display === 'none') {
                label.el.style.display = '';
            }

            let sx = (projVec.x * 0.5 + 0.5) * w;
            let sy = (-projVec.y * 0.5 + 0.5) * h + label.screenYOffset;

            sx = Math.max(40, Math.min(w - 40, sx));
            sy = Math.max(20, Math.min(h - 20, sy));

            label.el.style.transform =
                `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
        }
    };

    // ── Render loop ──────────────────────────────────────
    const render = () => {
        const t = (performance.now() - startTime) / 1000;

        // Ambient particle drift — 4 layers at different speeds
        for (let li = 0; li < particleLayers.length; li++) {
            const layer = particleLayers[li];
            const arr = layer.geometry.attributes.position.array;
            const yMin = layer.yRange[0];
            const yMax = layer.yRange[1];
            const dy = layer.drift.y;
            const dx = layer.drift.x;
            for (let i = 0; i < layer.count; i++) {
                const ix = i * 3;
                arr[ix + 0] += dx;
                arr[ix + 1] += dy;
                if (arr[ix + 1] > yMax) arr[ix + 1] = yMin;
                if (arr[ix + 0] > 8) arr[ix + 0] = -8;
            }
            layer.geometry.attributes.position.needsUpdate = true;
        }

        // Helix streams — wrap upward around peak beams
        for (let hi = 0; hi < helices.length; hi++) {
            updateHelix(helices[hi], t);
        }

        if (!REDUCED_MOTION) {
            // Camera bob + parallax (only after entrance completes)
            currentOffsetX += (targetOffsetX - currentOffsetX) * 0.05;
            currentOffsetY += (targetOffsetY - currentOffsetY) * 0.05;
            const bob = Math.sin(t * 0.3) * 0.05;
            if (entered) {
                camera.position.x = CAM_BASE.x + currentOffsetX;
                camera.position.y = CAM_BASE.y + bob + currentOffsetY;
                camera.lookAt(CAM_LOOK);
            }

            // Beam pulse (core only, gold + oxblood)
            for (let i = 0; i < beams.length; i++) {
                const b = beams[i];
                if (b.kind === 'gray') continue;
                const pulse = Math.sin(t * 1.2 + b.phase) * 0.05;
                b.mesh.material.opacity = b.baseOpacity + pulse;
            }
        }

        renderer.render(scene, camera);
        updateLabels();
        rafId = requestAnimationFrame(render);
    };

    // ── Entrance animation ───────────────────────────────
    const setBeamFinalState = () => {
        beams.forEach((b) => { b.mesh.scale.y = 1; });
        helices.forEach((h) => { h.material.opacity = HELIX_OPACITY; });
    };

    const setBeamStartState = () => {
        beams.forEach((b) => { b.mesh.scale.y = 0; });
        helices.forEach((h) => { h.material.opacity = 0; });
    };

    const playEntrance = () => {
        if (entered) return;

        if (REDUCED_MOTION || !window.gsap) {
            setBeamFinalState();
            entered = true;
            return;
        }

        const gsap = window.gsap;

        // Beams stagger up
        beams.forEach((b, i) => {
            gsap.to(b.mesh.scale, {
                y: 1,
                duration: 1.5,
                delay: i * 0.08,
                ease: 'expo.out',
            });
        });

        // Helices fade in after beams complete (1.5s delay)
        helices.forEach((h) => {
            gsap.fromTo(h.material,
                { opacity: 0 },
                {
                    opacity: HELIX_OPACITY,
                    duration: 1.5,
                    delay: 1.5,
                    ease: 'power2.out',
                }
            );
        });

        // Camera entrance — flag entered=true only at end
        camera.position.set(CAM_START.x, CAM_START.y, CAM_START.z);
        gsap.to(camera.position, {
            x: CAM_BASE.x,
            y: CAM_BASE.y,
            z: CAM_BASE.z,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => camera.lookAt(CAM_LOOK),
            onComplete: () => { entered = true; },
        });
    };

    if (REDUCED_MOTION) {
        setBeamFinalState();
        entered = true;
    } else {
        setBeamStartState();
    }

    // ── Visibility / entrance observer ───────────────────
    const visibilityIO = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            inViewport = entry.isIntersecting;
            if (inViewport) {
                if (!entered) playEntrance();
                if (rafId == null) rafId = requestAnimationFrame(render);
            } else {
                if (rafId != null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }
        }
    }, { threshold: 0.1 });
    visibilityIO.observe(container);

    // ── Mouse parallax ───────────────────────────────────
    const onMouseMove = (e) => {
        if (REDUCED_MOTION) return;
        const rect = container.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        targetOffsetX = nx * 0.3;
        targetOffsetY = -ny * 0.3;
    };
    container.addEventListener('mousemove', onMouseMove);

    // ── Resize handling (in-mode only) ───────────────────
    const onInternalResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        updateLabels();
        if (REDUCED_MOTION && rafId == null) {
            renderer.render(scene, camera);
        }
    };

    // First static render before IO fires
    renderer.render(scene, camera);
    updateLabels();

    // ── Cleanup ──────────────────────────────────────────
    const cleanup = () => {
        if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        visibilityIO.disconnect();
        container.removeEventListener('mousemove', onMouseMove);

        if (window.gsap) {
            beams.forEach((b) => window.gsap.killTweensOf(b.mesh.scale));
            helices.forEach((h) => window.gsap.killTweensOf(h.material));
            window.gsap.killTweensOf(camera.position);
        }

        // Explicit helix disposal (also covered by scene.traverse below).
        helices.forEach((h) => {
            scene.remove(h.points);
            h.geometry.dispose();
            h.material.dispose();
        });
        helices.length = 0;

        // Dispose all geometries + materials in the scene tree.
        scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m) => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });

        // Shared glow texture (referenced by particle layers + helices).
        glowTexture.dispose();

        renderer.dispose();

        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (labelsRoot.parentNode) labelsRoot.parentNode.removeChild(labelsRoot);
        delete container.dataset.seasonalMode;
    };

    cleanup.onResize = onInternalResize;
    return cleanup;
}

// ─────────────────────────────────────────────────────────
// Public init
// ─────────────────────────────────────────────────────────

export function initSeasonalPeaks() {
    const container = document.querySelector('[data-seasonal-chart]');
    if (!container) return () => {};

    let activeCleanup = null;
    let lastIsMobile = window.innerWidth < BREAKPOINT;

    const mount = () => {
        if (activeCleanup) {
            activeCleanup();
            activeCleanup = null;
        }
        if (window.innerWidth < BREAKPOINT) {
            activeCleanup = renderFlat(container);
        } else {
            activeCleanup = renderThree(container);
        }
    };

    mount();

    let resizeTimer = null;
    const onResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const isMobile = window.innerWidth < BREAKPOINT;
            if (isMobile !== lastIsMobile) {
                lastIsMobile = isMobile;
                mount();
            } else if (activeCleanup && activeCleanup.onResize) {
                activeCleanup.onResize();
            }
        }, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        if (activeCleanup) activeCleanup();
        activeCleanup = null;
    };
}
