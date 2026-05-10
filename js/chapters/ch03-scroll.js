/**
 * ch03-scroll.js — Faith Engineered · Chapter 03 · The Offering Economy
 *
 * Cinematic GSAP entrance per block. Vocabulary distinct from ch01/ch02
 * — chapter is about money & numbers, so the language leans into
 * coin-toss / scale-pop / bar-fill / count-up.
 *
 *   • Header — divider draws from RIGHT, headline chars do a coin-toss
 *     (scale 0.3→1 + random rotate→0 + blur clear), "Offering Economy"
 *     em gets gold glow burst
 *   • Opening video — horizontal CURTAIN reveal (clip-path top/bottom
 *     inset → 0) + saturation grade
 *   • Key Metrics — each number counts up from 0 with scale-pop +
 *     glow burst
 *   • Parallel Economy — 2 figures BOOK-OPEN simultaneously
 *     (left rotateY -75 from right hinge, right rotateY +75 from left)
 *   • Pull quote — large grand reveal: scale 0.92 + blur clear with
 *     word-by-word stagger
 *   • Comparative Scale — bar FILL race: each row's `--w` animates 0→final%
 *     with stagger; value position rides the bar end
 *   • Value Chain — left-to-right cascade of steps + separators
 *   • Offering Spectrum — card lift + rail fade + 6 markers stagger in,
 *     gold thumb fade-in with glow pulse, active tier panel slides from right
 *   • Seasonal Peaks — owns its own entrance, skipped here
 *   • Closing — video scale-in + cue
 *
 * The ฿200B big number block is owned by economy-interactions.js's existing
 * count-up logic — we only animate the surrounding caption, not the count.
 *
 * GSAP + ScrollTrigger loaded as window.gsap / window.ScrollTrigger.
 */

const REDUCED_MOTION =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Grapheme-aware splitter — Thai clusters (ช + ◌ั + ◌้) stay as ONE
// segment; per-codepoint splitting puts combining marks in their own
// inline-block which breaks mkmk shaping. Same helper shape as ch01.
const _segmenter =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;
const _toGraphemes = (text) =>
    _segmenter ? Array.from(_segmenter.segment(text), s => s.segment) : [...text];

function splitChars(el) {
    const chars = [];
    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text) return;
            const frag = document.createDocumentFragment();
            for (const c of _toGraphemes(text)) {
                const span = document.createElement('span');
                span.className = 'ch03-anim-char';
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity, filter';
                // Use NBSP (U+00A0) for spaces — a single ASCII space inside
                // an inline-block span collapses to zero width, which would
                // render "The Offering Economy" as "TheOfferingEconomy".
                span.textContent = c === ' ' ? ' ' : c;
                frag.appendChild(span);
                chars.push(span);
            }
            node.replaceWith(frag);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(walk);
        }
    }
    walk(el);
    return chars;
}

// Split an element into word-spans (preserves <br> and inline children).
function splitWords(el) {
    const words = [];
    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text || !text.trim()) return;
            const tokens = text.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            tokens.forEach((tok) => {
                if (!tok) return;
                if (/^\s+$/.test(tok)) {
                    frag.appendChild(document.createTextNode(tok));
                } else {
                    const span = document.createElement('span');
                    span.className = 'ch03-anim-word';
                    span.style.display = 'inline-block';
                    span.style.willChange = 'transform, opacity, filter';
                    span.textContent = tok;
                    frag.appendChild(span);
                    words.push(span);
                }
            });
            node.replaceWith(frag);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Don't recurse into <br>; preserve it.
            if (node.tagName === 'BR') return;
            Array.from(node.childNodes).forEach(walk);
        }
    }
    walk(el);
    return words;
}

