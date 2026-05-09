/**
 * ch04-scroll.js — Faith Engineered · Chapter 04 · The New Saints
 *
 * The marquee chapter. Every entrance is intentionally cinematic and
 * uses vocabulary not seen in ch01–ch03:
 *
 *   • Header — eyebrow letter-spacing, divider draws + animated golden
 *     gradient highlight, headline chars EMERGE FROM DARKNESS (scale +
 *     blur + brightness fade-in), then a diagonal LIGHT SWEEP overlay
 *     wipes across the headline, italic "S" oxblood gets crimson burst
 *   • Opening video — vignette (radial mask) opens like a camera shutter
 *   • Viral Timeline — owns its own entrance, skipped here
 *   • The Four — each saint row is its own ScrollTrigger:
 *       - Sculpture RISES from below with motion blur clearing,
 *         brightness emerges from darkness, drop-shadow glow
 *         expands then settles
 *       - Card slides in from opposite side with rotateY hinge swing
 *       - Card content cascades: name chars → tag pill scale-in →
 *         3 sections fade-up with stagger
 *   • The Pattern — 4 cards "tossed onto the table": scale 0.7 + slight
 *     random rotateZ + opacity, each settles with back.out
 *   • Pull quote — words emerge with growing text-shadow glow
 *   • Closing — video scale + cue
 *
 * GSAP + ScrollTrigger loaded as window.gsap / window.ScrollTrigger.
 */

const REDUCED_MOTION =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function splitChars(el) {
    const chars = [];
    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text) return;
            const frag = document.createDocumentFragment();
            for (const c of text) {
                const span = document.createElement('span');
                span.className = 'ch04-anim-char';
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity, filter';
                // Use NBSP (U+00A0) for spaces — a single ASCII space inside
                // an inline-block span collapses to zero width, which would
                // render "The NEW SAINTS" as "TheNEWSAINTS".
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
                    span.className = 'ch04-anim-word';
                    span.style.display = 'inline-block';
                    span.style.willChange = 'transform, opacity, filter';
                    span.textContent = tok;
                    frag.appendChild(span);
                    words.push(span);
                }
            });
            node.replaceWith(frag);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'BR') return;
            Array.from(node.childNodes).forEach(walk);
        }
    }
    walk(el);
    return words;
}

