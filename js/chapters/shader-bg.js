/**
 * shader-bg.js — Faith Engineered
 *
 * Aurora-style fluid shader backdrop, retuned to the site's gold + cream
 * palette. Mounted on every long-form section EXCEPT the hero (which has
 * its own video + smoke pipeline that we don't want to compound).
 *
 *   • Gold ↔ gold-leaf ↔ cream three-tone ribbon mix per iteration
 *   • Render scale 0.6× (CSS upscale) — softer look, ~3× cheaper than 1.0×
 *   • IntersectionObserver auto pause/resume — only the visible section
 *     draws; off-screen sections release the RAF loop
 *   • prefers-reduced-motion → renders one static frame, no animation
 *   • Mobile (<768px) → CSS hides the canvas (perf budget)
 *
 * Three.js is loaded as window.THREE (vendor script). No new dependency.
 *
 * To DISABLE this background on a specific section, add the
 * `data-no-shader-bg` attribute to its root element — JS will skip it.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';   // unused — placeholder for parity
const RENDER_SCALE = 0.6;                      // canvas px : section px
const ITERATIONS = 22;                          // shader main loop count
const REDUCED_MOTION =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

const VERTEX_SHADER = /* glsl */ `
    void main() {
        gl_Position = vec4(position, 1.0);
    }
`;

const FRAGMENT_SHADER = /* glsl */ `
    uniform float iTime;
    uniform vec2  iResolution;

    #define NUM_OCTAVES 3

    float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 u  = fract(p);
        u = u * u * (3.0 - 2.0 * u);
        float res = mix(
            mix(rand(ip),                rand(ip + vec2(1.0, 0.0)), u.x),
            mix(rand(ip + vec2(0.0,1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
            u.y);
        return res * res;
    }

    float fbm(vec2 x) {
        float v = 0.0;
        float a = 0.3;
        vec2  shift = vec2(100.0);
        mat2  rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < NUM_OCTAVES; ++i) {
            v += a * noise(x);
            x = rot * x * 2.0 + shift;
            a *= 0.4;
        }
        return v;
    }

    void main() {
        // Faith Engineered design tokens, dropped into vec3:
        //   #C9A961  --color-gold
        //   #E6C878  --color-gold-leaf
        //   #F5F1EA  --color-cream
        vec3 gold     = vec3(0.788, 0.663, 0.380);
        vec3 goldLeaf = vec3(0.902, 0.784, 0.471);
        vec3 cream    = vec3(0.961, 0.945, 0.918);

        vec2 shake = vec2(sin(iTime * 1.2) * 0.005, cos(iTime * 2.1) * 0.005);
        vec2 p = ((gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5)
                 / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
        vec2 v;
        vec4 o = vec4(0.0);

        float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;

        for (float i = 0.0; i < float(${ITERATIONS}); i++) {
            v = p
                + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5
                + vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);

            float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3
                              * (1.0 - (i / float(${ITERATIONS})));

            // 3-tone ribbon colour — sweeps gold → gold-leaf → cream and back
            float a = 0.5 + 0.5 * sin(i * 0.2 + iTime * 0.4);
            float b = 0.5 + 0.5 * cos(i * 0.3 + iTime * 0.5);
            vec3  col = mix(gold, mix(goldLeaf, cream, a), b);
            vec4  ribbon = vec4(col, 1.0);

            vec4 contribution = ribbon
                * exp(sin(i * i + iTime * 0.8))
                / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));
            float thinness = smoothstep(0.0, 1.0, i / float(${ITERATIONS})) * 0.6;
            o += contribution * (1.0 + tailNoise * 0.8) * thinness;
        }

        o = tanh(pow(o / 100.0, vec4(1.6)));
        gl_FragColor = o * 1.5;
    }
`;

