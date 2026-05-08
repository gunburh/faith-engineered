/**
 * viral-timeline.js — Faith Engineered · Chapter 04 · The New Saints
 *
 * Cinematic 4-ribbon "stream of belief" — replaces the static dot
 * timeline. Each saint owns one Bezier ribbon spanning the canvas;
 * each ribbon's brightness peaks at the saint's viral year via a
 * per-ribbon peak-fade gradient texture (saint stays present along
 * the whole timeline, brightest at their peak year).
 *
 * Per saint:
 *   • 4 stacked Catmull-Rom curve points + MeshLine ribbon
 *   • Bright pulsing white spark at peak position
 *   • Two-layer particle burst — tight colored cluster + wide cream
 *     dust scattered Gaussian-style around the saint
 *   • HTML overlay: name label above, year label below, invisible
 *     hover target, tooltip on hover (name / year / context)
 *
 * Entrance: GSAP-driven left-to-right ribbon reveal via MeshLine's
 * built-in `visibility` uniform, then chronological saint fade-in.
 *
 * Mobile (<768px): the original 12-year dot timeline (CSS-driven).
 *
 * Three.js loaded as window.THREE; MeshLine as window.MeshLine /
 * window.MeshLineMaterial; GSAP as window.gsap.
 *
 * THREE.MeshLine by Jaume Sanchez Elias (spite) — MIT License.
 */

const REDUCED_MOTION =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BREAKPOINT = 768;

const RIBBONS = [
    {
        saint:        'Nang Kwak',
        year:         2015,
        peakT:        0.05,
        color:        0xB8334A,
        curveOffsets: [ 0.34,  0.18, -0.10, -0.26],
        context:      'Pre-pandemic prosperity icon',
        id:           'nang-kwak',
    },
    {
        saint:        'Ai Khai',
        year:         2019,
        peakT:        0.40,
        color:        0xC9A961,
        curveOffsets: [-0.18,  0.08, -0.26,  0.16],
        context:      'Pre-pandemic boom — fortune child',
        id:           'ai-khai',
    },
    {
        saint:        'Taowessuwan',
        year:         2022,
        peakT:        0.70,
        color:        0x7B5FAB,
        curveOffsets: [ 0.16, -0.34,  0.26, -0.10],
        context:      'Post-pandemic guardian wealth',
        id:           'taowessuwan',
    },
    {
        saint:        'Kru Kai Kaew',
        year:         2023,
        peakT:        0.80,
        color:        0xF5F1EA,
        curveOffsets: [-0.26,  0.34, -0.18,  0.26],
        context:      'AI-era luck specialist',
        id:           'kru-kai',
    },
];

// ── Mobile data (unchanged from original dot timeline) ────
const FLAT_DOTS = [
    { kind: 'oxblood', name: 'Nang Kwak',    pos: 0  },
    { kind: 'gold',    name: 'Ai Khai',      pos: 40 },
    { kind: 'violet',  name: 'Taowessuwan',  pos: 70 },
    { kind: 'cream',   name: 'Kru Kai Kaew', pos: 80 },
];
const FLAT_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// ─────────────────────────────────────────────────────────
// Flat (mobile) fallback
// ─────────────────────────────────────────────────────────
function renderFlat(container) {
    container.dataset.mode = 'flat';
    container.innerHTML = `
        <div class="ch04-timeline__track">
            ${FLAT_DOTS.map((d) => `
                <div class="ch04-timeline__dot ch04-timeline__dot--${d.kind}" style="--pos: ${d.pos}%;">
                    <span class="ch04-timeline__name">${d.name}</span>
                </div>
            `).join('')}
        </div>
        <ul class="ch04-timeline__years" role="list">
            ${FLAT_YEARS.map((y) => `<li>${y}</li>`).join('')}
        </ul>
    `;
    return () => {
        container.innerHTML = '';
        delete container.dataset.mode;
    };
}

// ─────────────────────────────────────────────────────────
// Three.js (desktop) — minimal: 4 ribbon lines + HTML labels
// ─────────────────────────────────────────────────────────

