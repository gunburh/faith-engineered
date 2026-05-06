/**
 * stack-build.js — Faith Engineered · Chapter 01 · The Stack
 *
 * Click any stack card → set data-active="true", update sticky detail panel.
 * Default active layer: Layer 06 (DISTRIBUTION) on load.
 */

const LAYER_DETAIL = {
    '06': {
        idx: '06',
        tag: 'DISTRIBUTION',
        tagColor: '#38F593',
        name: 'New Media / Influencer',
        subtitle: 'Idol / Social',
        origin: 'Emerged in the late 2010s as smartphones, TikTok, and LINE became default infrastructure in Thailand. Celebrity monks, fortune-teller streams, and Mutelu influencers turned existing belief into shareable content overnight.',
        function: 'The distribution layer of the stack. It does not invent doctrine — it broadcasts the lower five layers to a younger audience using algorithmic feeds, lucky-number livestreams, sticker packs, and shrine-selfie aesthetics.',
        interaction: 'Sits on top of every other layer. Animist amulets get unboxing reels, Brahmin court rituals get drone coverage, Theravada sermons get short-form edits. Nothing below is replaced — it is repackaged for the feed.',
    },
    '05': {
        idx: '05',
        tag: 'STATE',
        tagColor: '#F53838',
        name: 'Royal Brahmanism',
        subtitle: 'Brahminical Rite of Power',
        origin: 'Imported from the Khmer court tradition during the Ayutthaya period. Brahmin priests legitimized kingship through Vedic-derived rituals adapted into a Theravada-Buddhist political frame.',
        function: 'Layer of state ceremony. Coronation, plowing rite, royal funerals. Provides theatrical authority that ordinary religion cannot — visible spectacle as proof of cosmic order.',
        interaction: 'Sits above Theravada Buddhism without conflict — Buddhism handles personal merit, Brahmanism handles public sovereignty. They share temples, share calendars, share priests in some festivals.',
    },
    '04': {
        idx: '04',
        tag: 'MERCHANT',
        tagColor: '#F56A38',
        name: 'Chinese Folk Religion',
        subtitle: 'Guanyin / Chinese New Year',
        origin: 'Imported by Sino-Thai trading families through the 19th-century migration waves. Domestic shrines, Guanyin halls, and tutelary tudigong figures embedded directly into Bangkok shophouses.',
        function: 'Commerce layer. Wealth gods, ancestor veneration, lunar holiday economy. Gives the merchant class a vocabulary for prosperity that Buddhism does not directly provide.',
        interaction: 'Slots in beside Theravada without competing — Chinese Folk Religion is property-and-prosperity, Buddhism is karma-and-rebirth. Many Sino-Thai homes run both daily.',
    },
    '03': {
        idx: '03',
        tag: 'FORMAL OS',
        tagColor: '#385BF5',
        name: 'Theravada Buddhism',
        subtitle: 'Theravada Karmic System',
        origin: 'Established as state religion in the 13th century via the Sukhothai court, codified through Sri Lankan textual lineages and a national ordination system.',
        function: 'The formal operating system. Merit, karma, and rebirth as the underlying logic for ethics, law, education, and the life-cycle calendar (ordination, weddings, cremation).',
        interaction: 'Provides the substrate every other layer is mounted on. Animism, Hinduism, and Chinese folk religion all operate inside a Buddhist worldview without overwriting it.',
    },
    '02': {
        idx: '02',
        tag: 'COURT',
        tagColor: '#8A38F5',
        name: 'Hindu Mythology',
        subtitle: 'Brahmin-Hindu',
        origin: 'Inherited from the Khmer Empire and refined through Ayutthayan court culture. Brahma, Ganesh, and Shiva were absorbed as cosmological power-brokers, not as primary objects of devotion.',
        function: 'Royal-court layer. Provides iconography, court ritual vocabulary, and a pantheon for transactional petitions — career, art, success — that Buddhism deliberately does not address.',
        interaction: 'Co-resident with Theravada at the same shrines. The Erawan Shrine in Bangkok runs almost entirely on this layer while sitting in a Buddhist-majority commercial district.',
    },
    '01': {
        idx: '01',
        tag: 'FOUNDATION',
        tagColor: '#E6C878',
        name: 'Animism',
        subtitle: 'Ghost / Superstition',
        origin: 'Predates every imported tradition. Indigenous belief that places, trees, rivers, and the dead retain spirits requiring acknowledgment. The spirit house predates the temple.',
        function: 'Foundation layer. Handles the immediate and the personal — the spirit of the land, the ghost at the crossroads, the protective amulet, the inauspicious date.',
        interaction: 'Survives underneath everything. No subsequent layer attempted to remove it; each one absorbed and re-described its rituals in its own vocabulary.',
    },
};