// ─────────────────────────────────────────────────────────
// Per-section instance
// ─────────────────────────────────────────────────────────
function mountShaderBg(section, THREE) {
    if (section.dataset.noShaderBg !== undefined) return null;

    // Single canvas, `position: fixed` at body level — bypasses every
    // sticky / containing-block / stacking-context trap that the previous
    // (stage + sticky) approach kept hitting (ch05's entrance animations
    // got disturbed and the aurora wouldn't lock to the viewport).
    // Visibility is gated by an IntersectionObserver on the section, so
    // the fixed canvas only renders + paints while you're actually inside
    // the About / Sources block.
    const canvas = document.createElement('canvas');
    canvas.className = 'shader-bg-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,        // fragment shader is the artistic source — AA is wasted GPU
        alpha: true,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            iTime:       { value: 0 },
            iResolution: { value: new THREE.Vector2(1, 1) },
        },
        vertexShader:   VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ── Sizing ────────────────────────────────────────────
    // Canvas is `position: sticky; height: 100vh` — render at viewport
    // dimensions so the shader's `iResolution` matches what the user
    // actually sees, keeping the aurora pattern centred on the viewport
    // (not on the section's full height).
    const setSize = () => {
        const w = Math.max(1, Math.floor(window.innerWidth  * RENDER_SCALE));
        const h = Math.max(1, Math.floor(window.innerHeight * RENDER_SCALE));
        renderer.setSize(w, h, false);             // false → don't touch canvas style; CSS upscales
        material.uniforms.iResolution.value.set(w, h);
    };
    setSize();

    // ── Animation loop (gated by visibility) ─────────────
    let frameId = 0;
    let lastT   = performance.now();
    let active  = false;

    const tick = () => {
        const now = performance.now();
        material.uniforms.iTime.value += (now - lastT) * 0.001;
        lastT = now;
        renderer.render(scene, camera);
        if (active) frameId = requestAnimationFrame(tick);
    };
    const start = () => {
        if (active) return;
        active = true;
        lastT = performance.now();
        frameId = requestAnimationFrame(tick);
    };
    const stop = () => {
        active = false;
        if (frameId) cancelAnimationFrame(frameId);
        frameId = 0;
    };

    if (REDUCED_MOTION) {
        // Render one static frame and stop — no animation.
        renderer.render(scene, camera);
        canvas.classList.add('is-visible');
    } else {
        // Show + render only while the section is on screen. The CSS
        // opacity transition (600ms) outlives the RAF stop, so we wait
        // a touch before actually halting the loop to avoid a visible
        // freeze at the end of the fade.
        let stopTimer = 0;
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (e.isIntersecting) {
                    clearTimeout(stopTimer);
                    canvas.classList.add('is-visible');
                    start();
                } else {
                    canvas.classList.remove('is-visible');
                    clearTimeout(stopTimer);
                    stopTimer = setTimeout(stop, 700);
                }
            }
        }, { rootMargin: '0px' });
        io.observe(section);
    }

    // ── Resize ───────────────────────────────────────────
    let resizeTimer = 0;
    const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setSize, 150);
    };
    window.addEventListener('resize', onResize);

    // No ResizeObserver needed — canvas is sized to viewport (window
    // events handle that), not to the section's content box.

    return {
        canvas,
        destroy: () => {
            stop();
            window.removeEventListener('resize', onResize);
            material.dispose();
            geometry.dispose();
            renderer.dispose();
            canvas.remove();
        },
    };
}

// ─────────────────────────────────────────────────────────
// Public init
// ─────────────────────────────────────────────────────────
export function initShaderBackgrounds() {
    if (typeof window === 'undefined') return () => {};
    const THREE = window.THREE;
    if (!THREE) {
        console.warn('[shader-bg] window.THREE not found — skipping');
        return () => {};
    }
    if (IS_MOBILE) return () => {};               // CSS also hides canvases on mobile

    // Scoped to the About / Sources section only — running this on every
    // chapter spawned 5 simultaneous WebGL contexts that compounded with
    // the existing Three.js scenes (hero smoke, stack-build, viral-timeline,
    // seasonal-peaks) and tanked the whole page. About is heavy enough on
    // its own to deserve the cinematic backdrop, and light enough on JS
    // elsewhere that it can absorb the cost.
    const sections = document.querySelectorAll('.sources-section');
    const instances = [];
    sections.forEach((s) => {
        const inst = mountShaderBg(s, THREE);
        if (inst) instances.push(inst);
    });

    return () => {
        instances.forEach((i) => i.destroy());
        instances.length = 0;
    };
}
