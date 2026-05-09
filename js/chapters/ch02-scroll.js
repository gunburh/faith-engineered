/**
 * ch02-scroll.js — Faith Engineered · Chapter 02 · The Geography of Luck
 *
 * Cinematic GSAP entrance per block. Vocabulary distinct from ch01 so the
 * two chapters don't feel like the same animation system reused:
 *
 *   • Header — eyebrow letter-spacing collapse, divider draws from CENTER
 *     (not left), headline char-by-char rotateY snap (compass-needle feel),
 *     "Geography of Luck" em gets a delayed gold glow burst
 *   • Opening image — clip-path inset reveal + slow scale-in + saturation
 *     grade, quote card slides up with blur clearing
 *   • Map — full-block "satellite focus": scale + blur clear, label fades,
 *     detail aside slides from right, caption fades
 *   • Shrines row — section label fade, each shrine card slides from
 *     right with stagger (cascade horizontally)
 *   • Thesis — label + lead fade, two cards 3D fold-in (rotateX -25 → 0),
 *     "2,400+" big number animates via count-up tween
 *   • Closing — video scale-in, divider scaleY draw, cue fade up
 *
 * GSAP + ScrollTrigger loaded as window.gsap / window.ScrollTrigger.
 */

const REDUCED_MOTION =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Custom char splitter — preserves nested elements (e.g. <em>) and
// returns the array of char spans in DOM order. Same helper as ch01.
function splitChars(el) {
    const chars = [];
    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text) return;
            const frag = document.createDocumentFragment();
            for (const c of text) {
                const span = document.createElement('span');
                span.className = 'ch02-anim-char';
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity, filter';
                // Use NBSP (U+00A0) for spaces — a single ASCII space inside
                // an inline-block span collapses to zero width, which would
                // render "The Geography of Luck" as "TheGeographyofLuck".
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

export function initCh02Scroll() {
    if (typeof window === 'undefined') return () => {};
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
        console.warn('[ch02-scroll] GSAP or ScrollTrigger missing — skipping');
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
    // BLOCK 1 — Header
    // ─────────────────────────────────────────────────────
    const header   = document.querySelector('.ch02-header');
    const eyebrow  = header?.querySelector('.ch02-header__eyebrow');
    const divider  = header?.querySelector('.ch02-header__divider');
    const headline = header?.querySelector('.ch02-headline');
    const subhead  = header?.querySelector('.ch02-header__subhead');
    const lead     = header?.querySelector('.ch02-header__lead');
    // .ch02-luck wraps the final word ("Luck" / "โชค") so we can ignite it
    // independently from the rest of the italicised <em>. We mirror the
    // word into a data-text attribute so the shimmer ::after can render the
    // same glyphs (via attr(data-text) + background-clip:text) regardless
    // of the active language.
    const luckSpan = headline?.querySelector('.ch02-luck');
    if (luckSpan) {
        luckSpan.setAttribute('data-text', luckSpan.textContent.trim());
    }

    if (header) {
        if (headline) {
            headline.style.perspective = '1400px';
            headline.style.transformStyle = 'preserve-3d';
        }

        const headlineChars = headline ? splitChars(headline) : [];
        // Chars that ended up inside .ch02-luck after splitChars (preserved
        // as descendants because splitChars walks INTO elements).
        const luckChars = luckSpan
            ? Array.from(luckSpan.querySelectorAll('.ch02-anim-char'))
            : [];

        if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: -8, letterSpacing: '0.5em' });
        if (divider) gsap.set(divider, { scaleX: 0, transformOrigin: 'center center' });
        if (headlineChars.length) gsap.set(headlineChars, {
            opacity: 0,
            x: -40,
            rotateY: 90,
            filter: 'blur(12px)',
            transformOrigin: '50% 50% -20px',
        });
        if (subhead) gsap.set(subhead, { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (lead)    gsap.set(lead,    { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (luckSpan) gsap.set(luckSpan, {
            filter: 'drop-shadow(0 0 0px rgba(201, 169, 97, 0))',
            letterSpacing: '0em',
        });

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

        // Divider expands from CENTER outward
        if (divider) tl.to(divider, {
            scaleX: 1, duration: 1.4, ease: 'expo.out',
        }, 0.15);

        // Char-by-char compass-needle snap (rotateY)
        if (headlineChars.length) tl.to(headlineChars, {
            opacity: 1, x: 0, rotateY: 0,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'back.out(1.6)',
            stagger: 0.045,
        }, 0.4);

        // Subhead + lead lift in alongside the eyebrow / divider — same
        // pattern as ch01: absolute positions instead of relative offsets so
        // they don't wait for the headline char-cascade to finish.
        if (subhead) tl.to(subhead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.55, ease: 'power3.out',
        }, 0.25);
        if (lead) tl.to(lead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.6, ease: 'power3.out',
        }, 0.4);

        // ── "Luck" cinematic ignition ─────────────────────────
        // Sequence (all anchored relative to the end of headline char cascade):
        //   1. Per-char ignition wave — color shift cream → gold + layered
        //      text-shadow stagger (gold sparks running across the word)
        //   2. Container halo build — drop-shadow grows around the word
        //   3. Subtle letter-spacing breath — word "expands" by ~0.02em
        //   4. Switch on .is-ignited which engages the CSS shimmer sweep
        //      (a single ::after gradient pass via CSS animation)
        if (luckChars.length) {
            tl.to(luckChars, {
                color: '#FFE4A8',
                textShadow:
                    '0 0 6px rgba(255, 244, 218, 0.9), ' +
                    '0 0 14px rgba(255, 220, 130, 0.85), ' +
                    '0 0 28px rgba(201, 169, 97, 0.55)',
                duration: 0.6,
                ease: 'power2.out',
                stagger: 0.09,                // ignition wave
            }, '-=0.55');
        }

        if (luckSpan) {
            tl.to(luckSpan, {
                filter:
                    'drop-shadow(0 0 14px rgba(255, 220, 130, 0.95)) ' +
                    'drop-shadow(0 0 32px rgba(201, 169, 97, 0.65)) ' +
                    'drop-shadow(0 0 56px rgba(201, 169, 97, 0.35))',
                letterSpacing: '0.025em',
                duration: 1.6,
                ease: 'power2.out',
            }, '<');

            // Engage the CSS shimmer sweep right as the halo peaks.
            tl.add(() => luckSpan.classList.add('is-ignited'), '<+0.15');
        }
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 2 — Opening image with quote overlay
    // (clip-path inset reveal + saturation grade + scale-in)
    // ─────────────────────────────────────────────────────
    const opening = document.querySelector('.ch02-opening');
    if (opening) {
        const img  = opening.querySelector('.ch02-opening__img');
        const card = opening.querySelector('.ch02-opening__card');

        if (img) gsap.set(img, {
            scale: 1.18,
            filter: 'saturate(0.4) blur(6px)',
            clipPath: 'inset(20% 20% 20% 20%)',
        });
        if (card) gsap.set(card, {
            opacity: 0,
            y: 30,
            filter: 'blur(10px)',
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: opening,
                start: 'top 78%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (img) tl.to(img, {
            scale: 1,
            filter: 'saturate(1) blur(0px)',
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.8,
            ease: 'power3.out',
        }, 0);

        if (card) tl.to(card, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.2, ease: 'expo.out',
        }, 0.6);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 3 — Bangkok Shrine Map (satellite focus reveal)
    // ─────────────────────────────────────────────────────
    const mapSection = document.querySelector('.ch02-mapsection');
    if (mapSection) {
        const mLabel   = mapSection.querySelector('.ch02-section-label');
        const mapEl    = mapSection.querySelector('#ch02-map');
        const detail   = mapSection.querySelector('.ch02-detail');
        const caption  = mapSection.querySelector('.ch02-map__caption');

        if (mLabel)  gsap.set(mLabel,  { opacity: 0, y: 24 });
        if (mapEl)   gsap.set(mapEl,   {
            opacity: 0, scale: 1.10, filter: 'blur(14px)',
            transformOrigin: 'center center',
        });
        if (detail)  gsap.set(detail,  { opacity: 0, x: 60, filter: 'blur(8px)' });
        if (caption) gsap.set(caption, { opacity: 0, y: 12 });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: mapSection,
                start: 'top 70%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (mLabel) tl.to(mLabel, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'power3.out',
        }, 0);

        // "Satellite focus" — map zooms out + blurs to clarity
        if (mapEl) tl.to(mapEl, {
            opacity: 1, scale: 1, filter: 'blur(0px)',
            duration: 1.6, ease: 'power3.out',
        }, 0.2);

        if (detail) tl.to(detail, {
            opacity: 1, x: 0, filter: 'blur(0px)',
            duration: 1.2, ease: 'expo.out',
        }, '-=0.8');

        if (caption) tl.to(caption, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power2.out',
        }, '-=0.4');
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 4 — All 6 Shrines row (horizontal cascade)
    // ─────────────────────────────────────────────────────
    const shrines = document.querySelector('.ch02-shrines');
    if (shrines) {
        const sLabel = shrines.querySelector('.ch02-section-label');
        const row    = shrines.querySelector('.ch02-shrines__row');

        if (sLabel) gsap.set(sLabel, { opacity: 0, y: 24 });

        // ── Pre-hide cards SYNCHRONOUSLY at module init ──────────
        // initGeographyMap() runs immediately before this in main.js and
        // populates the row, so the cards are already in the DOM by now.
        // Hiding them here (before the browser's first post-init paint)
        // prevents the FOUC where cards briefly show in their final
        // coverflow positions and then "blink" back into the entrance.
        const initialCards = row ? Array.from(row.querySelectorAll(':scope > li')) : [];
        if (initialCards.length) {
            gsap.set(initialCards, {
                '--offset': 0,
                '--abs': 0,
                opacity: 0,
                filter: 'blur(10px) brightness(0.5)',
            });
        }

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: shrines,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
                onEnter: () => {
                    // ── "Center-out deck fan" entrance ──────────────────
                    // Niche to this coverflow: instead of the usual stagger
                    // (which conflicts with CSS-owned 3D transforms), we
                    // animate the CSS custom property `--offset` on each
                    // card directly. The CSS calc() formulas in the
                    // stylesheet re-evaluate every frame as --offset
                    // changes, so translateX/rotateY/scale animate
                    // smoothly without GSAP touching `transform` itself.
                    //
                    // Reveal order is center-out, not left-to-right:
                    //   • active (offset 0)  materialises first with a
                    //     gold brightness overshoot
                    //   • ±1 cards fan out simultaneously
                    //   • ±2 cards fan out simultaneously, slightly later
                    //   • |offset| ≥ 3 are seated without animation
                    //
                    // After the timeline completes we clear the inline
                    // opacity/filter styles so the CSS opacity calc
                    // (1 − 0.30·|offset|) regains control for the
                    // post-entrance carousel interactions.
                    const cards = row ? Array.from(row.querySelectorAll(':scope > li')) : [];
                    if (!cards.length) return;

                    // Find active card (set by initGeographyMap on init)
                    const activeIdx = cards.findIndex((c) =>
                        c.querySelector('[data-shrine-id][data-active="true"]'));
                    const safeActive = activeIdx >= 0 ? activeIdx : 0;

                    // Pre-compute target coverflow position per card
                    const targets = cards.map((c, i) => {
                        const offset = i - safeActive;
                        return { card: c, offset, abs: Math.abs(offset) };
                    });

                    // Re-assert the stacked-hidden state in case anything
                    // (e.g. activateShrine) ran between init and now and
                    // mutated the per-card vars.
                    gsap.set(cards, {
                        '--offset': 0,
                        '--abs': 0,
                        opacity: 0,
                        filter: 'blur(10px) brightness(0.5)',
                    });

                    // Hidden cards (|offset| > 2) — place at target without
                    // animation; they stay invisible.
                    targets.filter((t) => t.abs > 2).forEach((t) => {
                        gsap.set(t.card, {
                            '--offset': t.offset,
                            '--abs': t.abs,
                        });
                        t.card.dataset.hidden = 'true';
                    });

                    const tl2 = gsap.timeline({ delay: 0.15 });

                    // Phase 1 — active card materialises with gold overshoot
                    const active = targets.find((t) => t.offset === 0)?.card;
                    if (active) {
                        tl2.to(active, {
                            opacity: 1,
                            filter: 'blur(0px) brightness(1.35) drop-shadow(0 0 22px rgba(201, 169, 97, 0.55))',
                            duration: 0.7,
                            ease: 'power3.out',
                        }, 0)
                           .to(active, {
                               filter: 'blur(0px) brightness(1)',
                               duration: 0.5,
                               ease: 'power2.inOut',
                           }, 0.55);
                    }

                    // Phase 2 — ±1 fan out (left + right move outward together)
                    targets.filter((t) => t.abs === 1).forEach((t) => {
                        tl2.to(t.card, {
                            '--offset': t.offset,
                            '--abs': t.abs,
                            opacity: 1,
                            filter: 'blur(0px) brightness(1)',
                            duration: 0.9,
                            ease: 'expo.out',
                        }, 0.25);
                    });

                    // Phase 3 — ±2 fan out further, slightly delayed
                    targets.filter((t) => t.abs === 2).forEach((t) => {
                        tl2.to(t.card, {
                            '--offset': t.offset,
                            '--abs': t.abs,
                            opacity: 1,
                            filter: 'blur(0px) brightness(1)',
                            duration: 1.0,
                            ease: 'expo.out',
                        }, 0.45);
                    });

                    // Cleanup — hand opacity + filter back to CSS calc
                    tl2.add(() => {
                        cards.forEach((c) => {
                            c.style.opacity = '';
                            c.style.filter = '';
                        });
                    });
                },
            }),
        });

        if (sLabel) tl.to(sLabel, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'power3.out',
        }, 0);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 5 — The Infrastructure Thesis
    // (label + lead fade, 2 cards 3D fold-in, "2,400+" count-up)
    // ─────────────────────────────────────────────────────
    const thesis = document.querySelector('.ch02-thesis');
    if (thesis) {
        const tLabel = thesis.querySelector('.ch02-section-label');
        const tLead  = thesis.querySelector('.ch02-thesis__lead');
        const cards  = thesis.querySelectorAll('.ch02-thesis__card');
        const count  = thesis.querySelector('.ch02-thesis__count');

        const row = thesis.querySelector('.ch02-thesis__row');
        if (row) row.style.perspective = '1500px';

        if (tLabel) gsap.set(tLabel, { opacity: 0, y: 24 });
        if (tLead)  gsap.set(tLead,  { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (cards.length) gsap.set(cards, {
            opacity: 0,
            y: 50,
            rotateX: -28,
            scale: 0.9,
            filter: 'blur(8px)',
            transformOrigin: '50% 0% 0',
        });
        if (count) {
            // Cache the original "2,400+" markup, replace with starting "0"
            count.dataset.finalText = count.textContent.trim(); // "2,400+"
            count.textContent = '0';
        }

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: thesis,
                start: 'top 70%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (tLabel) tl.to(tLabel, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power3.out',
        }, 0);
        if (tLead) tl.to(tLead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.0, ease: 'power3.out',
        }, 0.1);

        if (cards.length) tl.to(cards, {
            opacity: 1, y: 0, rotateX: 0, scale: 1,
            filter: 'blur(0px)',
            duration: 1.3,
            ease: 'expo.out',
            stagger: 0.18,
        }, 0.3);

        // Count-up animation — runs alongside card fold-in
        if (count) {
            const finalText = count.dataset.finalText || '2,400+';
            // Extract numeric value (strip commas, plus, etc)
            const target = parseInt(finalText.replace(/[^0-9]/g, ''), 10) || 2400;
            const suffix = finalText.match(/[^0-9,]+$/)?.[0] || '';
            const counter = { val: 0 };
            tl.to(counter, {
                val: target,
                duration: 2.0,
                ease: 'power2.out',
                onUpdate: () => {
                    const v = Math.round(counter.val);
                    count.textContent = v.toLocaleString('en-US') + suffix;
                },
                onComplete: () => {
                    count.textContent = finalText;
                },
            }, 0.5);
        }
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 6 — Closing
    // ─────────────────────────────────────────────────────
    const closing = document.querySelector('.ch02-closing');
    if (closing) {
        const video = closing.querySelector('.ch02-closing__video');
        const line  = closing.querySelector('.ch02-closing__line');
        const cue   = closing.querySelector('.ch02-closing__cue');

        if (video) gsap.set(video, { scale: 1.18, opacity: 0.55, filter: 'blur(8px)' });
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
        if (line) tl.to(line, {
            scaleX: 1,
            duration: 1.2, ease: 'expo.out',
        }, 0.5);
        if (cue) tl.to(cue, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'power2.out',
        }, 0.8);
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
        triggers.forEach((t) => t.kill());
        triggers.length = 0;
    };
}