// Soft radial-gradient texture — used by saint glow sprites + particles.
// Gaussian per-pixel × radial fade clamp → alpha is *guaranteed* to be 0
// at and outside the canvas edge, so sprites never show a visible circle
// boundary regardless of how wide they're scaled.
function makeGlowTexture(THREE) {
    const SIZE = 256;
    const cv = document.createElement('canvas');
    cv.width = SIZE; cv.height = SIZE;
    const ctx = cv.getContext('2d');

    const data = ctx.createImageData(SIZE, SIZE);
    const c = SIZE / 2;
    const sigma  = SIZE * 0.16;        // tighter Gaussian peak
    const sigma2 = 2 * sigma * sigma;

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const dx = x - c;
            const dy = y - c;
            const d2 = dx * dx + dy * dy;
            const r  = Math.sqrt(d2) / c;       // 0 (center) .. 1 (edge) ..>1 (corner)
            let a = Math.exp(-d2 / sigma2);
            // Smoothstep-like fade that hits 0 by r=1 — kills any residual
            // alpha at the texture edge, which is the source of the visible
            // ring you'd otherwise see on big halo sprites.
            const fade = r >= 1 ? 0 : Math.pow(1 - r, 3);
            a *= fade;
            if (a < 0.001) a = 0;
            const idx = (y * SIZE + x) * 4;
            data.data[idx + 0] = 255;
            data.data[idx + 1] = 255;
            data.data[idx + 2] = 255;
            data.data[idx + 3] = Math.round(a * 255);
        }
    }
    ctx.putImageData(data, 0, 0);

    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
}

// Per-ribbon gradient: bright at peakT, dim baseline elsewhere.
function buildPeakGradientTexture(THREE, peakT, color) {
    const W = 512;
    const H = 4;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    const r = (color >> 16) & 0xff;
    const g = (color >> 8)  & 0xff;
    const b = color & 0xff;

    const data = ctx.createImageData(W, H);
    for (let x = 0; x < W; x++) {
        const t = x / (W - 1);
        const dist = Math.abs(t - peakT);
        const wide  = 0.20 * Math.exp(-(dist * dist) / 0.05);
        const sharp = 0.85 * Math.exp(-(dist * dist) / 0.004);
        const alpha = Math.min(1.0, 0.20 + wide + sharp);
        const a255 = Math.round(alpha * 255);
        for (let y = 0; y < H; y++) {
            const idx = (y * W + x) * 4;
            data.data[idx + 0] = r;
            data.data[idx + 1] = g;
            data.data[idx + 2] = b;
            data.data[idx + 3] = a255;
        }
    }
    ctx.putImageData(data, 0, 0);

    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
}

