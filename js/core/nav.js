/**
 * js/core/nav.js
 * Faith Engineered — Sticky nav + scroll-spy
 *
 * What this does:
 *  1. Makes the nav bar stick at top after hero exits viewport
 *  2. Scroll-spy: highlights the active chapter pill via IntersectionObserver
 *  3. Smooth-scrolls to section on nav link click (works with Lenis)
 *
 * Dependencies: none (vanilla only)
 * Called from: js/main.js → initNav()
 */

export function initNav() {
    const nav = document.querySelector('[data-nav]');
    if (!nav) return; // guard — nav not in DOM yet

    const links = nav.querySelectorAll('[data-nav-link]');
    if (!links.length) return;

    // ─────────────────────────────────────────────
    // 1. Sticky show/hide
    //    Nav starts transparent/hidden above hero,
    //    becomes visible once user scrolls past ~90vh
    // ─────────────────────────────────────────────
    const hero = document.querySelector('#hero');

    if (hero) {
        const heroObserver = new IntersectionObserver(
            ([entry]) => {
                // When hero is NOT intersecting → user has scrolled past it → show nav
                nav.setAttribute('data-visible', String(!entry.isIntersecting));
            },
            { threshold: 0.1 } // trigger when 90% of hero has scrolled away
        );
        heroObserver.observe(hero);
    } else {
        // No hero section — always show nav
        nav.setAttribute('data-visible', 'true');
    }

    // ─────────────────────────────────────────────
    // 2. Scroll-spy via IntersectionObserver
    //    Watches each section; when one crosses the
    //    "active zone" (top 0→40% of viewport),
    //    its corresponding nav link gets data-active="true"
    // ─────────────────────────────────────────────

    /**
     * Build a map of { sectionId → navLinkElement }
     * Expects nav links to have data-nav-link="#chapter-01" etc.
     */
    const linkMap = new Map();
    links.forEach(link => {
        const target = link.getAttribute('data-nav-link');
        if (target) linkMap.set(target.replace('#', ''), link);
    });

    /**
     * @param {string} activeId - section id that just became active
     */
    function setActiveLink(activeId) {
        links.forEach(link => {
            const isActive = link.getAttribute('data-nav-link') === `#${activeId}`;
            link.setAttribute('data-active', String(isActive));
            link.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    }

    // IntersectionObserver rootMargin:
    // top: -5% means the trigger line is 5% from top of viewport
    // bottom: -55% means it stops caring once the section is past 45% of viewport
    // Net result: section is "active" when its top edge is in the top 40% of screen
    const spyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveLink(entry.target.id);
                }
            });
        },
        {
            rootMargin: '-5% 0px -55% 0px',
            threshold: 0,
        }
    );

    // Observe all sections that have a matching nav link
    linkMap.forEach((_, id) => {
        const section = document.getElementById(id);
        if (section) spyObserver.observe(section);
    });

    // ─────────────────────────────────────────────
    // 3. Click → scroll to section
    //    Lenis is already running smoothScroll.
    //    We just update the URL hash and let the
    //    browser (+ Lenis) handle the rest.
    //    No manual scrollTo needed.
    // ─────────────────────────────────────────────
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-nav-link');
            if (!targetId) return;

            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            // Lenis exposes its instance on window if initialized in scroll.js
            // Check for it; fallback to native scrollIntoView
            if (window.__lenis) {
                window.__lenis.scrollTo(targetEl, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
            } else {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }

            // Update hash without triggering jump
            history.pushState(null, '', targetId);
        });
    });
}