/**
 * Build inner HTML for the sticky detail panel from a layer record.
 */
function buildDetailHTML(layer) {
    return `
        <div class="ch01-stack-detail__head">
            <div class="ch01-stack-card__meta">
                <span class="ch01-stack-card__num">LAYER ${layer.idx}</span>
                <span class="ch01-stack-card__tag" style="--tag-color: ${layer.tagColor};">${layer.tag}</span>
            </div>
            <h3 class="ch01-stack-card__name">${layer.name}</h3>
            <p class="ch01-stack-card__sub">${layer.subtitle}</p>
        </div>
        <hr class="ch01-stack-detail__divider">
        <div class="ch01-stack-detail__sections">
            <section>
                <h4 class="ch01-stack-detail__sub">Origin</h4>
                <p>${layer.origin}</p>
            </section>
            <section>
                <h4 class="ch01-stack-detail__sub">Function</h4>
                <p>${layer.function}</p>
            </section>
            <section>
                <h4 class="ch01-stack-detail__sub">Interaction with other layer</h4>
                <p>${layer.interaction}</p>
            </section>
        </div>
    `;
}

/**
 * Set the active layer: update card states + populate detail panel.
 */
function setActiveLayer(idx, cards, detail) {
    cards.forEach((c) => {
        c.dataset.active = String(c.dataset.layerIdx === idx);
    });
    const layer = LAYER_DETAIL[idx];
    if (layer && detail) {
        detail.innerHTML = buildDetailHTML(layer);
    }
}

// ─────────────────────────────────────────────────────────
// Animated glow-string connector
// Draws a curved gold SVG path from active card → detail panel.
// Re-routes on scroll, resize, and active-card change so the
// string keeps "pointing" at the sticky panel as it moves.
// ─────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';
const SPARKLE_COUNT = 9;
const WARP_FILTER_ID = 'ch01-string-warp';

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function mkPath(cls) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('class', cls);
    return p;
}

/**
 * Inject the SVG once: <defs> with a turbulence-displacement warp filter,
 * three stacked ribbon paths (halo / mid / core), and a sparkle group with
 * N traveling particles. Returns refs for later updates.
 */
function ensureString(grid) {
    let svg = grid.querySelector('.ch01-stack-string');
    if (svg) {
        return {
            svg,
            halo: svg.querySelector('.ch01-stack-string__path--halo'),
            mid:  svg.querySelector('.ch01-stack-string__path--mid'),
            core: svg.querySelector('.ch01-stack-string__path--core'),
            sparkles: Array.from(svg.querySelectorAll('.ch01-stack-string__sparkle')),
        };
    }

    svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'ch01-stack-string');
    svg.setAttribute('aria-hidden', 'true');
    svg.dataset.visible = 'false';

    // Organic wisp distortion via fractal noise + displacement.
    // baseFrequency: low X, higher Y → mostly vertical undulation.
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
        <filter id="${WARP_FILTER_ID}" x="-30%" y="-40%" width="160%" height="180%" color-interpolation-filters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.06" numOctaves="2" seed="3" result="noise">
                <animate attributeName="seed" values="0;30" dur="9s" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="11" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
    `;
    svg.appendChild(defs);

    // Ribbon group — warped to feel organic
    const ribbon = document.createElementNS(SVG_NS, 'g');
    ribbon.setAttribute('class', 'ch01-stack-string__ribbon');
    if (!prefersReducedMotion()) {
        ribbon.setAttribute('filter', `url(#${WARP_FILTER_ID})`);
    }

    const halo = mkPath('ch01-stack-string__path ch01-stack-string__path--halo');
    const mid  = mkPath('ch01-stack-string__path ch01-stack-string__path--mid');
    const core = mkPath('ch01-stack-string__path ch01-stack-string__path--core');
    ribbon.append(halo, mid, core);
    svg.appendChild(ribbon);

    // Sparkle group — sits OUTSIDE the warp so particles stay crisp dots.
    const sparkleGroup = document.createElementNS(SVG_NS, 'g');
    sparkleGroup.setAttribute('class', 'ch01-stack-string__sparkles');

    const sparkles = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('class', 'ch01-stack-string__sparkle');
        c.setAttribute('r', (Math.random() * 1.1 + 0.55).toFixed(2));
        c.setAttribute('cx', '0');
        c.setAttribute('cy', '0');
        c.setAttribute('opacity', '0');
        sparkleGroup.appendChild(c);

        sparkles.push({
            el: c,
            // Even-spaced offsets so the stream looks continuous,
            // with a small random jitter to break perfect uniformity.
            t: i / SPARKLE_COUNT + Math.random() * 0.05,
            speed: 0.16 + Math.random() * 0.12,   // path-lengths per second
        });
    }
    svg.appendChild(sparkleGroup);

    grid.appendChild(svg);

    return { svg, halo, mid, core, sparkles };
}