function renderThree(container) {
    const THREE = window.THREE;
    const MeshLine = window.MeshLine;
    const MeshLineMaterial = window.MeshLineMaterial;
    if (!THREE || !MeshLine || !MeshLineMaterial) {
        return renderFlat(container);
    }

    container.dataset.mode = 'three';
    container.innerHTML = '';

    // ── Scaffolding ──────────────────────────────────────
    const bgEl = document.createElement('div');
    bgEl.className = 'ch04-timeline__bg';
    container.appendChild(bgEl);

    const canvas = document.createElement('canvas');
    canvas.className = 'ch04-timeline__canvas';
    container.appendChild(canvas);

    const overlay = document.createElement('div');
    overlay.className = 'ch04-timeline__overlay';
    container.appendChild(overlay);

    // ── Three.js scene ───────────────────────────────────
    const scene = new THREE.Scene();
    let aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight, false);

    // ── Build ribbons ────────────────────────────────────
    const ribbons = [];
    const SAMPLE_COUNT = 200;

    function buildCurve(def, asp) {
        const W = asp * 0.95;
        const points = [
            new THREE.Vector3(-W,        def.curveOffsets[0], 0),
            new THREE.Vector3(-W * 0.33, def.curveOffsets[1], 0),
            new THREE.Vector3( W * 0.33, def.curveOffsets[2], 0),
            new THREE.Vector3( W,        def.curveOffsets[3], 0),
        ];
        return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    }

    RIBBONS.forEach((def, idx) => {
        const curve = buildCurve(def, aspect);
        const sampledPoints = curve.getSpacedPoints(SAMPLE_COUNT - 1);
        const gradTex = buildPeakGradientTexture(THREE, def.peakT, def.color);

        const line = new MeshLine();
        line.setPoints(sampledPoints);

        const material = new MeshLineMaterial({
            map: gradTex,
            useMap: 1,
            color: new THREE.Color(0xffffff),
            opacity: 1.0,
            transparent: true,
            lineWidth: 3,
            sizeAttenuation: 0,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            resolution: new THREE.Vector2(container.clientWidth, container.clientHeight),
            visibility: REDUCED_MOTION ? 1.0 : 0.0,
        });

        const mesh = new THREE.Mesh(line, material);
        mesh.position.z = idx * 0.001;
        scene.add(mesh);

        const saintWorld = curve.getPointAt(def.peakT);

        ribbons.push({
            def, idx, curve, line, material, mesh, gradTex,
            saintWorld: saintWorld.clone(),
        });
    });

    // ─────────────────────────────────────────────────────
    // Saint glow halo + particle burst (reference image style)
    // Per saint:
    //   • 3 stacked soft sprites — wide → mid → tight (atmospheric fluff)
    //   • 1 bright cream center spark
    //   • Particle burst: many small dots scattered radially around saint,
    //     dense at center, sparse at edges, varied sizes via 2 layers.
    // ─────────────────────────────────────────────────────
    const glowTexture = makeGlowTexture(THREE);
    const saintNodes = [];

    function gaussianRadius(maxR) {
        // Average of 4 uniforms ≈ Gaussian peaked at 0 → most particles near center
        const u = (Math.random() + Math.random() + Math.random() + Math.random()) * 0.25;
        return u * maxR;
    }

    ribbons.forEach((rb) => {
        const cx = rb.saintWorld.x;
        const cy = rb.saintWorld.y;
        const color = rb.def.color;

        // ── Bright cream center spark (pulsing) ──
        const sparkGeo = new THREE.BufferGeometry();
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(
            new Float32Array([cx, cy, 0]), 3));
        const sparkMat = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            map: glowTexture,
            size: 36,
            transparent: true,
            opacity: REDUCED_MOTION ? 1.0 : 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: false,
            alphaTest: 0.02,
        });
        const spark = new THREE.Points(sparkGeo, sparkMat);
        scene.add(spark);
        const sparkPhase = Math.random() * Math.PI * 2;

        // ── Particle burst — 2 layers (tight bright + wide scattered) ──
        function buildBurstLayer({ count, maxR, size, opacity, useColor, gaussian = true }) {
            const geometry = new THREE.BufferGeometry();
            const basePos = new Float32Array(count * 3);
            const positions = new Float32Array(count * 3);
            const phases = new Float32Array(count);
            const ampl   = new Float32Array(count);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                // gaussian=true → tight Gaussian peak (4-sample average).
                // gaussian=false → flatter distribution (2-sample), looser cluster.
                const r = gaussian
                    ? gaussianRadius(maxR)
                    : ((Math.random() + Math.random()) * 0.5) * maxR;
                basePos[i * 3 + 0] = cx + Math.cos(angle) * r;
                basePos[i * 3 + 1] = cy + Math.sin(angle) * r;
                basePos[i * 3 + 2] = 0;
                positions[i * 3 + 0] = basePos[i * 3 + 0];
                positions[i * 3 + 1] = basePos[i * 3 + 1];
                positions[i * 3 + 2] = 0;
                phases[i] = Math.random() * Math.PI * 2;
                // Visible wobble — was 0.002–0.007, now ~3× bigger.
                ampl[i]   = 0.008 + Math.random() * 0.018;
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const material = new THREE.PointsMaterial({
                color: useColor ? color : 0xF5F1EA,
                map: glowTexture,
                size,
                transparent: true,
                opacity: REDUCED_MOTION ? opacity : 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                sizeAttenuation: false,
                alphaTest: 0.02,
            });
            const points = new THREE.Points(geometry, material);
            scene.add(points);
            return {
                geometry, material, points, basePos, phases, ampl, count,
                baseOpacity: opacity,
            };
        }

        // First layer is now LOOSER — wider radius + flatter distribution
        // (only 2 uniforms averaged instead of 4 → less center-clumping).
        const burstTight = buildBurstLayer({
            count: 100, maxR: 0.26, size: 7, opacity: 0.95,
            useColor: true, gaussian: false,
        });
        const burstWide = buildBurstLayer({
            count: 220, maxR: 0.55, size: 4, opacity: 0.70,
            useColor: false, gaussian: true,
        });

        saintNodes.push({
            ribbon: rb,
            sparkGeo, sparkMat, spark, sparkPhase,
            burstTight, burstWide,
            cx, cy,
        });
    });

    // ── HTML overlay (saint name + year labels + hover targets + tooltip) ──
    const tooltip = document.createElement('div');
    tooltip.className = 'ch04-timeline__tooltip';
    tooltip.innerHTML = `
        <p class="ch04-timeline__tooltip-name"></p>
        <p class="ch04-timeline__tooltip-year"></p>
        <p class="ch04-timeline__tooltip-context"></p>
    `;
    overlay.appendChild(tooltip);
    const tooltipName    = tooltip.querySelector('.ch04-timeline__tooltip-name');
    const tooltipYear    = tooltip.querySelector('.ch04-timeline__tooltip-year');
    const tooltipContext = tooltip.querySelector('.ch04-timeline__tooltip-context');

    let hoveredIdx = -1;

    const labels = RIBBONS.map((def, idx) => {
        const nameEl = document.createElement('div');
        nameEl.className = 'ch04-timeline__name-label';
        nameEl.textContent = def.saint;
        overlay.appendChild(nameEl);

        const yearEl = document.createElement('div');
        yearEl.className = 'ch04-timeline__year-label';
        yearEl.textContent = String(def.year);
        overlay.appendChild(yearEl);

        const hover = document.createElement('div');
        hover.className = 'ch04-timeline__hover-target';
        hover.dataset.saintId = def.id;
        overlay.appendChild(hover);

        const onEnter = () => {
            hoveredIdx = idx;
            applyLabelHoverStates();
            const saint = ribbons[idx].saintWorld;
            const screen = projectToScreen(saint.x, saint.y);
            tooltip.style.left = `${screen.x}px`;
            tooltip.style.top  = `${screen.y + 64}px`;
            tooltipName.textContent    = def.saint;
            tooltipYear.textContent    = String(def.year);
            tooltipContext.textContent = def.context;
            tooltip.dataset.state = 'visible';
        };
        const onLeave = () => {
            hoveredIdx = -1;
            applyLabelHoverStates();
            delete tooltip.dataset.state;
        };
        hover.addEventListener('mouseenter', onEnter);
        hover.addEventListener('mouseleave', onLeave);

        return { nameEl, yearEl, hover, def, onEnter, onLeave };
    });

    function applyLabelHoverStates() {
        labels.forEach((label, idx) => {
            if (hoveredIdx === -1) {
                delete label.nameEl.dataset.state;
                delete label.yearEl.dataset.state;
            } else if (hoveredIdx === idx) {
                label.nameEl.dataset.state = 'hover';
                label.yearEl.dataset.state = 'hover';
            } else {
                label.nameEl.dataset.state = 'dim';
                label.yearEl.dataset.state = 'dim';
            }
        });
    }

    function projectToScreen(worldX, worldY) {
        const v = new THREE.Vector3(worldX, worldY, 0);
        v.project(camera);
        return {
            x: (v.x * 0.5 + 0.5) * canvas.clientWidth,
            y: (-v.y * 0.5 + 0.5) * canvas.clientHeight,
        };
    }

    function updateLabelPositions() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const v = new THREE.Vector3();
        labels.forEach((label, idx) => {
            v.copy(ribbons[idx].saintWorld).project(camera);
            const sx = (v.x * 0.5 + 0.5) * w;
            const sy = (-v.y * 0.5 + 0.5) * h;
            label.nameEl.style.transform =
                `translate(${sx}px, ${sy - 36}px) translate(-50%, -50%)`;
            label.yearEl.style.transform =
                `translate(${sx}px, ${sy + 28}px) translate(-50%, -50%)`;
            label.hover.style.left = `${sx}px`;
            label.hover.style.top  = `${sy}px`;
        });
    }

    // ── Render loop + state ──
    let rafId = null;
    let entranceFired = false;
    let entranceDone = REDUCED_MOTION;
    const startTime = performance.now();

    function wobbleLayer(layer, t) {
        const arr  = layer.geometry.attributes.position.array;
        const base = layer.basePos;
        const ph   = layer.phases;
        const am   = layer.ampl;
        for (let i = 0; i < layer.count; i++) {
            arr[i * 3 + 0] = base[i * 3 + 0] + Math.sin(t * 1.1 + ph[i]) * am[i];
            arr[i * 3 + 1] = base[i * 3 + 1] + Math.cos(t * 1.3 + ph[i] * 1.4) * am[i];
            arr[i * 3 + 2] = 0;
        }
        layer.geometry.attributes.position.needsUpdate = true;
    }

    const render = () => {
        const t = (performance.now() - startTime) / 1000;

        if (!REDUCED_MOTION) {
            for (let si = 0; si < saintNodes.length; si++) {
                const node = saintNodes[si];
                wobbleLayer(node.burstTight, t);
                wobbleLayer(node.burstWide,  t);

                if (entranceDone) {
                    const isHover = hoveredIdx === si;
                    const isOther = hoveredIdx !== -1 && !isHover;
                    const dim     = isOther ? 0.4 : 1.0;
                    const boost   = isHover ? 1.20 : 1.0;

                    // Spark pulse with hover modulation
                    const pulse = 0.78 + Math.sin(t * 1.5 + node.sparkPhase) * 0.22;
                    const sparkTarget = pulse * dim * boost;
                    node.sparkMat.opacity += (sparkTarget - node.sparkMat.opacity) * 0.18;

                    // Burst layer hover dim/boost
                    const tightTarget = node.burstTight.baseOpacity * dim * boost;
                    const wideTarget  = node.burstWide.baseOpacity  * dim * boost;
                    node.burstTight.material.opacity += (tightTarget - node.burstTight.material.opacity) * 0.15;
                    node.burstWide.material.opacity  += (wideTarget  - node.burstWide.material.opacity)  * 0.15;
                }
            }

            // Ribbon hover dim
            if (entranceDone) {
                for (let i = 0; i < ribbons.length; i++) {
                    const isHover = hoveredIdx === i;
                    const isOther = hoveredIdx !== -1 && !isHover;
                    const target  = isHover ? 1.0 : isOther ? 0.4 : 0.95;
                    const cur = ribbons[i].material.opacity;
                    ribbons[i].material.opacity = cur + (target - cur) * 0.15;
                }
            }
        }

        renderer.render(scene, camera);
        updateLabelPositions();
        rafId = requestAnimationFrame(render);
    };

    // ── GSAP entrance ──
    const playEntrance = () => {
        if (entranceFired) return;
        entranceFired = true;

        if (REDUCED_MOTION || !window.gsap) {
            ribbons.forEach((rb) => { rb.material.uniforms.visibility.value = 1.0; });
            saintNodes.forEach((n) => {
                n.sparkMat.opacity = 1.0;
                n.burstTight.material.opacity = n.burstTight.baseOpacity;
                n.burstWide.material.opacity  = n.burstWide.baseOpacity;
            });
            entranceDone = true;
            return;
        }

        const gsap = window.gsap;
        // Ribbons sweep left-to-right via MeshLine `visibility` uniform
        ribbons.forEach((rb, i) => {
            gsap.fromTo(
                rb.material.uniforms.visibility,
                { value: 0 },
                { value: 1, duration: 1.5, delay: i * 0.2, ease: 'power2.inOut' }
            );
        });

        // Saint visuals fade in chronologically (after their ribbon starts)
        saintNodes.forEach((n, i) => {
            const d = i * 0.2 + 0.6;
            gsap.fromTo(n.sparkMat,
                { opacity: 0 },
                { opacity: 1.0, duration: 0.9, delay: d, ease: 'power2.out' });
            gsap.fromTo(n.burstTight.material,
                { opacity: 0 },
                { opacity: n.burstTight.baseOpacity, duration: 1.2, delay: d + 0.1, ease: 'power2.out' });
            gsap.fromTo(n.burstWide.material,
                { opacity: 0 },
                { opacity: n.burstWide.baseOpacity,  duration: 1.4, delay: d + 0.2, ease: 'power2.out' });
        });

        const totalDuration = 0.6 + (ribbons.length - 1) * 0.2 + 1.4 + 0.2;
        gsap.delayedCall(totalDuration, () => { entranceDone = true; });
    };

    // Visibility-gated RAF + entrance trigger
    const visibilityIO = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                if (!entranceFired) playEntrance();
                if (rafId == null) rafId = requestAnimationFrame(render);
            } else if (rafId != null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    }, { threshold: 0.15 });
    visibilityIO.observe(container);

    // ── Resize ───────────────────────────────────────────
    const onInternalResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h, false);
        aspect = w / Math.max(h, 1);
        camera.left = -aspect; camera.right = aspect;
        camera.top = 1; camera.bottom = -1;
        camera.updateProjectionMatrix();

        ribbons.forEach((rb) => {
            const newCurve = buildCurve(rb.def, aspect);
            rb.curve = newCurve;
            const newPoints = newCurve.getSpacedPoints(SAMPLE_COUNT - 1);
            rb.line.setPoints(newPoints);
            rb.material.uniforms.resolution.value.set(w, h);
            rb.saintWorld.copy(newCurve.getPointAt(rb.def.peakT));
        });

        // Re-anchor saint nodes (halos + spark + bursts) to new saint positions.
        saintNodes.forEach((node, i) => {
            const c = ribbons[i].saintWorld;
            const dx = c.x - node.cx;
            const dy = c.y - node.cy;
            node.cx = c.x;
            node.cy = c.y;
            const sArr = node.sparkGeo.attributes.position.array;
            sArr[0] = c.x; sArr[1] = c.y; sArr[2] = 0;
            node.sparkGeo.attributes.position.needsUpdate = true;
            // Translate burst base positions by the saint delta so the cloud
            // moves with the saint (preserves its scattered shape).
            [node.burstTight, node.burstWide].forEach((layer) => {
                const base = layer.basePos;
                const arr  = layer.geometry.attributes.position.array;
                for (let j = 0; j < layer.count; j++) {
                    base[j * 3 + 0] += dx;
                    base[j * 3 + 1] += dy;
                    arr[j * 3 + 0]  += dx;
                    arr[j * 3 + 1]  += dy;
                }
                layer.geometry.attributes.position.needsUpdate = true;
            });
        });

        updateLabelPositions();
        renderer.render(scene, camera);
    };

    // Initial paint
    renderer.render(scene, camera);
    updateLabelPositions();

    // ── Cleanup ──────────────────────────────────────────
    const cleanup = () => {
        if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        visibilityIO.disconnect();

        if (window.gsap) {
            ribbons.forEach((rb) => {
                window.gsap.killTweensOf(rb.material.uniforms.visibility);
            });
            saintNodes.forEach((n) => {
                window.gsap.killTweensOf(n.sparkMat);
                window.gsap.killTweensOf(n.burstTight.material);
                window.gsap.killTweensOf(n.burstWide.material);
            });
        }

        labels.forEach((label) => {
            label.hover.removeEventListener('mouseenter', label.onEnter);
            label.hover.removeEventListener('mouseleave', label.onLeave);
        });

        ribbons.forEach((rb) => {
            if (rb.line.dispose) rb.line.dispose();
            if (rb.material.dispose) rb.material.dispose();
            if (rb.gradTex && rb.gradTex.dispose) rb.gradTex.dispose();
            scene.remove(rb.mesh);
        });

        saintNodes.forEach((node) => {
            node.sparkGeo.dispose();
            node.sparkMat.dispose();
            scene.remove(node.spark);
            [node.burstTight, node.burstWide].forEach((layer) => {
                layer.geometry.dispose();
                layer.material.dispose();
                scene.remove(layer.points);
            });
        });
        if (glowTexture && glowTexture.dispose) glowTexture.dispose();

        scene.traverse((obj) => {
            if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m) => m.dispose && m.dispose());
                } else if (obj.material.dispose) {
                    obj.material.dispose();
                }
            }
        });

        renderer.dispose();

        if (canvas.parentNode)  canvas.parentNode.removeChild(canvas);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (bgEl.parentNode)    bgEl.parentNode.removeChild(bgEl);

        delete container.dataset.mode;
    };

    cleanup.onResize = onInternalResize;
    return cleanup;
}

// ─────────────────────────────────────────────────────────
// Public init
// ─────────────────────────────────────────────────────────
export function initViralTimeline() {
    const container = document.querySelector('[data-viral-timeline]');
    if (!container) return () => {};

    let activeCleanup = null;
    let lastIsMobile = window.innerWidth < BREAKPOINT;

    const mount = () => {
        if (activeCleanup) { activeCleanup(); activeCleanup = null; }
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
