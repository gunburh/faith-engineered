/**
 * stack-build.js — Faith Engineered · Chapter 01 · The Stack
 *
 * Click any stack card → set data-active="true", update sticky detail panel.
 * Default active layer: Layer 06 (DISTRIBUTION) on load.
 *
 * Bilingual: every text field in LAYER_DETAIL is `{ en, th }`. The active
 * language is read from <html lang> at render time, and a MutationObserver
 * on that attribute re-renders the detail panel when the toggle is clicked.
 */

// ── i18n helpers ──────────────────────────────────────────
const getLang = () => (document.documentElement.lang === 'th' ? 'th' : 'en');
const t = (v) => (v && typeof v === 'object' && 'en' in v) ? (v[getLang()] || v.en) : v;

// Static labels used by the detail panel (kept inline so the module is
// self-contained — no need to read copy.json from here).
const LABELS = {
    layer:       { en: 'LAYER',                       th: 'ชั้น' },
    origin:      { en: 'Origin',                      th: 'ที่มา' },
    function:    { en: 'Function',                    th: 'หน้าที่' },
    interaction: { en: 'Interaction with other layer', th: 'ปฏิสัมพันธ์กับชั้นอื่น' },
};

const LAYER_DETAIL = {
    '06': {
        idx: '06',
        tag:      { en: 'DISTRIBUTION',                th: 'การกระจาย' },
        tagColor: '#38F593',
        name:     { en: 'New Media / Influencer',      th: 'สื่อใหม่ / อินฟลูเอนเซอร์' },
        subtitle: { en: 'Idol / Social',               th: 'ไอดอล / โซเชียล' },
        origin: {
            en: 'Emerged in the late 2010s as smartphones, TikTok, and LINE became default infrastructure in Thailand. Celebrity monks, fortune-teller streams, and Mutelu influencers turned existing belief into shareable content overnight.',
            th: 'เกิดขึ้นช่วงปลายปี 2010 เมื่อสมาร์ตโฟน TikTok และ LINE กลายเป็นโครงสร้างพื้นฐานหลักในไทย พระคนดัง สตรีมหมอดู และอินฟลูเอนเซอร์มูเตลู เปลี่ยนความเชื่อที่มีอยู่ให้เป็นคอนเทนต์ที่แชร์ได้ภายในข้ามคืน',
        },
        function: {
            en: 'The distribution layer of the stack. It does not invent doctrine — it broadcasts the lower five layers to a younger audience using algorithmic feeds, lucky-number livestreams, sticker packs, and shrine-selfie aesthetics.',
            th: 'ชั้นการกระจายของระบบ ไม่ได้สร้างหลักคำสอนใหม่ — แต่กระจายห้าชั้นด้านล่างสู่กลุ่มคนรุ่นใหม่ ผ่านฟีดอัลกอริทึม สตรีมเลขเด็ด สติกเกอร์ และสุนทรียะของเซลฟี่หน้าศาล',
        },
        interaction: {
            en: 'Sits on top of every other layer. Animist amulets get unboxing reels, Brahmin court rituals get drone coverage, Theravada sermons get short-form edits. Nothing below is replaced — it is repackaged for the feed.',
            th: 'อยู่บนสุดเหนือทุกชั้น เครื่องรางวิญญาณนิยมได้รีลแกะกล่อง พิธีพราหมณ์ราชสำนักได้ภาพมุมโดรน เทศนาเถรวาทได้คลิปสั้น ไม่มีอะไรของชั้นล่างถูกแทนที่ — แต่ถูกบรรจุใหม่สำหรับฟีด',
        },
    },
    '05': {
        idx: '05',
        tag:      { en: 'STATE',                       th: 'รัฐ' },
        tagColor: '#F53838',
        name:     { en: 'Royal Brahmanism',            th: 'พราหมณ์ราชสำนัก' },
        subtitle: { en: 'Brahminical Rite of Power',   th: 'พิธีกรรมพราหมณ์แห่งอำนาจ' },
        origin: {
            en: 'Imported from the Khmer court tradition during the Ayutthaya period. Brahmin priests legitimized kingship through Vedic-derived rituals adapted into a Theravada-Buddhist political frame.',
            th: 'นำเข้าจากประเพณีราชสำนักเขมรในสมัยอยุธยา พราหมณ์ทำให้อำนาจราชาชอบธรรมผ่านพิธีกรรมที่ดัดแปลงจากพระเวท เข้ากับกรอบการเมืองพุทธเถรวาท',
        },
        function: {
            en: 'Layer of state ceremony. Coronation, plowing rite, royal funerals. Provides theatrical authority that ordinary religion cannot — visible spectacle as proof of cosmic order.',
            th: 'ชั้นพิธีของรัฐ พระราชพิธีบรมราชาภิเษก พระราชพิธีจรดพระนังคัล พระราชพิธีพระบรมศพ ให้อำนาจในเชิงละครที่ศาสนาทั่วไปทำไม่ได้ — ภาพอันโอ่อ่าที่มองเห็นได้ในฐานะหลักฐานของระเบียบจักรวาล',
        },
        interaction: {
            en: 'Sits above Theravada Buddhism without conflict — Buddhism handles personal merit, Brahmanism handles public sovereignty. They share temples, share calendars, share priests in some festivals.',
            th: 'อยู่เหนือพุทธเถรวาทโดยไม่ขัดแย้ง — พุทธจัดการบุญส่วนบุคคล พราหมณ์จัดการอำนาจอธิปไตยสาธารณะ ใช้วัดร่วม ปฏิทินร่วม บางพิธีใช้พระสงฆ์ร่วม',
        },
    },
    '04': {
        idx: '04',
        tag:      { en: 'MERCHANT',                    th: 'พ่อค้า' },
        tagColor: '#F56A38',
        name:     { en: 'Chinese Folk Religion',       th: 'ศาสนาพื้นบ้านจีน' },
        subtitle: { en: 'Guanyin / Chinese New Year',  th: 'กวนอิม / ตรุษจีน' },
        origin: {
            en: 'Imported by Sino-Thai trading families through the 19th-century migration waves. Domestic shrines, Guanyin halls, and tutelary tudigong figures embedded directly into Bangkok shophouses.',
            th: 'นำเข้าโดยตระกูลค้าขายชาวจีน-ไทย ผ่านคลื่นการอพยพในศตวรรษที่ 19 ศาลในบ้าน ศาลเจ้ากวนอิม และเทพเจ้าผู้ดูแลพื้นที่ ฝังตัวในห้องแถวกรุงเทพฯ โดยตรง',
        },
        function: {
            en: 'Commerce layer. Wealth gods, ancestor veneration, lunar holiday economy. Gives the merchant class a vocabulary for prosperity that Buddhism does not directly provide.',
            th: 'ชั้นการค้า เทพเจ้าแห่งทรัพย์ การบูชาบรรพบุรุษ เศรษฐกิจวันหยุดจันทรคติ ให้พ่อค้าวาทศัพท์แห่งความรุ่งเรืองที่พุทธไม่ได้ให้ตรงๆ',
        },
        interaction: {
            en: 'Slots in beside Theravada without competing — Chinese Folk Religion is property-and-prosperity, Buddhism is karma-and-rebirth. Many Sino-Thai homes run both daily.',
            th: 'เข้ากันได้กับเถรวาทโดยไม่แย่ง — ศาสนาพื้นบ้านจีนคือทรัพย์สินและความรุ่งเรือง พุทธคือกรรมและการเกิดใหม่ บ้านจีน-ไทยหลายหลังใช้ทั้งสองทุกวัน',
        },
    },
    '03': {
        idx: '03',
        tag:      { en: 'FORMAL OS',                   th: 'ระบบหลัก' },
        tagColor: '#385BF5',
        name:     { en: 'Theravada Buddhism',          th: 'พุทธเถรวาท' },
        subtitle: { en: 'Theravada Karmic System',     th: 'ระบบกรรมแบบเถรวาท' },
        origin: {
            en: 'Established as state religion in the 13th century via the Sukhothai court, codified through Sri Lankan textual lineages and a national ordination system.',
            th: 'สถาปนาเป็นศาสนาแห่งรัฐในศตวรรษที่ 13 ผ่านราชสำนักสุโขทัย ประมวลผ่านสายตำราจากศรีลังกา และระบบการอุปสมบทระดับชาติ',
        },
        function: {
            en: 'The formal operating system. Merit, karma, and rebirth as the underlying logic for ethics, law, education, and the life-cycle calendar (ordination, weddings, cremation).',
            th: 'ระบบปฏิบัติการหลัก บุญ กรรม และการเกิดใหม่ คือตรรกะรากฐานของจริยธรรม กฎหมาย การศึกษา และปฏิทินวงจรชีวิต (อุปสมบท แต่งงาน ฌาปนกิจ)',
        },
        interaction: {
            en: 'Provides the substrate every other layer is mounted on. Animism, Hinduism, and Chinese folk religion all operate inside a Buddhist worldview without overwriting it.',
            th: 'เป็นพื้นฐานที่ทุกชั้นอื่นถูกติดตั้งบนนั้น วิญญาณนิยม ฮินดู และศาสนาพื้นบ้านจีน ทำงานภายในโลกทัศน์พุทธโดยไม่เขียนทับ',
        },
    },
    '02': {
        idx: '02',
        tag:      { en: 'COURT',                       th: 'ราชสำนัก' },
        tagColor: '#8A38F5',
        name:     { en: 'Hindu Mythology',             th: 'เทพปกรณัมฮินดู' },
        subtitle: { en: 'Brahmin-Hindu',               th: 'พราหมณ์-ฮินดู' },
        origin: {
            en: 'Inherited from the Khmer Empire and refined through Ayutthayan court culture. Brahma, Ganesh, and Shiva were absorbed as cosmological power-brokers, not as primary objects of devotion.',
            th: 'สืบทอดจากจักรวรรดิเขมร และกลั่นผ่านวัฒนธรรมราชสำนักอยุธยา พระพรหม พระคเณศ และพระศิวะ ถูกดูดซับเป็นผู้คุมอำนาจทางจักรวาลวิทยา ไม่ใช่วัตถุแห่งความศรัทธาหลัก',
        },
        function: {
            en: 'Royal-court layer. Provides iconography, court ritual vocabulary, and a pantheon for transactional petitions — career, art, success — that Buddhism deliberately does not address.',
            th: 'ชั้นราชสำนัก ให้รูปสัญลักษณ์ วาทศัพท์พิธีราชสำนัก และวิหารเทพสำหรับคำขอเชิงธุรกรรม — อาชีพ ศิลปะ ความสำเร็จ — ที่พุทธเลี่ยงไม่กล่าวถึงโดยจงใจ',
        },
        interaction: {
            en: 'Co-resident with Theravada at the same shrines. The Erawan Shrine in Bangkok runs almost entirely on this layer while sitting in a Buddhist-majority commercial district.',
            th: 'อยู่ร่วมกับเถรวาทในศาลเดียวกัน ศาลเอราวัณกรุงเทพฯ ทำงานเกือบทั้งหมดบนชั้นนี้ ขณะตั้งอยู่ในย่านการค้าที่ส่วนใหญ่นับถือพุทธ',
        },
    },
    '01': {
        idx: '01',
        tag:      { en: 'FOUNDATION',                  th: 'รากฐาน' },
        tagColor: '#E6C878',
        name:     { en: 'Animism',                     th: 'วิญญาณนิยม' },
        subtitle: { en: 'Ghost / Superstition',        th: 'ผี / ไสยศาสตร์' },
        origin: {
            en: 'Predates every imported tradition. Indigenous belief that places, trees, rivers, and the dead retain spirits requiring acknowledgment. The spirit house predates the temple.',
            th: 'มีก่อนทุกประเพณีนำเข้า ความเชื่อพื้นเมืองว่าสถานที่ ต้นไม้ แม่น้ำ และผู้ตาย ยังคงมีวิญญาณที่ต้องการการยอมรับ ศาลพระภูมิมีก่อนวัด',
        },
        function: {
            en: 'Foundation layer. Handles the immediate and the personal — the spirit of the land, the ghost at the crossroads, the protective amulet, the inauspicious date.',
            th: 'ชั้นรากฐาน จัดการเรื่องใกล้ตัวและส่วนตัว — วิญญาณของแผ่นดิน ผีสามแยก เครื่องรางคุ้มครอง วันที่ไม่เป็นมงคล',
        },
        interaction: {
            en: 'Survives underneath everything. No subsequent layer attempted to remove it; each one absorbed and re-described its rituals in its own vocabulary.',
            th: 'อยู่รอดใต้ทุกอย่าง ไม่มีชั้นต่อมาพยายามลบ — แต่ละชั้นดูดซับและอธิบายพิธีกรรมของมันใหม่ในวาทศัพท์ของตัวเอง',
        },
    },
};

