import { bindScrollChevrons } from '../utils.js';

/**
 * economy-interactions.js — Faith Engineered · Chapter 03 · The Offering Economy
 *
 * Three interactions wired here:
 *   1. Count-up reveal of the 47B big number (IntersectionObserver, one-shot)
 *   2. "What ฿B Buys" slider — drag to cycle through 4 spend tiers,
 *      each rendering a 3-card row of icons + counts
 *   3. Seasonal Peaks bar chart — 12 columns rendered on init
 *
 * prefers-reduced-motion:
 *   - Count-up shows the final value immediately (no animation)
 *   - Bar heights snap (no transition — handled in CSS)
 *   - Slider remains fully interactive
 */

const REDUCED_MOTION =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─────────────────────────────────────────────────────────
// 1. Count-up reveal
// ─────────────────────────────────────────────────────────

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function animateCountUp(el, target, duration = 2500) {
    const start = performance.now();

    const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        const value = Math.floor(target * eased);
        el.textContent = value.toLocaleString('en-US');
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function initBigNumberCountUp() {
    const el = document.querySelector('[data-count-target]');
    if (!el) return;

    const target = Number(el.dataset.countTarget);
    if (!Number.isFinite(target)) return;

    if (REDUCED_MOTION) {
        el.textContent = target.toLocaleString('en-US');
        return;
    }

    let triggered = false;
    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting || triggered) continue;
                triggered = true;
                animateCountUp(el, target, 2500);
                io.disconnect();
            }
        },
        { threshold: 0.4 }
    );
    io.observe(el);
}

// ─────────────────────────────────────────────────────────
// 2. Slider — What ฿B Buys
// ─────────────────────────────────────────────────────────

const SLIDER_TIERS = [
    {
        max: 99,
        items: [
            { count: '5×', name: 'Marigold garlands',    sub: 'Standard offering · any shrine', icon: 'flower_icon.png' },
            { count: '1×', name: 'Full incense set',     sub: '7 sticks + 2 candles',           icon: 'candle_icon.png' },
            { count: '1×', name: 'Small amulet (basic)', sub: 'Wat Pho / street vendor',        icon: 'amulet_icon.png' },
        ],
    },
    {
        max: 499,
        items: [
            { count: '1×', name: 'Silk garland',     sub: 'Premium offering · larger shrines', icon: 'flower_icon.png' },
            { count: '1×', name: 'Premium incense',  sub: 'Imported · long burn time',         icon: 'candle_icon.png' },
            { count: '1×', name: 'Mid-tier amulet',  sub: 'Blessed · single-monk lineage',     icon: 'amulet_icon.png' },
        ],
    },
    {
        max: 999,
        items: [
            { count: '1×', name: 'Gold-leaf offering', sub: 'Major-shrine standard',         icon: 'flower_icon.png' },
            { count: '1×', name: 'Ceremonial set',     sub: 'Multi-component · monk-led',    icon: 'candle_icon.png' },
            { count: '1×', name: 'Quality amulet',     sub: 'Blessed · multi-monk lineage',  icon: 'amulet_icon.png' },
        ],
    },
    {
        max: Infinity,
        items: [
            { count: '1×', name: 'Fortune teller consultation', sub: '60-min private session', icon: 'phone_icon.png'  },
            { count: '1×', name: 'Full ceremony',               sub: 'Monk + altar + chant',   icon: 'candle_icon.png' },
            { count: '1×', name: 'Premium amulet',              sub: 'Old · rare · collector', icon: 'amulet_icon.png' },
        ],
    },
];

function tierFor(value) {
    return SLIDER_TIERS.find((t) => value <= t.max) || SLIDER_TIERS[SLIDER_TIERS.length - 1];
}

function renderSliderItems(itemsEl, tier) {
    itemsEl.innerHTML = tier.items.map((it) => `
        <div class="ch03-slider-item">
            <img class="ch03-slider-item__icon" src="assets/icons/${it.icon}" alt="" aria-hidden="true">
            <div class="ch03-slider-item__body">
                <p class="ch03-slider-item__name">
                    <span class="ch03-slider-item__count">${it.count}</span> ${it.name}
                </p>
                <p class="ch03-slider-item__sub">${it.sub}</p>
            </div>
        </div>
    `).join('');
}