/**
 * Build a smooth horizontal-tangent cubic Bezier between two points.
 * The curve "leaves" the card horizontally and "arrives" at the panel
 * horizontally, with control-point spread = half the horizontal distance.
 */
function curvePath(sx, sy, ex, ey) {
    const dx = ex - sx;
    const cp1x = sx + Math.max(40, dx * 0.55);
    const cp1y = sy;
    const cp2x = ex - Math.max(40, dx * 0.55);
    const cp2y = ey;
    return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
}

/**
 * Recompute the curved path from the currently-active card to the detail
 * panel and write it to all three ribbon strands. Coordinates are relative
 * to the grid's bounding box so the SVG can sit `position: absolute; inset: 0`.
 */
function drawString(state) {
    const { grid, detail, svg, halo, mid, core } = state;
    const activeCard = grid.querySelector('[data-layer-idx][data-active="true"]');

    if (!activeCard || !detail || !svg) {
        if (svg) svg.dataset.visible = 'false';
        return;
    }

    const gridRect = grid.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    const panelRect = detail.getBoundingClientRect();

    svg.setAttribute('width', gridRect.width);
    svg.setAttribute('height', gridRect.height);
    svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);

    const sx = cardRect.right - gridRect.left;
    const sy = cardRect.top + cardRect.height / 2 - gridRect.top;

    // Aim at the panel header (where LAYER NN + name sit).
    const targetY = Math.min(
        panelRect.top + 60 - gridRect.top,
        panelRect.bottom - 24 - gridRect.top
    );
    const ex = panelRect.left - gridRect.left;
    const ey = targetY;

    const d = curvePath(sx, sy, ex, ey);
    halo.setAttribute('d', d);
    mid.setAttribute('d', d);
    core.setAttribute('d', d);

    svg.dataset.visible = 'true';
}

/**
 * Continuous rAF loop. Slides each sparkle along the (un-warped) core path
 * using SVGGeometryElement.getPointAtLength, fading in mid-traversal so it
 * looks like a stream of light flowing from card → panel.
 */
function startSparkleLoop(state) {
    if (prefersReducedMotion()) return () => {};

    const { core, sparkles } = state;
    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
        raf = requestAnimationFrame(tick);

        const dt = Math.min(0.05, (now - last) / 1000);   // clamp big jumps
        last = now;

        // path may not have a `d` yet on first frame
        const dAttr = core.getAttribute('d');
        if (!dAttr) return;

        let len;
        try { len = core.getTotalLength(); } catch (_) { return; }
        if (!len || !isFinite(len)) return;

        for (const s of sparkles) {
            s.t += s.speed * dt;
            if (s.t > 1) s.t -= 1;

            const pt = core.getPointAtLength(s.t * len);
            s.el.setAttribute('cx', pt.x.toFixed(2));
            s.el.setAttribute('cy', pt.y.toFixed(2));

            // Bell-curve fade across the trip — bright in the middle, soft at the ends
            const fade = Math.sin(s.t * Math.PI);
            s.el.setAttribute('opacity', (fade * 0.95).toFixed(2));
        }
    };

    raf = requestAnimationFrame((t) => { last = t; tick(t); });

    return () => cancelAnimationFrame(raf);
}

/**
 * Wire up scroll + resize listeners (rAF-throttled) so the string
 * follows the sticky panel as it moves through the viewport.
 */
function bindStringUpdates(state) {
    let raf = 0;
    const schedule = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
            raf = 0;
            drawString(state);
        });
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // Initial draw after layout settles
    schedule();

    return schedule;
}

/**
 * Initialize the Chapter 01 stack diagram.
 * Click on any card → activate it + update detail panel.
 * Default active = Layer 06 on load.
 */
export function initStackBuild() {
    const root = document.querySelector('[data-stack-cards]');
    const detail = document.querySelector('[data-stack-detail]');
    if (!root || !detail) return;

    const cards = Array.from(root.querySelectorAll('[data-layer-idx]'));
    if (!cards.length) return;

    const grid = root.parentElement;
    const { svg, halo, mid, core, sparkles } = ensureString(grid);
    const state = { grid, detail, svg, halo, mid, core, sparkles };
    const redrawString = bindStringUpdates(state);

    // Default: Layer 06 (the first / topmost card)
    setActiveLayer('06', cards, detail);
    redrawString();

    // Particles flowing along the path, continuously
    startSparkleLoop(state);

    cards.forEach((card) => {
        const activate = () => {
            const idx = card.dataset.layerIdx;
            if (!idx) return;
            setActiveLayer(idx, cards, detail);
            redrawString();
        };

        card.addEventListener('click', activate);
        card.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            activate();
        });
    });
}