/**
 * Build inner HTML for the sticky detail panel from a layer record.
 * Text fields are translated via `t()` which reads <html lang> live, so
 * a re-render after a language switch picks up the new strings.
 */
function buildDetailHTML(layer) {
    return `
        <div class="ch01-stack-detail__head">
            <div class="ch01-stack-card__meta">
                <span class="ch01-stack-card__num">${t(LABELS.layer)} ${layer.idx}</span>
                <span class="ch01-stack-card__tag" style="--tag-color: ${layer.tagColor};">${t(layer.tag)}</span>
            </div>
            <h3 class="ch01-stack-card__name">${t(layer.name)}</h3>
            <p class="ch01-stack-card__sub">${t(layer.subtitle)}</p>
        </div>
        <hr class="ch01-stack-detail__divider">
        <div class="ch01-stack-detail__sections">
            <section>
                <h4 class="ch01-stack-detail__sub">${t(LABELS.origin)}</h4>
                <p>${t(layer.origin)}</p>
            </section>
            <section>
                <h4 class="ch01-stack-detail__sub">${t(LABELS.function)}</h4>
                <p>${t(layer.function)}</p>
            </section>
            <section>
                <h4 class="ch01-stack-detail__sub">${t(LABELS.interaction)}</h4>
                <p>${t(layer.interaction)}</p>
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
    // NOTE: the seed is STATIC (no <animate>) — animating it forces a full
    // filter re-render every frame and crushes scroll perf.
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
        <filter id="${WARP_FILTER_ID}" x="-30%" y="-40%" width="160%" height="180%" color-interpolation-filters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.06" numOctaves="2" seed="3" result="noise"/>
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
 *
 * The loop only runs while the chapter section is intersecting the viewport
 * (managed by an IntersectionObserver). Off-screen, it stops completely so
 * the rest of the page can scroll smoothly.
 */
function startSparkleLoop(state, isVisibleRef) {
    if (prefersReducedMotion()) return () => {};

    const { core, sparkles } = state;
    let raf = 0;
    let last = 0;

    const tick = (now) => {
        if (!isVisibleRef.current) {
            raf = 0;
            return;
        }
        raf = requestAnimationFrame(tick);

        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

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

            const fade = Math.sin(s.t * Math.PI);
            s.el.setAttribute('opacity', (fade * 0.95).toFixed(2));
        }
    };

    const start = () => {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(tick);
    };

    return { start, stop: () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } } };
}

/**
 * Wire up scroll + resize listeners (rAF-throttled) so the string
 * follows the sticky panel as it moves through the viewport.
 *
 * Listeners only do work while the chapter is on-screen — the rAF
 * is scheduled, but if the chapter is not visible the draw is a no-op.
 */
function bindStringUpdates(state, isVisibleRef) {
    let raf = 0;
    const schedule = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
            raf = 0;
            if (isVisibleRef.current) drawString(state);
        });
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // Initial draw — force regardless of visibility so the SVG path is set
    // before the user scrolls to the section.
    requestAnimationFrame(() => drawString(state));

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

    // Visibility gate — the expensive work (path redraw + sparkle loop)
    // only runs while the stack section is actually on-screen.
    const isVisibleRef = { current: false };
    const redrawString = bindStringUpdates(state, isVisibleRef);
    const sparkle = startSparkleLoop(state, isVisibleRef);

    const section = grid.closest('section') || grid;
    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            isVisibleRef.current = entry.isIntersecting;
            if (entry.isIntersecting) {
                redrawString();
                sparkle?.start?.();
            } else {
                sparkle?.stop?.();
            }
        }
    }, { rootMargin: '120px 0px' });
    io.observe(section);

    // Default: Layer 06 (the first / topmost card)
    setActiveLayer('06', cards, detail);
    redrawString();

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

    // Re-render the detail panel when the language toggle flips.
    // lang-toggle.js writes <html lang="en|th"> on switch, so observing
    // that attribute is the cheapest way to react without coupling to
    // a custom event.
    const langObserver = new MutationObserver(() => {
        const activeIdx = root.querySelector('[data-layer-idx][data-active="true"]')
            ?.dataset.layerIdx || '06';
        setActiveLayer(activeIdx, cards, detail);
    });
    langObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang'],
    });
}
