/**
 * ch01-scroll.js — Faith Engineered · Chapter 01 · The Stack
 *
 * Cinematic GSAP entrance animations per block, fired by ScrollTrigger
 * as each section enters the viewport.
 *
 *   • Header — eyebrow letter-spacing collapse, divider draw, headline
 *     char-by-char drop with blur clear + 3D rotateX, "Stack" em glow burst
 *   • Quote 1/2 — video bg scale-in zoom, card slide + rotateY, accent
 *     border line draw
 *   • Stack section — section label fade, 6 cards cascade like a deck
 *     of cards laying down (rotateX + y + blur)
 *   • Syncretism — 3 cards 3D flip-in
 *   • Closing — video scale-in, cue line draw
 *
 * GSAP + ScrollTrigger loaded as window.gsap / window.ScrollTrigger.
 * No Splitting.js dependency — uses a custom char/word splitter that
 * preserves nested elements (e.g. <em>) and <br> in headlines.
 *
 * Reduced motion: skip everything (everything visible at final state).
 */

const REDUCED_MOTION =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Custom char splitter — preserves nested elements ──────
// Walks text nodes, wraps each glyph in <span class="char">. Returns
// the array of char spans (in DOM order). Spaces become non-breaking
// spaces so display:inline-block doesn't collapse them.
function splitChars(el) {
    const chars = [];
    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text) return;
            const frag = document.createDocumentFragment();
            for (const c of text) {
                const span = document.createElement('span');
                span.className = 'ch01-anim-char';
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity, filter';
                span.textContent = c === ' ' ? ' ' : c;
                frag.appendChild(span);
                chars.push(span);
            }
            node.replaceWith(frag);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Walk children — preserves nested element wrappers like <em>
            Array.from(node.childNodes).forEach(walk);
        }
    }
    walk(el);
    return chars;
}

