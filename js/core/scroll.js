/**
 * scroll.js — Faith Engineered
 * Lenis smooth scroll initialization.
 *
 * Responsibilities:
 * - Initialize Lenis with cinematic easing
 * - Connect Lenis RAF loop to GSAP ticker (when motion.js is loaded)
 * - Expose lenis instance for other modules
 * - Respect prefers-reduced-motion: disable smooth scroll if set
 * - Scroll progress indicator (thin gold line at top)
 */

// ─── State ────────────────────────────────────────────────
let lenis = null;

// ─── Helpers ──────────────────────────────────────────────

/**
 * Check if user prefers reduced motion.
 * @returns {boolean}
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create and inject a scroll progress bar element.
 * Thin gold line at top of viewport.
 * @returns {HTMLElement}
 */
function createProgressBar() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('role', 'presentation');

    Object.assign(bar.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '0%',
        height: '2px',
        background: 'var(--color-gold)',
        zIndex: 'var(--z-toast)',
        transformOrigin: 'left',
        pointerEvents: 'none',
        opacity: '0.7',
        transition: 'width 0.1s linear',
    });

    document.body.prepend(bar);
    return bar;
}

/**
 * Update scroll progress bar width based on scroll position.
 * @param {number} progress - 0 to 1
 */
function updateProgressBar(progress) {
    const bar = document.getElementById('scroll-progress');
    if (bar) {
        bar.style.width = `${progress * 100}%`;
    }
}

// ─── Init ─────────────────────────────────────────────────

/**
 * Initialize Lenis smooth scroll.
 * Call from main.js after DOMContentLoaded.
 * @returns {Object|null} lenis instance, or null if reduced motion
 */
export function initSmoothScroll() {
    // Respect prefers-reduced-motion — no smooth scroll
    if (prefersReducedMotion()) {
        console.log('[scroll] Reduced motion detected — smooth scroll disabled');
        return null;
    }

    // Lenis must be loaded via vendor/lenis.min.js
    if (typeof Lenis === 'undefined') {
        console.warn('[scroll] Lenis not found — check vendor/lenis.min.js');
        return null;
    }

    // Initialize Lenis
    lenis = new Lenis({
        duration: 1.4,                           // scroll duration (seconds)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease out
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
    });

    // Create progress bar
    createProgressBar();

    // Update progress bar on scroll
    lenis.on('scroll', ({ progress }) => {
        updateProgressBar(progress);
    });

    // RAF loop — if GSAP is available, use its ticker for sync
    // Otherwise fall back to requestAnimationFrame
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    // Connect to GSAP ticker if available (loaded in main.js before this)
    if (typeof gsap !== 'undefined') {
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000); // GSAP time is in seconds, Lenis expects ms
        });
        gsap.ticker.lagSmoothing(0); // prevent GSAP from skipping frames
    } else {
        // Fallback: vanilla RAF
        requestAnimationFrame(raf);
    }

    return lenis;
}

/**
 * Get the Lenis instance.
 * Use from other modules that need to pause/resume scroll
 * (e.g. when modal opens).
 * @returns {Object|null}
 */
export function getLenis() {
    return lenis;
}

/**
 * Stop smooth scroll (e.g. when modal opens).
 */
export function stopScroll() {
    lenis?.stop();
}

/**
 * Resume smooth scroll (e.g. when modal closes).
 */
export function startScroll() {
    lenis?.start();
}