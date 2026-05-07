/**
 * utils.js — Faith Engineered shared helpers
 */

/**
 * Wire a horizontal-scroll row to a pair of "right / left" chevron buttons.
 * - Right chevron steps the row forward by `step` (or 70% of viewport).
 * - Left chevron returns to the start (scrollLeft 0).
 * - Sets `data-scroll-end="true"` on the viewport when the row reaches its
 *   right-most position so CSS can swap which chevron is visible.
 *
 * Pattern:
 *   <div class="…__viewport" data-scroll-end="false">
 *     <ul class="…__row">…</ul>
 *     <button class="fe-chevron" data-direction="right">…</button>
 *     <button class="fe-chevron" data-direction="left">…</button>
 *   </div>
 */
export function bindScrollChevrons({ viewport, row, leftBtn, rightBtn, step }) {
    if (!viewport || !row) return;

    const update = () => {
        const max = row.scrollWidth - row.clientWidth;
        const atEnd = max > 0 && row.scrollLeft >= max - 1;
        viewport.dataset.scrollEnd = String(atEnd);
    };

    let raf = 0;
    const schedule = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; update(); });
    };

    row.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    if (rightBtn) {
        rightBtn.addEventListener('click', () => {
            const dx = step ?? Math.round(row.clientWidth * 0.7);
            row.scrollBy({ left: dx, behavior: 'smooth' });
        });
    }

    if (leftBtn) {
        leftBtn.addEventListener('click', () => {
            row.scrollTo({ left: 0, behavior: 'smooth' });
        });
    }

    update();
}


/**
 * Pause every <video> on the page while it's off-screen and resume
 * when it scrolls back into view. Decoding+blending mix-blend-mode
 * videos every frame is the single biggest scroll-jank source on
 * this page; this keeps only the visible ones running.
 *
 * Idempotent — call once from main.js.
 */
export function initVideoVisibilityGate(rootMargin = '200px 0px') {
    const videos = document.querySelectorAll('video[autoplay]');
    if (!videos.length || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const v = entry.target;
            if (entry.isIntersecting) {
                // play() may reject if not ready — swallow silently
                const p = v.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            } else if (!v.paused) {
                v.pause();
            }
        }
    }, { rootMargin, threshold: 0 });

    videos.forEach((v) => io.observe(v));
}