export function initCh03Scroll() {
    if (typeof window === 'undefined') return () => {};
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
        console.warn('[ch03-scroll] GSAP or ScrollTrigger missing — skipping');
        return () => {};
    }

    gsap.registerPlugin(ScrollTrigger);

    if (window.__lenis && !window.__lenis.__stRegistered) {
        window.__lenis.on('scroll', ScrollTrigger.update);
        window.__lenis.__stRegistered = true;
    }

    if (REDUCED_MOTION) return () => {};

    const triggers = [];
    const trigger = (vars) => {
        const t = ScrollTrigger.create(vars);
        triggers.push(t);
        return t;
    };

    // ─────────────────────────────────────────────────────
    // BLOCK 1 — Chapter header
    // ─────────────────────────────────────────────────────
    const header   = document.querySelector('.ch03-header');
    const eyebrow  = header?.querySelector('.ch03-header__eyebrow');
    const divider  = header?.querySelector('.ch03-header__divider');
    const headline = header?.querySelector('.ch03-headline');
    const subhead  = header?.querySelector('.ch03-header__subhead');
    const lead     = header?.querySelector('.ch03-header__lead');
    const offerEm  = headline?.querySelector('em');
    // TH copy: "<em>เศรษฐกิจแห่งการบูชา</em>" — em wraps the whole
    // headline, so the gold halo casts over Thai diacritics and visually
    // overlaps the tone marks. Gate the em glow to EN only.
    const skipEmGlow = document.documentElement.lang === 'th';

    if (header) {
        if (headline) {
            headline.style.perspective = '1400px';
            headline.style.transformStyle = 'preserve-3d';
        }

        const headlineChars = headline ? splitChars(headline) : [];
        // Pre-compute one random spin per char so it's deterministic per char,
        // not changing every render.
        headlineChars.forEach((c) => {
            c._spin = (Math.random() - 0.5) * 90; // -45..45 deg
        });

        if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: -8, letterSpacing: '0.5em' });
        if (divider) gsap.set(divider, { scaleX: 0, transformOrigin: 'right center' });
        if (headlineChars.length) headlineChars.forEach((c) => {
            gsap.set(c, {
                opacity: 0,
                scale: 0.3,
                rotate: c._spin,
                filter: 'blur(12px)',
            });
        });
        if (subhead) gsap.set(subhead, { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (lead)    gsap.set(lead,    { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (offerEm && !skipEmGlow) gsap.set(offerEm, { filter: 'drop-shadow(0 0 0px rgba(201, 169, 97, 0))' });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (eyebrow) tl.to(eyebrow, {
            opacity: 1, y: 0, letterSpacing: '0.18em',
            duration: 0.9, ease: 'power3.out',
        }, 0);

        // Divider draws from RIGHT
        if (divider) tl.to(divider, {
            scaleX: 1, duration: 1.3, ease: 'expo.out',
        }, 0.15);

        // Coin-toss char reveal — scale + spin + blur clear
        if (headlineChars.length) tl.to(headlineChars, {
            opacity: 1,
            scale: 1,
            rotate: 0,
            filter: 'blur(0px)',
            duration: 1.0,
            ease: 'back.out(1.7)',
            stagger: 0.05,
        }, 0.4);

        if (offerEm && !skipEmGlow) tl.to(offerEm, {
            filter: 'drop-shadow(0 0 18px rgba(201, 169, 97, 0.85)) drop-shadow(0 0 36px rgba(201, 169, 97, 0.45))',
            duration: 1.5,
            ease: 'power2.out',
        }, '-=0.5');

        // Absolute positions (matches ch01/ch02 pattern) so subhead + lead
        // lift in alongside the eyebrow / divider — no waiting for the
        // coin-toss char cascade to finish.
        if (subhead) tl.to(subhead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.55, ease: 'power3.out',
        }, 0.25);
        if (lead) tl.to(lead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.6, ease: 'power3.out',
        }, 0.4);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 2 — Opening video (curtain reveal: top + bottom)
    // ─────────────────────────────────────────────────────
    const opening = document.querySelector('.ch03-opening');
    if (opening) {
        const video = opening.querySelector('.ch03-opening__video');
        const media = opening.querySelector('.ch03-opening__media') || opening;

        if (media) gsap.set(media, {
            clipPath: 'inset(50% 0% 50% 0%)',
            scale: 1.08,
        });
        if (video) gsap.set(video, { filter: 'saturate(0.5)' });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: opening,
                start: 'top 78%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (media) tl.to(media, {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1,
            duration: 1.6,
            ease: 'power3.out',
        }, 0);
        if (video) tl.to(video, {
            filter: 'saturate(1)',
            duration: 1.4,
            ease: 'power2.out',
        }, 0.2);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 3 — Big number 47B (count handled by economy-interactions;
    //          we only animate the surrounding caption.)
    // ─────────────────────────────────────────────────────
    const bignum = document.querySelector('.ch03-bignum');
    if (bignum) {
        const caption = bignum.querySelector('.ch03-bignum__caption');
        if (caption) gsap.set(caption, { opacity: 0, y: 30, filter: 'blur(8px)' });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: bignum,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (caption) tl.to(caption, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.1, ease: 'power3.out',
        }, 0.4);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 4 — Key Metrics (3 stat tiles with count-up)
    // ─────────────────────────────────────────────────────
    const metricsSection = document.querySelector('.ch03-metrics-section');
    if (metricsSection) {
        const mLabel  = metricsSection.querySelector('.ch03-section-label');
        const metrics = metricsSection.querySelectorAll('.ch03-metric');

        if (mLabel) gsap.set(mLabel, { opacity: 0, y: 24 });
        if (metrics.length) gsap.set(metrics, {
            opacity: 0, y: 50, scale: 0.85, filter: 'blur(8px)',
        });

        // Cache each metric's number text so we can count it up.
        const metricCounts = [];
        metrics.forEach((m) => {
            const numEl = m.querySelector('.ch03-metric__num');
            if (!numEl) return;
            // First text node = the number, then a <span> with unit.
            const textNode = numEl.firstChild;
            if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
            const target = parseInt(textNode.textContent.replace(/[^0-9]/g, ''), 10);
            if (!Number.isFinite(target)) return;
            textNode.textContent = '0';
            metricCounts.push({ textNode, target });
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: metricsSection,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (mLabel) tl.to(mLabel, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power3.out',
        }, 0);
        if (metrics.length) tl.to(metrics, {
            opacity: 1, y: 0, scale: 1,
            filter: 'blur(0px)',
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.18,
        }, 0.2);

        // Count-up per metric runs alongside the metric tile entrance.
        metricCounts.forEach((mc, i) => {
            const counter = { val: 0 };
            tl.to(counter, {
                val: mc.target,
                duration: 1.6,
                ease: 'power2.out',
                onUpdate: () => {
                    mc.textNode.textContent = String(Math.round(counter.val));
                },
                onComplete: () => {
                    mc.textNode.textContent = String(mc.target);
                },
            }, 0.4 + i * 0.18);
        });
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 5 — The Parallel Economy (2 figures BOOK-OPEN)
    // ─────────────────────────────────────────────────────
    const parallel = document.querySelector('.ch03-parallel');
    if (parallel) {
        const pLabel = parallel.querySelector('.ch03-section-label');
        const pair   = parallel.querySelector('.ch03-parallel__pair');
        const items  = parallel.querySelectorAll('.ch03-parallel__item');

        if (pair) pair.style.perspective = '1600px';

        if (pLabel) gsap.set(pLabel, { opacity: 0, y: 24 });
        if (items.length >= 2) {
            gsap.set(items[0], {
                opacity: 0, rotateY: -75,
                transformOrigin: 'right center',
                filter: 'blur(10px)',
            });
            gsap.set(items[1], {
                opacity: 0, rotateY: 75,
                transformOrigin: 'left center',
                filter: 'blur(10px)',
            });
        }

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: parallel,
                start: 'top 70%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (pLabel) tl.to(pLabel, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'power3.out',
        }, 0);
        if (items.length) tl.to(items, {
            opacity: 1,
            rotateY: 0,
            filter: 'blur(0px)',
            duration: 1.6,
            ease: 'expo.out',
        }, 0.2);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 6 — Pull quote (grand word-by-word reveal)
    // ─────────────────────────────────────────────────────
    const pullquote = document.querySelector('.ch03-pullquote');
    if (pullquote) {
        const p = pullquote.querySelector('p');
        if (p) {
            const words = splitWords(p);
            gsap.set(words, {
                opacity: 0,
                y: 24,
                scale: 0.92,
                filter: 'blur(10px)',
            });

            const tl = gsap.timeline({
                scrollTrigger: trigger({
                    trigger: pullquote,
                    start: 'top 80%',
                    toggleActions: 'play none none none',
                    once: true,
                }),
            });
            tl.to(words, {
                opacity: 1, y: 0, scale: 1,
                filter: 'blur(0px)',
                duration: 1.3,
                ease: 'expo.out',
                stagger: 0.06,
            });
        }
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 7 — Comparative Scale (bar FILL race)
    // ─────────────────────────────────────────────────────
    const compare = document.querySelector('.ch03-compare');
    if (compare) {
        const cLabel = compare.querySelector('.ch03-section-label');
        const rows   = compare.querySelectorAll('.ch03-compare__row');

        if (cLabel) gsap.set(cLabel, { opacity: 0, y: 24 });

        // Cache + zero out each fill's --w
        const bars = [];
        rows.forEach((row) => {
            const fill = row.querySelector('.ch03-compare__fill');
            const value = row.querySelector('.ch03-compare__value');
            const finalW = fill?.style.getPropertyValue('--w') || '0%';
            const finalPos = value?.style.getPropertyValue('--pos') || finalW;
            if (fill) fill.style.setProperty('--w', '0%');
            if (value) value.style.setProperty('--pos', '0%');
            bars.push({ row, fill, value, finalW, finalPos });
        });

        if (rows.length) gsap.set(rows, { opacity: 0, x: -30 });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: compare,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (cLabel) tl.to(cLabel, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power3.out',
        }, 0);

        if (rows.length) tl.to(rows, {
            opacity: 1, x: 0,
            duration: 0.8, ease: 'power3.out',
            stagger: 0.12,
        }, 0.2);

        // Each bar fills at its row's stagger start
        bars.forEach((b, i) => {
            if (b.fill) tl.to(b.fill, {
                '--w': b.finalW,
                duration: 1.4,
                ease: 'expo.out',
            }, 0.4 + i * 0.18);
            if (b.value) tl.to(b.value, {
                '--pos': b.finalPos,
                duration: 1.4,
                ease: 'expo.out',
            }, 0.4 + i * 0.18);
        });
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 8 — Value Chain (left-to-right cascade)
    // ─────────────────────────────────────────────────────
    const chain = document.querySelector('.ch03-chain');
    if (chain) {
        const chLabel = chain.querySelector('.ch03-section-label');
        const chLead  = chain.querySelector('.ch03-chain__lead');
        const steps   = chain.querySelectorAll('.ch03-chain-step, .ch03-chain-step__sep');

        if (chLabel) gsap.set(chLabel, { opacity: 0, y: 24 });
        if (chLead)  gsap.set(chLead,  { opacity: 0, y: 24, filter: 'blur(6px)' });
        if (steps.length) gsap.set(steps, { opacity: 0, x: 50, filter: 'blur(6px)' });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: chain,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (chLabel) tl.to(chLabel, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power3.out',
        }, 0);
        if (chLead) tl.to(chLead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.0, ease: 'power3.out',
        }, 0.1);
        if (steps.length) tl.to(steps, {
            opacity: 1, x: 0, filter: 'blur(0px)',
            duration: 0.9, ease: 'expo.out',
            stagger: 0.08,
        }, 0.3);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 9 — Offering Spectrum (rail draw + markers + thumb + panel)
    // ─────────────────────────────────────────────────────
    // Markers (.ch03-spectrum-marker) and the thumb (.ch03-spectrum__thumb)
    // carry CSS transforms that are critical for positioning (translateY(-50%)
    // on markers, translate(-50%, -50%) rotate(45deg) on the thumb diamond).
    // We only animate opacity / filter on those — never transform — to avoid
    // GSAP overriding their layout transforms.
    const spectrum = document.querySelector('.ch03-spectrum');
    if (spectrum) {
        const sLabel   = spectrum.querySelector('.ch03-section-label');
        const sLead    = spectrum.querySelector('.ch03-spectrum__lead');
        const sCard    = spectrum.querySelector('.ch03-spectrum__card');
        const railWrap = spectrum.querySelector('.ch03-spectrum__rail-wrap');
        const markers  = spectrum.querySelectorAll('.ch03-spectrum-marker');
        const thumb    = spectrum.querySelector('.ch03-spectrum__thumb');
        const panel    = spectrum.querySelector('.ch03-spectrum__panel');
        const footer   = spectrum.querySelector('.ch03-spectrum__footer');

        if (sLabel)   gsap.set(sLabel,   { opacity: 0, y: 24 });
        if (sLead)    gsap.set(sLead,    { opacity: 0, y: 18 });
        if (sCard)    gsap.set(sCard,    { opacity: 0, y: 32 });
        if (railWrap) gsap.set(railWrap, { opacity: 0 });
        if (markers.length) gsap.set(markers, { opacity: 0 });          // opacity-only — preserves translateY(-50%)
        if (thumb)    gsap.set(thumb,    { opacity: 0 });               // opacity-only — preserves rotate/translate
        if (panel)    gsap.set(panel,    { opacity: 0, x: 40 });
        if (footer)   gsap.set(footer,   { opacity: 0 });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: spectrum,
                start: 'top 70%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (sLabel) tl.to(sLabel, {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power3.out',
        }, 0);

        if (sLead) tl.to(sLead, {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power3.out',
        }, 0.1);

        if (sCard) tl.to(sCard, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'expo.out',
        }, 0.2);

        // Rail fades up vertically (~600ms ease-out)
        if (railWrap) tl.to(railWrap, {
            opacity: 1,
            duration: 0.6, ease: 'power2.out',
        }, 0.45);

        // 6 tier markers stagger in (~80ms between each)
        if (markers.length) tl.to(markers, {
            opacity: 1,
            duration: 0.45, ease: 'power3.out',
            stagger: 0.08,
        }, 0.55);

        // Thumb fades in last
        if (thumb) tl.to(thumb, {
            opacity: 1,
            duration: 0.5, ease: 'power2.out',
        }, 1.1);

        // Subtle gold glow pulse on the thumb — uses filter so the diamond's
        // rotate(45deg) + translate(-50%, -50%) transform stays untouched.
        if (thumb) tl.to(thumb, {
            filter: 'drop-shadow(0 0 22px rgba(201, 169, 97, 1))',
            duration: 0.45, ease: 'power2.out',
            yoyo: true, repeat: 1,
        }, '>-0.05')
        .set(thumb, { filter: '' });

        // Active tier card slides in from the right
        if (panel) tl.to(panel, {
            opacity: 1, x: 0,
            duration: 0.85, ease: 'expo.out',
        }, 0.65);

        if (footer) tl.to(footer, {
            opacity: 1,
            duration: 0.5, ease: 'power2.out',
        }, 1.2);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 10 — Seasonal Peaks: skipped (owns its own entrance)
    // BLOCK 11 — Closing
    // ─────────────────────────────────────────────────────
    const closing = document.querySelector('.ch03-closing');
    if (closing) {
        const video = closing.querySelector('.ch03-closing__video');
        const quote = closing.querySelector('.ch03-closing__quote');
        const line  = closing.querySelector('.ch03-closing__line');
        const cue   = closing.querySelector('.ch03-closing__cue');

        if (video) gsap.set(video, { scale: 1.15, opacity: 0.55, filter: 'blur(8px)' });
        if (quote) gsap.set(quote, { opacity: 0, y: 30, filter: 'blur(8px)' });
        if (line)  gsap.set(line,  { scaleX: 0, transformOrigin: 'left center' });
        if (cue)   gsap.set(cue,   { opacity: 0, y: 18 });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: closing,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (video) tl.to(video, {
            scale: 1, opacity: 1, filter: 'blur(0px)',
            duration: 1.8, ease: 'power3.out',
        }, 0);
        if (quote) tl.to(quote, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.2, ease: 'power3.out',
        }, 0.5);
        if (line) tl.to(line, {
            scaleX: 1,
            duration: 1.0, ease: 'expo.out',
        }, 0.9);
        if (cue) tl.to(cue, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'power2.out',
        }, 1.1);
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
        triggers.forEach((t) => t.kill());
        triggers.length = 0;
    };
}