export function initCh04Scroll() {
    if (typeof window === 'undefined') return () => {};
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
        console.warn('[ch04-scroll] GSAP or ScrollTrigger missing — skipping');
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
    const sweepNodes = []; // for cleanup of injected sweep overlays

    // ─────────────────────────────────────────────────────
    // BLOCK 1 — Chapter header (cinematic emerge + light sweep)
    // ─────────────────────────────────────────────────────
    const header   = document.querySelector('.ch04-header');
    const eyebrow  = header?.querySelector('.ch04-header__eyebrow');
    const divider  = header?.querySelector('.ch04-header__divider');
    const headline = header?.querySelector('.ch04-headline');
    const subhead  = header?.querySelector('.ch04-header__subhead');
    const lead     = header?.querySelector('.ch04-header__lead');
    const oxbloodS = headline?.querySelector('.ch04-headline__s');
    // Mirror the glyph into a data-text attribute so the shimmer ::after can
    // render the same character via attr(data-text) + background-clip:text
    // (crimson sweep band follows letter shape rather than a flat rectangle).
    if (oxbloodS) {
        oxbloodS.setAttribute('data-text', oxbloodS.textContent.trim());
    }

    if (header) {
        if (headline) {
            headline.style.position = 'relative';
            headline.style.perspective = '1400px';
        }

        const headlineChars = headline ? splitChars(headline) : [];

        // Inject the light-sweep overlay
        let sweep = null;
        if (headline) {
            sweep = document.createElement('div');
            sweep.style.cssText = `
                position: absolute;
                top: -10%; bottom: -10%;
                left: -25%;
                width: 35%;
                background: linear-gradient(90deg,
                    transparent 0%,
                    rgba(255, 246, 220, 0.0) 30%,
                    rgba(255, 246, 220, 0.55) 50%,
                    rgba(255, 246, 220, 0.0) 70%,
                    transparent 100%);
                mix-blend-mode: screen;
                pointer-events: none;
                z-index: 10;
                transform: skewX(-18deg);
                will-change: left, opacity;
                opacity: 0;
            `;
            headline.appendChild(sweep);
            sweepNodes.push(sweep);
        }

        if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: -8, letterSpacing: '0.5em' });
        if (divider) gsap.set(divider, { scaleX: 0, transformOrigin: 'left center' });
        if (headlineChars.length) gsap.set(headlineChars, {
            opacity: 0,
            y: 60,
            scale: 1.4,
            filter: 'blur(18px) brightness(0.25)',
        });
        if (subhead) gsap.set(subhead, { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (lead)    gsap.set(lead,    { opacity: 0, y: 24, filter: 'blur(8px)' });
        if (oxbloodS) gsap.set(oxbloodS, { filter: 'drop-shadow(0 0 0px rgba(107, 31, 46, 0))' });

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

        if (divider) tl.to(divider, {
            scaleX: 1, duration: 1.4, ease: 'expo.out',
        }, 0.15);

        // Headline emerges from darkness
        if (headlineChars.length) tl.to(headlineChars, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px) brightness(1)',
            duration: 1.4,
            ease: 'expo.out',
            stagger: 0.06,
        }, 0.3);

        // Light sweep across headline — rides the back of the char reveal
        if (sweep) {
            tl.set(sweep, { opacity: 1 }, 0.55)
              .fromTo(sweep, { left: '-25%' }, {
                  left: '110%',
                  duration: 1.7,
                  ease: 'power2.inOut',
              }, 0.55)
              .to(sweep, { opacity: 0, duration: 0.4, ease: 'power1.in' }, '>-0.2');
        }

        // ── Italic oxblood "S" — crimson cinematic ignition ───
        // Same shape as ch02's "Luck" treatment, retuned to crimson:
        //   1. Color/text-shadow build (cream → bright crimson) — single
        //      glyph here so no per-char stagger; the layered text-shadow
        //      gives depth on the letter itself
        //   2. Container drop-shadow halo expands (3-layer crimson bloom)
        //   3. CSS .is-ignited engages a one-shot shimmer sweep across
        //      the glyph via background-clip:text (mirrors ch02 mechanic)
        if (oxbloodS) {
            tl.to(oxbloodS, {
                color: '#FF99A8',
                textShadow:
                    '0 0 6px rgba(255, 220, 220, 0.9), ' +
                    '0 0 14px rgba(220, 80, 100, 0.85), ' +
                    '0 0 28px rgba(184, 51, 74, 0.55)',
                duration: 0.6,
                ease: 'power2.out',
            }, '-=0.55');

            tl.to(oxbloodS, {
                filter:
                    'drop-shadow(0 0 14px rgba(220, 80, 100, 0.95)) ' +
                    'drop-shadow(0 0 32px rgba(184, 51, 74, 0.65)) ' +
                    'drop-shadow(0 0 56px rgba(184, 51, 74, 0.35))',
                duration: 1.6,
                ease: 'power2.out',
            }, '<');

            // Engage the CSS shimmer sweep right as the halo peaks.
            tl.add(() => oxbloodS.classList.add('is-ignited'), '<+0.15');
        }

        // Subhead + lead — absolute positions (matches ch01/ch02/ch03 pattern).
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
    // BLOCK 2 — Opening video (camera-shutter vignette)
    // ─────────────────────────────────────────────────────
    const opening = document.querySelector('.ch04-opening');
    if (opening) {
        const video = opening.querySelector('.ch04-opening__video');
        const media = opening.querySelector('.ch04-opening__media') || opening;

        if (media) gsap.set(media, {
            scale: 1.12,
            // Radial mask collapsed to a tiny dot — opens like a camera shutter.
            '--maskR': '0%',
            maskImage: 'radial-gradient(circle at center, black var(--maskR, 0%), transparent calc(var(--maskR, 0%) + 30%))',
            webkitMaskImage: 'radial-gradient(circle at center, black var(--maskR, 0%), transparent calc(var(--maskR, 0%) + 30%))',
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
            scale: 1,
            '--maskR': '100%',
            duration: 1.8,
            ease: 'power3.out',
            onComplete: () => {
                // Drop the mask once fully open — keeps repaints cheap during scroll.
                media.style.maskImage = '';
                media.style.webkitMaskImage = '';
            },
        }, 0);
        if (video) tl.to(video, {
            filter: 'saturate(1)',
            duration: 1.4,
            ease: 'power2.out',
        }, 0.3);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 3 — Viral Timeline: skipped (own entrance)
    // ─────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────
    // BLOCK 4 — THE FOUR (each saint row = its own ScrollTrigger)
    // ─────────────────────────────────────────────────────
    const saintRows = document.querySelectorAll('.ch04-saint');
    saintRows.forEach((row) => {
        const sculpture = row.querySelector('.ch04-saint__sculpture');
        const card      = row.querySelector('.ch04-saint__card');
        const name      = row.querySelector('.ch04-saint__name');
        const tag       = row.querySelector('.ch04-saint__tag');
        const sections  = row.querySelectorAll('.ch04-saint__section');
        const isArtLeft = row.classList.contains('ch04-saint--art-left');

        // Saint accent color (oxblood / gold / violet / cream) — used as the
        // GSAP-driven inline drop-shadow during the entrance reveal. This
        // inline filter overrides the stylesheet rule, so any new variant
        // MUST be added here too — otherwise it falls back to gold.
        const accentMap = {
            oxblood: 'rgba(107, 31, 46, 0.6)',
            gold:    'rgba(201, 169, 97, 0.6)',
            violet:  'rgba(138, 56, 245, 0.55)',
            cream:   'rgba(255, 255, 255, 0.6)',
        };
        let accent = 'rgba(201, 169, 97, 0.6)';
        for (const k of Object.keys(accentMap)) {
            if (row.classList.contains('ch04-saint--' + k)) {
                accent = accentMap[k];
                break;
            }
        }

        if (card) {
            card.style.perspective = '1500px';
            card.style.transformStyle = 'preserve-3d';
        }

        // Pre-states
        if (sculpture) gsap.set(sculpture, {
            opacity: 0,
            y: 90,
            scale: 0.85,
            filter: `blur(14px) brightness(0.35) drop-shadow(0 0 0px ${accent})`,
        });
        if (card) gsap.set(card, {
            opacity: 0,
            x: isArtLeft ? 80 : -80,
            rotateY: isArtLeft ? 25 : -25,
            transformOrigin: isArtLeft ? 'left center' : 'right center',
            filter: 'blur(8px)',
        });

        const nameChars = name ? splitChars(name) : [];
        if (nameChars.length) gsap.set(nameChars, {
            opacity: 0, y: 24, filter: 'blur(6px)',
        });
        if (tag)      gsap.set(tag,      { opacity: 0, scale: 0.5, transformOrigin: 'left center' });
        if (sections.length) gsap.set(sections, { opacity: 0, y: 20, filter: 'blur(6px)' });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: row,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        // Sculpture rises from darkness, glow expands
        if (sculpture) {
            tl.to(sculpture, {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: `blur(0px) brightness(1) drop-shadow(0 0 24px ${accent})`,
                duration: 1.6,
                ease: 'expo.out',
            }, 0);
        }

        // Card hinges in from the opposite side
        if (card) {
            tl.to(card, {
                opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)',
                duration: 1.3, ease: 'expo.out',
            }, 0.25);
        }

        // Name chars cascade
        if (nameChars.length) tl.to(nameChars, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.8, ease: 'power3.out',
            stagger: 0.04,
        }, 0.6);

        // Tag pill scales in
        if (tag) tl.to(tag, {
            opacity: 1, scale: 1,
            duration: 0.7, ease: 'back.out(2.0)',
        }, 0.85);

        // 3 sections cascade
        if (sections.length) tl.to(sections, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.9, ease: 'power3.out',
            stagger: 0.13,
        }, 0.95);
    });

    // ─────────────────────────────────────────────────────
    // BLOCK 5 — THE PATTERN (4 cards "tossed onto the table")
    // ─────────────────────────────────────────────────────
    const pattern = document.querySelector('.ch04-pattern');
    if (pattern) {
        const pLabel = pattern.querySelector('.ch04-section-label');
        const pLead  = pattern.querySelector('.ch04-pattern__lead');
        const pRow   = pattern.querySelector('.ch04-pattern__row');
        const pCards = pattern.querySelectorAll('.ch04-pattern-card');

        if (pRow) pRow.style.perspective = '1400px';

        if (pLabel) gsap.set(pLabel, { opacity: 0, y: 24 });
        if (pLead)  gsap.set(pLead,  { opacity: 0, y: 24, filter: 'blur(6px)' });
        if (pCards.length) {
            // Per-card random tilt (deterministic per card so re-runs match)
            pCards.forEach((c, i) => {
                c._tilt = (i % 2 === 0 ? 1 : -1) * (4 + Math.random() * 4); // ±4..8°
            });
            pCards.forEach((c) => gsap.set(c, {
                opacity: 0,
                y: 60,
                scale: 0.7,
                rotate: c._tilt,
                filter: 'blur(8px)',
            }));
        }

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: pattern,
                start: 'top 75%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (pLabel) tl.to(pLabel, {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power3.out',
        }, 0);
        if (pLead) tl.to(pLead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.0, ease: 'power3.out',
        }, 0.1);
        if (pCards.length) tl.to(pCards, {
            opacity: 1, y: 0, scale: 1, rotate: 0,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'back.out(1.4)',
            stagger: 0.18,
        }, 0.3);
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 6 — Pull quote (word emerge + growing text-shadow)
    // ─────────────────────────────────────────────────────
    const pullquote = document.querySelector('.ch04-pullquote');
    if (pullquote) {
        const p = pullquote.querySelector('p');
        if (p) {
            const words = splitWords(p);
            gsap.set(words, {
                opacity: 0,
                y: 28,
                scale: 0.9,
                filter: 'blur(12px)',
                textShadow: '0 0 0px rgba(255, 246, 220, 0)',
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
                textShadow: '0 0 18px rgba(255, 246, 220, 0.32)',
                duration: 1.4,
                ease: 'expo.out',
                stagger: 0.07,
            });
        }
    }

    // ─────────────────────────────────────────────────────
    // BLOCK 7 — Closing
    // ─────────────────────────────────────────────────────
    const closing = document.querySelector('.ch04-closing');
    if (closing) {
        const video = closing.querySelector('.ch04-closing__video');
        const line  = closing.querySelector('.ch04-closing__line');
        const cue   = closing.querySelector('.ch04-closing__cue');

        if (video) gsap.set(video, { scale: 1.18, opacity: 0.55, filter: 'blur(8px)' });
        if (line)  gsap.set(line,  { scaleX: 0, transformOrigin: 'right center' });
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
            duration: 1.0, ease: 'expo.out',
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
        sweepNodes.forEach((n) => n.parentNode && n.parentNode.removeChild(n));
        sweepNodes.length = 0;
    };
}
