/**
 * main.js — Faith Engineered
 * Entry point. Orchestrates all modules.
 *
 * Load order:
 * 1. Core utilities (lang, nav, scroll)
 * 2. Motion (GSAP animations — depends on scroll)
 * 3. Chapter interactions (depend on motion + lang)
 * 4. Audio (last — non-critical, user-initiated only)
 *
 * All vendor scripts (Three.js, GSAP, Lenis, etc.) are loaded
 * via <script> tags in index.html before this module.
 */

import { initLanguageToggle } from './core/lang-toggle.js';
import { initSmoothScroll } from './core/scroll.js';
import { initVideoVisibilityGate } from './utils.js';
// Uncomment as each module is built:
import { initNav }            from './core/nav.js';
import { initHeroVideo }      from './chapters/hero-video.js';
import { initHeroSmoke }      from './chapters/hero-smoke.js';
import { initStackBuild }     from './chapters/stack-build.js';
import { initGeographyMap }   from './chapters/geography-map.js';
// import { initMotion }         from './core/motion.js';
// import { initHeroSmoke }      from './chapters/hero-smoke.js';
// import { initStackDiagram }   from './chapters/stack-diagram.js';
// import { initShrineMap }      from './chapters/shrine-map.js';
// import { initCounters }       from './chapters/counters.js';
// import { initAudio }          from './lib/audio.js';

// ─────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Language toggle — must be first (other modules may read lang)
    await initLanguageToggle();

    // 2. Smooth scroll (Lenis)
    initSmoothScroll();

    // 3. Nav (sticky + scroll-spy)
    initNav();

    // 4. GSAP scroll animations — uncomment when motion.js is built
    // initMotion();

    // 5. Chapter interactions — uncomment as each is built
    initHeroVideo();
    initHeroSmoke();
    initStackBuild();
    initGeographyMap();

    // Pause videos that are off-screen — biggest scroll-jank fix on this page.
    initVideoVisibilityGate();
    // initStackDiagram();
    // initShrineMap();
    // initCounters();

    // 6. Audio — last, non-critical
    // initAudio();

    console.log('[main] Faith Engineered — initialized');
});