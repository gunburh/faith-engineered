/**
 * ch05-scroll.js — Faith Engineered · Sources & About
 *
 * The closing section. Where ch01–ch04 are escalating spectacle, ch05 is
 * the elegant denouement — refined fades, slow exhale, gentle glow.
 * Vocabulary unique to ch05:
 *
 *   • Header — eyebrow letter-spacing, divider scaleX from center,
 *     LOGO clip-path opens from center outward + scale + saturation
 *     grade-in + cream drop-shadow glow rises after settle
 *   • Left column blocks — each block eyebrow fades + content
 *     reveals with word-by-word cascade or chars
 *   • Accordion rows — fade + slide in sequence (each row 0.07s apart)
 *   • Right column cards — drop from above with slight tilt, stack-of-
 *     papers feel; final video reveals with clip-path inset
 *   • Visual Designs / Typography Credits — eyebrow fade, list items
 *     line-by-line slide-in (slow, deliberate — like a credits roll)
 *
 * Easing palette skewed toward power3/expo for elegance (no back, no
 * elastic) — closing chapter, not opening fanfare.
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
                span.className = 'ch05-anim-char';
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity, filter';
                span.textContent = c === ' ' ? ' ' : c;
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
                    span.className = 'ch05-anim-word';
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

export function initCh05Scroll() {
    if (typeof window === 'undefined') return () => {};
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
        console.warn('[ch05-scroll] GSAP or ScrollTrigger missing — skipping');
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
    // Header — eyebrow + divider + LOGO grand reveal
    // ─────────────────────────────────────────────────────
    const header   = document.querySelector('.ch05-header');
    const eyebrow  = header?.querySelector('.ch05-header__eyebrow');
    const divider  = header?.querySelector('.ch05-header__divider');
    const logoWrap = header?.querySelector('.ch05-header__logo');
    const logoImg  = header?.querySelector('.ch05-header__logo-img');

    if (header) {
        if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: -8, letterSpacing: '0.5em' });
        if (divider) gsap.set(divider, { scaleX: 0, transformOrigin: 'center center' });
        if (logoImg) gsap.set(logoImg, {
            opacity: 0,
            scale: 1.12,
            // Closed shutter — opens from center outward.
            clipPath: 'inset(50% 50% 50% 50%)',
            filter: 'saturate(0.4) blur(8px) drop-shadow(0 0 0px rgba(255, 246, 220, 0))',
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

        if (divider) tl.to(divider, {
            scaleX: 1, duration: 1.4, ease: 'expo.out',
        }, 0.15);

        // Logo opens like a shutter from the center outward, then a
        // delayed cream glow rises around it.
        if (logoImg) {
            tl.to(logoImg, {
                opacity: 1,
                scale: 1,
                clipPath: 'inset(0% 0% 0% 0%)',
                filter: 'saturate(1) blur(0px) drop-shadow(0 0 0px rgba(255, 246, 220, 0))',
                duration: 1.8,
                ease: 'power3.out',
            }, 0.3);
            tl.to(logoImg, {
                filter: 'saturate(1) blur(0px) drop-shadow(0 0 24px rgba(255, 246, 220, 0.18))',
                duration: 1.4,
                ease: 'power2.out',
            }, '-=0.4');
        }
    }

    // ─────────────────────────────────────────────────────
    // Left column blocks — eyebrow + content cascade
    // ─────────────────────────────────────────────────────
    const leftBlocks = document.querySelectorAll('.ch05-left .ch05-block');
    leftBlocks.forEach((block) => {
        const eb   = block.querySelector('.ch05-block__eyebrow, .ch05-block__th-eyebrow');
        const lead = block.querySelector('.ch05-block__lead');
        const name = block.querySelector('.ch05-block__name');
        const sub  = block.querySelector('.ch05-block__sub');
        const accordion = block.querySelector('.ch05-accordion');

        if (eb)    gsap.set(eb,    { opacity: 0, y: 16 });
        if (lead)  gsap.set(lead,  { opacity: 0, y: 24, filter: 'blur(8px)' });

        // Author name — char-by-char so it feels personal.
        const nameChars = name ? splitChars(name) : [];
        if (nameChars.length) gsap.set(nameChars, {
            opacity: 0, y: 18, filter: 'blur(6px)',
        });
        if (sub) gsap.set(sub, { opacity: 0, y: 18, filter: 'blur(6px)' });

        // Accordion rows — fade-in cascade
        const accordionRows = accordion
            ? accordion.querySelectorAll('.ch05-accordion-row')
            : [];
        if (accordionRows.length) gsap.set(accordionRows, {
            opacity: 0, y: 20, filter: 'blur(6px)',
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: block,
                start: 'top 82%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (eb) tl.to(eb, {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power3.out',
        }, 0);

        if (lead) tl.to(lead, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.0, ease: 'power3.out',
        }, 0.1);

        if (nameChars.length) tl.to(nameChars, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.7, ease: 'power3.out',
            stagger: 0.04,
        }, 0.15);

        if (sub) tl.to(sub, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.9, ease: 'power3.out',
        }, '-=0.2');

        if (accordionRows.length) tl.to(accordionRows, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.7, ease: 'power3.out',
            stagger: 0.07,
        }, 0.2);
    });

    // ─────────────────────────────────────────────────────
    // Right column — cards drop with stack-of-papers feel
    // ─────────────────────────────────────────────────────
    const rightCol = document.querySelector('.ch05-right');
    if (rightCol) {
        const cards = rightCol.querySelectorAll('.ch05-card');
        const final = rightCol.querySelector('.ch05-final');

        rightCol.style.perspective = '1500px';

        if (cards.length) {
            cards.forEach((c, i) => {
                c._tilt = (i % 2 === 0 ? -1 : 1) * (3 + Math.random() * 3); // ±3..6°
            });
            cards.forEach((c) => gsap.set(c, {
                opacity: 0,
                y: -40,
                rotate: c._tilt,
                rotateX: -25,
                filter: 'blur(8px)',
                transformOrigin: '50% 0% 0',
            }));
        }
        if (final) gsap.set(final, {
            opacity: 0,
            scale: 1.08,
            clipPath: 'inset(20% 0% 20% 0%)',
            filter: 'blur(8px) saturate(0.5)',
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: rightCol,
                start: 'top 80%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });

        if (cards.length) tl.to(cards, {
            opacity: 1, y: 0,
            rotate: 0, rotateX: 0,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.18,
        }, 0);

        if (final) tl.to(final, {
            opacity: 1,
            scale: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            filter: 'blur(0px) saturate(1)',
            duration: 1.6,
            ease: 'power3.out',
        }, '-=0.4');
    }

    // ─────────────────────────────────────────────────────
    // Visual Designs Credits + Typography Credits
    // (Below the grid — both inside the ch05-block pattern)
    // ─────────────────────────────────────────────────────
    // The credits-list and typography rows are inside ch05-block elements
    // that aren't matched by `.ch05-left .ch05-block` above. Animate them
    // as their own credits-roll cascade.
    const creditsList   = document.querySelector('.ch05-credits-list');
    const typographyDl  = document.querySelector('.ch05-typography');

    if (creditsList) {
        const items = creditsList.querySelectorAll('li');
        const eb = creditsList.parentElement?.querySelector('.ch05-block__eyebrow');

        if (eb)    gsap.set(eb,    { opacity: 0, y: 16 });
        if (items.length) gsap.set(items, {
            opacity: 0, x: -24, filter: 'blur(6px)',
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: creditsList.parentElement || creditsList,
                start: 'top 82%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (eb) tl.to(eb, {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power3.out',
        }, 0);
        if (items.length) tl.to(items, {
            opacity: 1, x: 0, filter: 'blur(0px)',
            duration: 0.8, ease: 'power3.out',
            stagger: 0.10,
        }, 0.15);
    }

    if (typographyDl) {
        const rows = typographyDl.querySelectorAll('.ch05-typography__row');
        const eb = typographyDl.parentElement?.querySelector('.ch05-block__eyebrow');

        if (eb)   gsap.set(eb,   { opacity: 0, y: 16 });
        if (rows.length) gsap.set(rows, {
            opacity: 0, x: -24, filter: 'blur(6px)',
        });

        const tl = gsap.timeline({
            scrollTrigger: trigger({
                trigger: typographyDl.parentElement || typographyDl,
                start: 'top 82%',
                toggleActions: 'play none none none',
                once: true,
            }),
        });
        if (eb) tl.to(eb, {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power3.out',
        }, 0);
        if (rows.length) tl.to(rows, {
            opacity: 1, x: 0, filter: 'blur(0px)',
            duration: 0.8, ease: 'power3.out',
            stagger: 0.10,
        }, 0.15);
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
        triggers.forEach((t) => t.kill());
        triggers.length = 0;
    };
}
