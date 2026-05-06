/**
 * utils.js — Faith Engineered shared helpers
 */

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
