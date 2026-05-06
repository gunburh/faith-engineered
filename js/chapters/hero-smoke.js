/**
 * hero-smoke.js — Faith Engineered
 *
 * Three.js particle haze in front of the hero logo.
 *   • ~1400 small soft points, cream + gold, peak opacity ~0.32
 *   • Motion driven by a 2-octave flow field (curl-noise-ish) →
 *     particles ride invisible currents, swirl, occasionally cluster
 *   • Per-particle size, alpha, drift speed (depth parallax)
 *   • Cursor: nearby particles repel, then drift back (drag-decayed velocity)
 *   • IntersectionObserver pauses the RAF loop when hero is offscreen
 *   • As the hero scrolls past, the whole canvas fades opacity → 0
 *   • prefers-reduced-motion → no canvas, nothing rendered
 *
 * Three.js is expected at window.THREE (vendor/three.min.js).
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Tuning ──────────────────────────────────────────────────────────
const PARTICLE_COUNT  = 1400;
const PEAK_OPACITY    = 0.65;       // sharp core opacity
const GLOW_OPACITY    = 0.22;       // soft halo opacity (additive on top of core)
const PARTICLE_SIZE   = 2.4;        // small, sparkly core
const GLOW_SIZE       = 11;         // wide soft halo
const REPEL_RADIUS_PX = 160;
const REPEL_STRENGTH  = 0.50;
const DRAG            = 0.935;      // per-frame velocity damping
const VELOCITY_EASE   = 0.045;      // how quickly particles match the flow field

// Flow-field scales (smaller = larger swirls)
const FLOW_FREQ_A     = 0.0030;
const FLOW_FREQ_B     = 0.0012;
const FLOW_TIME       = 0.22;
const FLOW_STRENGTH   = 0.40;

// Colors / palette
const COLOR_CREAM     = 0xF5F1EA;
const COLOR_GOLD      = 0xC9A961;
const GOLD_FRACTION   = 0.18;

export function initHeroSmoke() {
    if (REDUCED_MOTION) return;

    const THREE = window.THREE;
    if (!THREE) {
        console.warn('[hero-smoke] THREE not loaded — skipping');
        return;
    }

    const hero   = document.getElementById('hero');
    const canvas = document.getElementById('smoke-canvas');
    if (!hero || !canvas) {
        console.warn('[hero-smoke] hero or canvas missing — skipping');
        return;
    }

    // ─── Renderer / scene / camera ────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    let W = Math.max(1, canvas.clientWidth  || hero.clientWidth  || window.innerWidth);
    let H = Math.max(1, canvas.clientHeight || window.innerHeight);

    // Orthographic camera in pixel-space (origin at center) → cursor maths is trivial
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -1000, 1000);
    camera.position.z = 100;

    // ─── Procedural sprite generator ─────────────────────────────────
    // We build two textures: a tight bright core and a wide soft halo.
    // Layering them with additive blending gives a real glow look.
    const makeSprite = (innerStop, midStop, midAlpha) => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0,         'rgba(255,255,255,1)');
        g.addColorStop(innerStop, 'rgba(255,255,255,1)');
        g.addColorStop(midStop,   `rgba(255,255,255,${midAlpha})`);
        g.addColorStop(1,         'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        const t = new THREE.CanvasTexture(c);
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        return t;
    };
    // Tight, punchy core
    const sprite     = makeSprite(0.05, 0.35, 0.55);
    // Wide, soft glow halo — most of the radius is faded
    const glowSprite = makeSprite(0.00, 0.20, 0.35);

    // ─── Buffers ──────────────────────────────────────────────────────
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const speeds     = new Float32Array(PARTICLE_COUNT); // depth-based speed scale
    const phases     = new Float32Array(PARTICLE_COUNT); // per-particle noise offset
    const colors     = new Float32Array(PARTICLE_COUNT * 3);

    const cream = new THREE.Color(COLOR_CREAM);
    const gold  = new THREE.Color(COLOR_GOLD);

    // Cluster around the logo lockup (left-of-center) — but spread far enough
    // that the flow field has room to push them around dramatically.
    const seedParticles = () => {
        const cx = -W * 0.10;
        const cy =  H * 0.05;
        const spreadX = W * 0.65;
        const spreadY = H * 0.55;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ix = i * 3;

            // Beta-ish distribution: more density near center, long tails outward
            const rx = (Math.random() - 0.5) + (Math.random() - 0.5);
            const ry = (Math.random() - 0.5) + (Math.random() - 0.5);

            positions[ix    ] = cx + rx * spreadX;
            positions[ix + 1] = cy + ry * spreadY;
            positions[ix + 2] = 0;

            velocities[ix    ] = (Math.random() - 0.5) * 0.4;
            velocities[ix + 1] = (Math.random() - 0.5) * 0.4;
            velocities[ix + 2] = 0;

            // Per-particle speed + phase → parallax + variety in motion
            speeds[i] = 0.55 + Math.random() * 0.95;                // 0.55..1.50
            phases[i] = Math.random() * Math.PI * 2;

            // Brightness variation baked into vertex color (lets some points
            // look brighter/dimmer without needing a custom shader)
            const tint = Math.random() < GOLD_FRACTION ? gold : cream;
            const brightness = 0.45 + Math.random() * 0.55;          // 0.45..1.0
            colors[ix    ] = tint.r * brightness;
            colors[ix + 1] = tint.g * brightness;
            colors[ix + 2] = tint.b * brightness;
        }
    };
    seedParticles();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    // Bright core
    const coreMat = new THREE.PointsMaterial({
        size: PARTICLE_SIZE,
        map: sprite,
        alphaMap: sprite,
        vertexColors: true,
        transparent: true,
        opacity: PEAK_OPACITY,
        depthWrite: false,
        sizeAttenuation: false,
        blending: THREE.AdditiveBlending,
    });

    // Soft glow halo — same geometry, larger sprite, much lower opacity
    const glowMat = new THREE.PointsMaterial({
        size: GLOW_SIZE,
        map: glowSprite,
        alphaMap: glowSprite,
        vertexColors: true,
        transparent: true,
        opacity: GLOW_OPACITY,
        depthWrite: false,
        sizeAttenuation: false,
        blending: THREE.AdditiveBlending,
    });

    // Halo first (behind), core on top
    const glowPoints = new THREE.Points(geo, glowMat);
    const corePoints = new THREE.Points(geo, coreMat);
    scene.add(glowPoints);
    scene.add(corePoints);

    // ─── Cursor tracking (relative to canvas, centered coords) ───────
    const cursor = { x: -1e6, y: -1e6, active: false };

    const onPointerMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        cursor.x =  (e.clientX - rect.left) - W / 2;
        cursor.y = -((e.clientY - rect.top)  - H / 2);
        cursor.active = true;
    };
    const onPointerLeave = () => {
        cursor.active = false;
        cursor.x = cursor.y = -1e6;
    };

    hero.addEventListener('pointermove',  onPointerMove);
    hero.addEventListener('pointerleave', onPointerLeave);

    // ─── Resize ───────────────────────────────────────────────────────
    const resize = () => {
        W = Math.max(1, canvas.clientWidth  || hero.clientWidth  || window.innerWidth);
        H = Math.max(1, canvas.clientHeight || window.innerHeight);
        renderer.setSize(W, H, false);
        camera.left   = -W / 2;
        camera.right  =  W / 2;
        camera.top    =  H / 2;
        camera.bottom = -H / 2;
        camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── Animation loop ──────────────────────────────────────────────
    const posAttr = geo.attributes.position;
    const posArr  = posAttr.array;
    const padX = 80, padY = 80;
    let rafId = null;

    const tick = () => {
        const t  = performance.now() * 0.001;
        const tA = t * FLOW_TIME;
        const tB = t * FLOW_TIME * 0.55;
        const repelR2 = REPEL_RADIUS_PX * REPEL_RADIUS_PX;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ix = i * 3, iy = ix + 1;
            const x = posArr[ix];
            const y = posArr[iy];
            const ph = phases[i];

            // ── Flow field (cheap pseudo-curl-noise via 2-octave sin/cos) ──
            // Octave A — fast, small swirls
            const ax = Math.sin(x * FLOW_FREQ_A + tA + ph)
                     + Math.cos(y * FLOW_FREQ_A - tA * 1.1) * 0.55;
            const ay = Math.cos(x * FLOW_FREQ_A - tA * 0.9 + ph)
                     - Math.sin(y * FLOW_FREQ_A + tA) * 0.55;

            // Octave B — slow, large currents
            const bx = Math.sin(y * FLOW_FREQ_B + tB * 0.7) * 0.45;
            const by = Math.cos(x * FLOW_FREQ_B - tB * 0.6) * 0.45;

            const targetVx = (ax + bx) * FLOW_STRENGTH * speeds[i];
            // slight upward lift so the haze breathes upward
            const targetVy = (ay + by) * FLOW_STRENGTH * speeds[i] + 0.06;

            // ease velocity toward flow target
            velocities[ix] += (targetVx - velocities[ix]) * VELOCITY_EASE;
            velocities[iy] += (targetVy - velocities[iy]) * VELOCITY_EASE;

            // ── Cursor repel ──
            if (cursor.active) {
                const dx = x - cursor.x;
                const dy = y - cursor.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < repelR2 && d2 > 0.01) {
                    const d = Math.sqrt(d2);
                    const f = (1 - d / REPEL_RADIUS_PX);
                    const force = f * f * REPEL_STRENGTH;          // smoother falloff
                    velocities[ix] += (dx / d) * force;
                    velocities[iy] += (dy / d) * force;
                }
            }

            // damping → integrate
            velocities[ix] *= DRAG;
            velocities[iy] *= DRAG;
            posArr[ix] += velocities[ix];
            posArr[iy] += velocities[iy];

            // soft wrap so particles re-enter from the opposite side
            if (posArr[ix] >  W / 2 + padX) posArr[ix] = -W / 2 - padX;
            if (posArr[ix] < -W / 2 - padX) posArr[ix] =  W / 2 + padX;
            if (posArr[iy] >  H / 2 + padY) posArr[iy] = -H / 2 - padY;
            if (posArr[iy] < -H / 2 - padY) posArr[iy] =  H / 2 + padY;
        }

        posAttr.needsUpdate = true;
        renderer.render(scene, camera);
        rafId = requestAnimationFrame(tick);
    };

    const start = () => { if (rafId === null) tick(); };
    const stop  = () => { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } };

    const io = new IntersectionObserver(
        ([entry]) => { entry.isIntersecting ? start() : stop(); },
        { threshold: 0 }
    );
    io.observe(hero);

    // ─── Fade canvas as hero scrolls past ────────────────────────────
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.set(canvas, { opacity: 1 });
        gsap.to(canvas, {
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end:  'bottom top',
                scrub: true,
            },
        });
    }
}