export function initCh01Scroll() {
    if (typeof window === 'undefined') return () => {};
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
        console.warn('[ch01-scroll] GSAP or ScrollTrigger missing — skipping');
        return () => {};
    }

    gsap.registerPlugin(ScrollTrigger);

    // Sync ScrollTrigger to Lenis (if running) so triggers fire on smooth-
    // scroll transforms instead of native scroll events that Lenis swallows.
    if (window.__lenis && !window.__lenis.__stRegistered) {
        window.__lenis.on('scroll', ScrollTrigger.update);
        window.__lenis.__stRegistered = true;
    }

    // Reduced motion → leave everything at final state, do nothing.
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
    const header   = document.querySelector('.ch01-header');
    const eyebrow  = document.querySelector('.ch01-header__eyebrow');
    const divider  = document.querySelector('.ch01-header__divider');
    const headline = document.querySelector('.ch01-headline');
    const subhead  = document.querySelector('.ch01-header__subhead');
    const lead     = document.querySelector('.ch01-header__lead');
    const stackEm  = headline?.querySelector('em');

    if (header) {
        // Add perspective on the headline so per-char rotateX reads as 3D.
        if (headline) {
            headline.style.perspective = '1200px';
            headline.style.transformStyle = 'preserve-3d';
        }

        const headlineChars = headline ? splitChars(headline) : [];

        // Pre-set initial states
        if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: -8, letterSpacing: '0.5em' });
        if (divider) gsap.set(divider, { scaleX: 0, transformOrigin: 'left center' });
        if (headlineChars.length) gsap.set(headlineChars, {
            opacity: 0,
            y: -80,
            rotateX: -50,
            filter: 'blur(14px)',
            transformOrigin: '50% 50% -30px',
        });
        if (subhead) gsap.set(subhead, { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (lead)    gsap.set(lead,    { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (stackEm) gsap.set(stackEm, { filter: 'drop-shadow(0 0 0px rgba(201, 169, 97, 0))' });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (eyebrow) {
            tl.to(eyebrow, {
                opacity: 1, y: 0, letterSpacing: '0.18em',
                duration: 0.9, ease: 'power3.out',
            }, 0);
        }
        if (divider) {
            tl.to(divider, {
                scaleX: 1, duration: 1.3, ease: 'expo.out',
            }, 0.15);
        }
        if (headlineChars.length) {
            tl.to(headlineChars, {
                opacity: 1, y: 0, rotateX: 0,
                filter: 'blur(0px)',
                duration: 1.1,
                ease: 'back.out(1.4)',
                stagger: 0.06,
            }, 0.4);
        }
        // "Stack" em — glow burst lands as the last char settles
        if (stackEm) {
            tl.to(stackEm, {
                filter: 'drop-shadow(0 0 18px rgba(201, 169, 97, 0.85)) drop-shadow(0 0 36px rgba(201, 169, 97, 0.45))',
                duration: 1.4,
                ease: 'power2.out',
            }, '-=0.5');
        }
        // Absolute positions so subhead/lead lift in alongside the eyebrow
        // and divider, well before the headline chars finish settling.
        if (subhead) {
            tl.to(subhead, {
                opacity: 1, y: 0, filter: 'blur(0px)',
                duration: 0.55, ease: 'power3.out',
            }, 0.25);
        }
        if (lead) {
            tl.to(lead, {
                opacity: 1, y: 0, filter: 'blur(0px)',
                duration: 0.6, ease: 'power3.out',
            }, 0.4);
        }
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 2 — Quote pair (left + right)
    // ─────────────────────────────────────────────────────
    const setupQuote = (selector, fromX) => {
        const quote = document.querySelector(selector);
        if (!quote) return;
        const video = quote.querySelector('.ch01-quote__video');
        const card  = quote.querySelector('.ch01-quote__card');

        if (video) {
            quote.style.perspective = '1200px';
            // Cinematic letterbox: bars closed, desaturated + slightly bright,
            // soft blur — a film projector starting up.
            gsap.set(video, {
                clipPath: 'inset(48% 0% 48% 0%)',
                scale: 1.08,
                opacity: 1,
                filter: 'saturate(0.35) brightness(1.18) blur(6px)',
            });
        }
        if (card) gsap.set(card, {
            opacity: 0, x: fromX, rotateY: fromX < 0 ? -18 : 18,
            transformOrigin: fromX < 0 ? 'left center' : 'right center',
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: quote,
                start: 'top 78%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (video) {
            // Letterbox bars retract first
            tl.to(video, {
                clipPath: 'inset(0% 0% 0% 0%)',
                duration: 1.4,
                ease: 'expo.out',
            }, 0);
            // Color grade + dolly settle (slower, overlapping the bar opening)
            tl.to(video, {
                scale: 1,
                filter: 'saturate(1) brightness(1) blur(0px)',
                duration: 1.8,
                ease: 'power2.out',
            }, 0.15);
        }
        if (card) tl.to(card, {
            opacity: 1, x: 0, rotateY: 0,
            duration: 1.3, ease: 'expo.out',
        }, 0.4);
    };
    setupQuote('.ch01-quote--left',  -80);
    setupQuote('.ch01-quote--right',  80);

    // ─────────────────────────────────────────────────────
    // BLOCK 3 — Stack diagram (cascade, deck-of-cards laying down)
    // ─────────────────────────────────────────────────────
    const stackSection = document.querySelector('.ch01-stack-section');
    if (stackSection) {
        const label = stackSection.querySelector('.ch01-section-label');
        const cardsList = stackSection.querySelector('.ch01-stack-cards');
        const cards = stackSection.querySelectorAll('.ch01-stack-card');
        const detailPanel =
            stackSection.querySelector('[data-stack-detail]') ||
            stackSection.querySelector('.ch01-stack-grid > :nth-child(2)');

        if (cardsList) cardsList.style.perspective = '1500px';

        if (label)  gsap.set(label,  { opacity: 0, y: 24 });
        if (cards.length) gsap.set(cards, {
            opacity: 0,
            y: -120,
            rotateX: -55,
            filter: 'blur(10px)',
            transformOrigin: '50% 100% -40px',
        });
        if (detailPanel) gsap.set(detailPanel, {
            opacity: 0, scale: 0.92, filter: 'blur(8px)',
            transformOrigin: 'center center',
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: stackSection,
                start: 'top 70%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (label) tl.to(label, {
            opacity: 1, y: 0,
            duration: 0.9, ease: 'power3.out',
        }, 0);

        if (cards.length) tl.to(cards, {
            opacity: 1, y: 0, rotateX: 0,
            filter: 'blur(0px)',
            duration: 1.1,
            ease: 'back.out(1.3)',
            stagger: 0.10,
        }, 0.3);

        if (detailPanel) tl.to(detailPanel, {
            opacity: 1, scale: 1, filter: 'blur(0px)',
            duration: 1.2, ease: 'expo.out',
        }, '-=0.6');

        // Golden string — draw the 3-strand SVG ribbon from active card to
        // detail panel using stroke-dashoffset. Layered: halo → mid → core
        // (small stagger so the bright core "trails" the wider glow).
        // The path's `d` attribute is set by stack-build.js at init (with
        // card 06 active by default), so getTotalLength() is reliable here.
        const stringSvg = stackSection.querySelector('.ch01-stack-string');
        if (stringSvg) {
            const paths = stringSvg.querySelectorAll('.ch01-stack-string__path');

            // Take the SVG's opacity off the CSS transition gate so GSAP owns it
            stringSvg.style.transition = 'none';
            stringSvg.style.opacity = '0';
            stringSvg.dataset.visible = 'true';

            paths.forEach((p) => {
                const len = p.getTotalLength?.() || 0;
                if (!len) return;
                p.style.strokeDasharray = len;
                p.style.strokeDashoffset = len;
            });

            tl.to(stringSvg, {
                opacity: 1,
                duration: 0.4, ease: 'power2.out',
            }, '-=0.25');

            if (paths.length) {
                tl.to(paths, {
                    strokeDashoffset: 0,
                    duration: 1.5,
                    ease: 'power2.out',
                    stagger: 0.12,
                    onComplete: () => {
                        // Hand control back to the per-frame loop in stack-build.js
                        // (resize / active-card change re-draws the path freely).
                        paths.forEach((p) => {
                            p.style.strokeDasharray = '';
                            p.style.strokeDashoffset = '';
                        });
                        stringSvg.style.transition = '';
                    },
                }, '<');
            }
        }
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 4 — "Why this is not syncretism" (3D flip-in)
    // ─────────────────────────────────────────────────────
    const syncSection = document.querySelector('.ch01-syncretism');
    if (syncSection) {
        const sLabel = syncSection.querySelector('.ch01-section-label');
        const sLead  = syncSection.querySelector('.ch01-syncretism__lead');
        const sCards = syncSection.querySelectorAll('.ch01-syncretism-card');

        const cardsContainer = syncSection.querySelector('.ch01-syncretism__cards');
        if (cardsContainer) cardsContainer.style.perspective = '1400px';

        if (sLabel) gsap.set(sLabel, { opacity: 0, y: 20 });
        if (sLead)  gsap.set(sLead,  { opacity: 0, y: 20, filter: 'blur(6px)' });
        if (sCards.length) gsap.set(sCards, {
            opacity: 0,
            y: 60,
            rotateY: -35,
            scale: 0.85,
            transformOrigin: 'left center',
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: syncSection,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (sLabel) tl.to(sLabel, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power3.out',
        }, 0);
        if (sLead) tl.to(sLead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.0, ease: 'power3.out',
        }, 0.1);

        if (sCards.length) tl.to(sCards, {
            opacity: 1, y: 0, rotateY: 0, scale: 1,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.18,
        }, 0.3);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 5 — Closing visual + cue line
    // ─────────────────────────────────────────────────────
    const closing = document.querySelector('.ch01-closing');
    if (closing) {
        const video = closing.querySelector('.ch01-closing__video');
        const line  = closing.querySelector('.ch01-closing__line');
        const cue   = closing.querySelector('.ch01-closing__cue');

        if (video) {
            // Cinematic emerge-from-black: dolly-in 1.22 → 1, faded + heavy
            // blur + desaturated, with a brief brightness overshoot (lens
            // bloom) before settling to neutral grade.
            gsap.set(video, {
                scale: 1.22,
                opacity: 0,
                filter: 'saturate(0.2) brightness(0.4) blur(14px)',
                transformOrigin: 'center center',
            });
        }
        if (line)  gsap.set(line,  { scaleY: 0, transformOrigin: 'top center' });
        if (cue)   gsap.set(cue,   { opacity: 0, y: 16 });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: closing,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (video) {
            // Phase 1 — fade up + dolly + clear blur (frame opens)
            tl.to(video, {
                opacity: 1,
                scale: 1.04,
                filter: 'saturate(0.9) brightness(1.35) blur(0px)',
                duration: 1.6,
                ease: 'power2.out',
            }, 0);
            // Phase 2 — lens bloom settles to neutral grade + final dolly
            tl.to(video, {
                scale: 1,
                filter: 'saturate(1) brightness(1) blur(0px)',
                duration: 1.2,
                ease: 'power2.inOut',
            }, '>-0.2');
        }
        if (line) tl.to(line, {
            scaleY: 1,
            duration: 1.0, ease: 'expo.out',
        }, 0.7);
        if (cue) tl.to(cue, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power2.out',
        }, 1.0);
    }

    // Refresh after layout settles (fonts, images) so positions are correct.
    requestAnimationFrame(() => ScrollTrigger.refresh());

    // ── Cleanup ──
    return () => {
        triggers.forEach((t) => t.kill());
        triggers.length = 0;
    };
}