function initSpendSlider() {
    const input = document.querySelector('[data-slider-input]');
    const valueEl = document.querySelector('[data-slider-value]');
    const bubbleEl = document.querySelector('[data-slider-bubble]');
    const itemsEl = document.querySelector('[data-slider-items]');
    if (!input || !itemsEl) return;

    const min = Number(input.min);
    const max = Number(input.max);

    // Cache the track width — only recompute on resize, never on input.
    // Avoids forced layout reads inside the hot path.
    let trackWidth = input.getBoundingClientRect().width;
    const THUMB = 18;

    // Track only re-renders items when tier index actually changes.
    let lastTierIdx = -1;

    const update = () => {
        const v = Number(input.value);
        const fillPct = ((v - min) / (max - min)) * 100;

        input.style.setProperty('--fill', `${fillPct}%`);

        if (valueEl) valueEl.textContent = `${v.toLocaleString('en-US')}฿`;

        if (bubbleEl) {
            const px = (fillPct / 100) * (trackWidth - THUMB) + THUMB / 2;
            bubbleEl.style.setProperty('--bubble-x', `${px}px`);
        }

        // Re-render items only when crossing a tier boundary
        const tierIdx = SLIDER_TIERS.findIndex((t) => v <= t.max);
        if (tierIdx !== lastTierIdx) {
            lastTierIdx = tierIdx;
            renderSliderItems(itemsEl, SLIDER_TIERS[tierIdx]);
        }
    };

    input.addEventListener('input', update);
    window.addEventListener('resize', () => {
        trackWidth = input.getBoundingClientRect().width;
        update();
    });

    update();
}

// ─────────────────────────────────────────────────────────
// 3. Seasonal peaks bar chart
// ─────────────────────────────────────────────────────────

const SEASONS = [
    { m: 'Jan', h: 8, kind: 'gold',    peak: 'Chinese New Year' },
    { m: 'Feb', h: 5, kind: 'gray',    peak: '' },
    { m: 'Mar', h: 4, kind: 'gray',    peak: '' },
    { m: 'Apr', h: 9, kind: 'gold',    peak: 'Songkran' },
    { m: 'May', h: 4, kind: 'gray',    peak: '' },
    { m: 'Jun', h: 4, kind: 'gold',    peak: 'Buddhist Lent' },
    { m: 'Jul', h: 3, kind: 'gray',    peak: '' },
    { m: 'Aug', h: 3, kind: 'gray',    peak: '' },
    { m: 'Sep', h: 5, kind: 'gray',    peak: '' },
    { m: 'Oct', h: 6, kind: 'oxblood', peak: 'Veg Festival' },
    { m: 'Nov', h: 4, kind: 'gray',    peak: '' },
    { m: 'Dec', h: 9, kind: 'gold',    peak: 'New Year' },
];

function renderSeasonalChart() {
    const chart = document.querySelector('[data-seasonal-chart]');
    if (!chart) return;

    chart.innerHTML = SEASONS.map((s) => `
        <div class="ch03-seasonal-col">
            <span class="ch03-seasonal-col__peak">${s.peak}</span>
            <div class="ch03-seasonal-col__bar ch03-seasonal-col__bar--${s.kind}"
                 style="--h: 0%;"
                 role="img"
                 aria-label="${s.m}: relative demand ${s.h} of 10${s.peak ? ', peak: ' + s.peak : ''}"></div>
            <span class="ch03-seasonal-col__label">${s.m}</span>
        </div>
    `).join('');

    // Animate-in on first scroll into view (skipped for reduced motion)
    const bars = chart.querySelectorAll('.ch03-seasonal-col__bar');
    const setHeights = () => {
        bars.forEach((bar, i) => {
            bar.style.setProperty('--h', `${SEASONS[i].h * 10}%`);
        });
    };

    if (REDUCED_MOTION) {
        setHeights();
        return;
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
    io.observe(chart);
}

// ─────────────────────────────────────────────────────────
// 4. Value-chain horizontal scroll · chevron button
// ─────────────────────────────────────────────────────────

function initChainScroll() {
    const row = document.querySelector('[data-chain-row]');
    if (!row) return;
    const viewport = row.parentElement;
    const rightBtn = document.querySelector('[data-chain-chevron][data-direction="right"]');
    const leftBtn  = document.querySelector('[data-chain-chevron][data-direction="left"]');

    bindScrollChevrons({
        viewport,
        row,
        rightBtn,
        leftBtn,
        step: 236,    // 220 (card) + 16 (gap)
    });
}

// ─────────────────────────────────────────────────────────
// Public init
// ─────────────────────────────────────────────────────────

export function initEconomyInteractions() {
    initBigNumberCountUp();
    initSpendSlider();
    // Seasonal Peaks is owned by chapters/seasonal-peaks.js (desktop = Three.js,
    // mobile = flat bar chart). Initialized separately in main.js.
    initChainScroll();
}
