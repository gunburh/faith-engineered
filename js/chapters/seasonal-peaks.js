/**
 * seasonal-peaks.js — Faith Engineered · Chapter 03 · The Offering Economy
 *
 * Renders the "Seasonal Peaks" visualization. Two modes:
 *   • Mobile (< 768px): the original 12-column flat bar chart (CSS-driven).
 *   • Desktop (>= 768px): a Three.js scene — rolling terrain mesh with 12
 *     hairline light beams (gold / oxblood / gray), volumetric sprite-glow
 *     halos, three layers of drifting particles, exponential fog, mouse
 *     parallax, and a one-shot scroll-in entrance via GSAP.
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
    gold:    0xC9A961,
    oxblood: 0x6B1F2E,
    gray:    0x4a4a4a,
    bg:      0x000000,
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
        // No Three.js available — fall back gracefully.
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

    // Sample terrain Y at world (x, 0)
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

    // ── Beams ────────────────────────────────────────────
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);

    // Shared glow texture — built once, disposed once.
    const glowTexture = makeGlowTexture(THREE);

    const beams = [];          // { mesh, kind, height, baseOpacity, terrainY, x, phase }
    const beamGlowSprites = []; // [{ inner, outer, baseY, beamIdx }, …] — one entry per stacked sprite pair
    const pointLights = [];

    const HALO_COUNT = 6;

    SEASONS.forEach((s, i) => {
        const x = beamX[i];
        const terrainY = sampleTerrainY(x);
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
        core.position.set(x, terrainY, 0);
        beamGroup.add(core);

        const beam = {
            mesh: core,
            kind: s.kind,
            height,
            baseOpacity,
            terrainY,
            x,
            phase: i * 0.7,
        };
        beams.push(beam);

        // Sprite halos (gold + oxblood only)
        if (s.kind !== 'gray') {
            for (let h = 0; h < HALO_COUNT; h++) {
                const t = h / (HALO_COUNT - 1); // 0 → 1 from base to tip
                const yOffset = terrainY + t * height;

                const innerMat = new THREE.SpriteMaterial({
                    map: glowTexture,
                    color: colorHex,
                    transparent: true,
                    opacity: 0.35,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    fog: true,
                });
                const innerHalo = new THREE.Sprite(innerMat);
                innerHalo.position.set(x, yOffset, 0);
                innerHalo.scale.set(0.4, 0.4, 1);
                scene.add(innerHalo);

                const outerMat = new THREE.SpriteMaterial({
                    map: glowTexture,
                    color: colorHex,
                    transparent: true,
                    opacity: 0.12,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    fog: true,
                });
                const outerHalo = new THREE.Sprite(outerMat);
                outerHalo.position.set(x, yOffset, 0);
                outerHalo.scale.set(1.2, 1.2, 1);
                scene.add(outerHalo);

                beamGlowSprites.push({
                    inner: innerHalo,
                    outer: outerHalo,
                    baseY: yOffset,
                    beamIdx: i,
                });
            }

            // Point light at beam tip — illuminates terrain subtly
            const pl = new THREE.PointLight(colorHex, 0.6, 3);
            pl.position.set(x, terrainY + height, 0);
            scene.add(pl);
            pointLights.push(pl);
        }
    });

    // ── Particles — three parallax layers ────────────────
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
    // White stardust layer — bright, twinkling, mid-depth
    makeParticleLayer({
        count: 350,
        sizeAvg: 0.06,
        baseOpacity: 0.85,
        yRange: [0.5, 5],
        drift: { y: 0.0004, x: 0.0002 },
        color: 0xF5F1EA,
    });

    // ── Labels (HTML overlay) ────────────────────────────
    const labels = []; // { el, world: Vector3, kind: 'month' | 'peak', screenYOffset }

    SEASONS.forEach((s, i) => {
        const x = beamX[i];
        const terrainY = sampleTerrainY(x);
        const height = s.height * 0.35;

        const monthEl = document.createElement('div');
        monthEl.className = 'ch03-seasonal__label ch03-seasonal__label--month';
        monthEl.textContent = s.month;
        labelsRoot.appendChild(monthEl);
        labels.push({
            el: monthEl,
            world: new THREE.Vector3(x, terrainY + 0.05, 0),
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
                world: new THREE.Vector3(x, terrainY + height + 0.3, 0),
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

            // Hide labels that fall behind the camera (z>1 in NDC after project)
            if (projVec.z > 1) {
                if (label.el.style.display !== 'none') label.el.style.display = 'none';
                continue;
            } else if (label.el.style.display === 'none') {
                label.el.style.display = '';
            }

            let sx = (projVec.x * 0.5 + 0.5) * w;
            let sy = (-projVec.y * 0.5 + 0.5) * h + label.screenYOffset;

            // Clamp inside canvas so peak labels never bleed outside
            sx = Math.max(40, Math.min(w - 40, sx));
            sy = Math.max(20, Math.min(h - 20, sy));

            label.el.style.transform =
                `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
        }
    };

    // ── Render loop ──────────────────────────────────────
    const render = () => {
        const t = (performance.now() - startTime) / 1000;

        // Particles drift — 3 layers at different speeds
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

            // Sprite halo subtle drift — inner only
            for (let i = 0; i < beamGlowSprites.length; i++) {
                const g = beamGlowSprites[i];
                g.inner.position.y = g.baseY + Math.sin(t * 0.4 + i * 0.7) * 0.04;
            }
        }

        renderer.render(scene, camera);
        updateLabels();
        rafId = requestAnimationFrame(render);
    };

    // ── Entrance animation ───────────────────────────────
    const setBeamFinalState = () => {
        beams.forEach((b) => { b.mesh.scale.y = 1; });
        beamGlowSprites.forEach((g) => {
            g.inner.material.opacity = 0.35;
            g.outer.material.opacity = 0.12;
        });
    };

    const setBeamStartState = () => {
        beams.forEach((b) => { b.mesh.scale.y = 0; });
        beamGlowSprites.forEach((g) => {
            g.inner.material.opacity = 0;
            g.outer.material.opacity = 0;
        });
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

        // Sprite halos fade in alongside their beam (same stagger)
        beamGlowSprites.forEach((g) => {
            const delay = g.beamIdx * 0.08;
            gsap.to(g.inner.material, {
                opacity: 0.35,
                duration: 1.5,
                delay,
                ease: 'expo.out',
            });
            gsap.to(g.outer.material, {
                opacity: 0.12,
                duration: 1.5,
                delay,
                ease: 'expo.out',
            });
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

    // For reduced motion: skip entrance, set everything to final state
    if (REDUCED_MOTION) {
        setBeamFinalState();
        entered = true;
    } else {
        // Pre-shrink so no flash before IO fires
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

    // ── Resize handling (in-mode only — breakpoint switch handled outside) ─
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

    // First static render for reduced motion or before IO fires
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
            beamGlowSprites.forEach((g) => {
                window.gsap.killTweensOf(g.inner.material);
                window.gsap.killTweensOf(g.outer.material);
            });
            window.gsap.killTweensOf(camera.position);
        }

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

        // Dispose the shared glow texture (referenced by every sprite material).
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
