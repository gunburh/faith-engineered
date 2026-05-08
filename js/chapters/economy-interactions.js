import { bindScrollChevrons } from '../utils.js';

/**
 * economy-interactions.js — Faith Engineered · Chapter 03 · The Offering Economy
 *
 * Interactions wired here:
 *   1. Count-up reveal of the ฿200B big number (IntersectionObserver, one-shot)
 *   2. Offering Spectrum — vertical 6-tier slider with active tier card
 *      (snap-to-detent, keyboard nav, mobile static fallback, bilingual)
 *   3. Value-chain horizontal scroll · chevron buttons
 *
 * Seasonal Peaks chart is owned by chapters/seasonal-peaks.js.
 *
 * prefers-reduced-motion:
 *   - Count-up shows the final value immediately (no animation)
 *   - Slider keeps snap behavior; gold-glow animation suppressed via CSS
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
// 2. Offering Spectrum (6-tier vertical slider, log-scale)
// ─────────────────────────────────────────────────────────

const SPECTRUM_TIERS = [
    {
        amount: '฿20',
        buys:  { en: 'Marigold garland',                            th: 'พวงมาลัยดอกดาวเรือง' },
        buyer: { en: 'Taxi driver · daily',                         th: 'คนขับแท็กซี่ · รายวัน' },
    },
    {
        amount: '฿100',
        buys:  { en: 'Incense set + candles',                       th: 'ชุดธูปเทียน' },
        buyer: { en: 'Office worker · weekly visit',                th: 'พนักงานออฟฟิศ · รายสัปดาห์' },
    },
    {
        amount: '฿500',
        buys:  { en: 'Silk garland for major shrine',               th: 'พวงมาลัยผ้าไหม สำหรับศาลหลัก' },
        buyer: { en: 'Middle-class family · monthly',               th: 'ครอบครัวชนชั้นกลาง · รายเดือน' },
    },
    {
        amount: '฿5,000',
        buys:  { en: "Sangkhathan offering set + monk's meal",      th: 'สังฆทานครบชุด + ภัตตาหารพระ' },
        buyer: { en: 'Upper-middle · occasional',                   th: 'ชนชั้นกลางตอนบน · ครั้งคราว' },
    },
    {
        amount: '฿50,000',
        buys:  { en: 'Phaa Pa ceremony (full ordination kit)',      th: 'งานผ้าป่า (ชุดบวชครบ)' },
        buyer: { en: 'Business owner · annual',                     th: 'เจ้าของธุรกิจ · รายปี' },
    },
    {
        amount: '฿500,000',
        buys:  { en: 'Pavilion / sala sponsorship — name engraved', th: 'ถวายศาลา · จารึกชื่อผู้ถวาย' },
        buyer: { en: 'Corporate / wealthy patron · annual',         th: 'บริษัท / ผู้มีศักดิ์ฐานะสูง · รายปี' },
    },
];

const SPECTRUM_HEADINGS = {
    buys:  { en: 'Buys',          th: 'ซื้อได้' },
    buyer: { en: 'Typical buyer', th: 'ผู้ถวายทั่วไป' },
};

const TIER_COUNT = SPECTRUM_TIERS.length;

function getCurrentLang() {
    const l = document.documentElement.lang;
    return l === 'th' ? 'th' : 'en';
}

function tierFractionFor(idx) {
    // 0 → top of rail, 1 → bottom. Tier 1 (cheapest) at top, Tier 6 (highest) at bottom.
    return idx / (TIER_COUNT - 1);
}

function renderMarkers(markersEl) {
    markersEl.innerHTML = SPECTRUM_TIERS.map((t, i) => {
        const top = tierFractionFor(i) * 100;
        return `
            <li class="ch03-spectrum-marker"
                data-spectrum-marker
                data-idx="${i}"
                style="--top: ${top}%;">
                <span class="ch03-spectrum-marker__dot" aria-hidden="true"></span>
                <span class="ch03-spectrum-marker__label">${t.amount}</span>
            </li>
        `;
    }).join('');
}

function renderActivePanel(panelEl, idx, lang) {
    const tier = SPECTRUM_TIERS[idx];
    panelEl.innerHTML = `
        <p class="ch03-spectrum-card__amount">${tier.amount}</p>
        <dl class="ch03-spectrum-card__detail">
            <dt>${SPECTRUM_HEADINGS.buys[lang]}</dt>
            <dd>${tier.buys[lang]}</dd>
            <dt>${SPECTRUM_HEADINGS.buyer[lang]}</dt>
            <dd>${tier.buyer[lang]}</dd>
        </dl>
    `;
}

function renderStaticList(listEl, lang) {
    listEl.innerHTML = SPECTRUM_TIERS.map((tier) => `
        <li class="ch03-spectrum-static__item">
            <p class="ch03-spectrum-static__amount">${tier.amount}</p>
            <div class="ch03-spectrum-static__body">
                <p class="ch03-spectrum-static__buys">${tier.buys[lang]}</p>
                <p class="ch03-spectrum-static__buyer">${tier.buyer[lang]}</p>
            </div>
        </li>
    `).join('');
}

function ariaValueText(idx, lang) {
    const tier = SPECTRUM_TIERS[idx];
    return `Tier ${idx + 1} of ${TIER_COUNT}: ${tier.amount} — ${tier.buys[lang]} (${tier.buyer[lang]})`;
}

function initOfferingSpectrum() {
    const root      = document.querySelector('[data-spectrum-interactive]');
    const trackEl   = document.querySelector('[data-spectrum-track]');
    const fillEl    = document.querySelector('[data-spectrum-fill]');
    const thumbEl   = document.querySelector('[data-spectrum-thumb]');
    const markersEl = document.querySelector('[data-spectrum-markers]');
    const panelEl   = document.querySelector('[data-spectrum-panel]');
    const valTextEl = document.querySelector('[data-spectrum-valuetext]');
    const staticEl  = document.querySelector('[data-spectrum-static]');
    if (!root || !trackEl || !thumbEl || !panelEl || !markersEl || !staticEl) return;

    let activeIdx = 0;

    const update = () => {
        const lang = getCurrentLang();
        const frac = tierFractionFor(activeIdx);
        const pct  = frac * 100;

        thumbEl.style.setProperty('--top', `${pct}%`);
        fillEl.style.setProperty('--h', `${pct}%`);

        // Mark active marker
        markersEl.querySelectorAll('[data-spectrum-marker]').forEach((m) => {
            const idx = Number(m.dataset.idx);
            m.dataset.active = String(idx === activeIdx);
        });

        // ARIA
        thumbEl.setAttribute('aria-valuenow', String(activeIdx + 1));
        const vt = ariaValueText(activeIdx, lang);
        thumbEl.setAttribute('aria-valuetext', vt);
        if (valTextEl) valTextEl.textContent = vt;

        renderActivePanel(panelEl, activeIdx, lang);
    };

    const setIdx = (idx) => {
        const clamped = Math.max(0, Math.min(TIER_COUNT - 1, idx));
        if (clamped === activeIdx) return;
        activeIdx = clamped;
        update();
    };

    // Render once
    renderMarkers(markersEl);
    renderStaticList(staticEl, getCurrentLang());
    update();

    // ── Marker click — jump to that tier ──
    markersEl.addEventListener('click', (e) => {
        const m = e.target.closest('[data-spectrum-marker]');
        if (!m) return;
        setIdx(Number(m.dataset.idx));
    });

    // ── Keyboard navigation on the thumb ──
    thumbEl.addEventListener('keydown', (e) => {
        let handled = true;
        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                setIdx(activeIdx + 1);
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                setIdx(activeIdx - 1);
                break;
            case 'Home':
                setIdx(0);
                break;
            case 'End':
                setIdx(TIER_COUNT - 1);
                break;
            case 'PageDown':
                setIdx(activeIdx + 2);
                break;
            case 'PageUp':
                setIdx(activeIdx - 2);
                break;
            default:
                handled = false;
        }
        if (handled) e.preventDefault();
    });

    // ── Pointer drag — snap to nearest tier on release; live-snap during drag ──
    let dragging = false;

    const idxFromPointerY = (clientY) => {
        const rect = trackEl.getBoundingClientRect();
        const y = clientY - rect.top;
        const frac = Math.max(0, Math.min(1, y / rect.height));
        return Math.round(frac * (TIER_COUNT - 1));
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        setIdx(idxFromPointerY(e.clientY));
    };

    const onPointerUp = (e) => {
        if (!dragging) return;
        dragging = false;
        thumbEl.releasePointerCapture?.(e.pointerId);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
    };

    thumbEl.addEventListener('pointerdown', (e) => {
        // Ignore non-primary buttons on mouse/pen
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        thumbEl.focus();
        thumbEl.setPointerCapture?.(e.pointerId);
        setIdx(idxFromPointerY(e.clientY));
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
        e.preventDefault();
    });

    // Click anywhere on the track (outside thumb) → jump to nearest tier
    trackEl.addEventListener('pointerdown', (e) => {
        if (e.target === thumbEl || thumbEl.contains(e.target)) return;
        if (e.target.closest('[data-spectrum-marker]')) return;
        setIdx(idxFromPointerY(e.clientY));
    });

    // ── Bilingual: re-render when <html lang> changes ──
    const langObserver = new MutationObserver(() => {
        renderStaticList(staticEl, getCurrentLang());
        update();
    });
    langObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang'],
    });
}

// ─────────────────────────────────────────────────────────
// 3. Value-chain horizontal scroll · chevron button
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
    initOfferingSpectrum();
    // Seasonal Peaks is owned by chapters/seasonal-peaks.js (desktop = Three.js,
    // mobile = flat bar chart). Initialized separately in main.js.
    initChainScroll();
}
