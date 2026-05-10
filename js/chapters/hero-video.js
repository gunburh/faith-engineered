/**
 * hero-video.js — Faith Engineered
 *
 * Hero behaves as a tall sticky scrubbable section:
 *   • bg02 autoplays + loops while user is at top
 *   • As user scrolls down:
 *       — first 20%: bg02 + hero content fade out (opacity 1→0)
 *       — full scrub: bg05.currentTime is dragged 0 → duration by scroll
 *   • Last segment of scrub: chapter 1 fades up (opacity 0→1, y 20→0)
 *
 * Hero section min-height is set to 100vh + (duration × 300px) so there
 * is enough scroll distance to scrub the entire bg05 timeline.
 *
 * Reduced motion: skip scrub, leave bg02 static, ch1 visible immediately.
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Longer scrub distance per video-second → more scroll required to traverse
// the hero, which gives the cross-dissolve room to read as gradual under
// snappy wheel input.
const SCRUB_PX_PER_SECOND = 500;
// Only scrub through the first N% of bg05 (1.0 = full video, 0.5 = first half)
const BG05_PLAYBACK_FRACTION = 0.5;

export function initHeroVideo() {
    const hero = document.getElementById('hero');
    const bg02 = document.getElementById('hero-video-bg02');
    const bg05 = document.getElementById('hero-video-bg05');
    const heroContent = hero?.querySelector('.hero__content');
    const ch1 = document.getElementById('chapter-01');

    if (!hero || !bg02 || !bg05) {
        console.warn('[hero-video] hero or video elements missing — skipping');
        return;
    }

    // bg02: plays normally on load. bg05: scrub-controlled, never plays itself.
    const safePlay = (v) => {
        const p = v.play();
        return p && typeof p.then === 'function' ? p.catch(() => null) : Promise.resolve();
    };
    safePlay(bg02);

    // Prime bg05's decoder: many browsers won't render any frame for a
    // <video> that has only ever been seeked (never played). Kick it with a
    // muted play(), then pause on the next animation frame so the first
    // frame is decoded and currentTime scrubbing actually shows pixels.
    bg05.muted = true;
    let bg05Primed = false;
    const primeBg05 = async () => {
        if (bg05Primed) return;
        bg05Primed = true;
        await safePlay(bg05);
        // Let one frame render, then freeze
        requestAnimationFrame(() => {
            bg05.pause();
            bg05.currentTime = 0;
        });
    };

    // Reduced-motion path: static bg02, ch1 immediately visible
    if (REDUCED_MOTION) {
        if (typeof gsap !== 'undefined' && ch1) gsap.set(ch1, { opacity: 1, y: 0, clearProps: 'transform' });
        return;
    }

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('[hero-video] GSAP/ScrollTrigger not loaded — skipping scrub');
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Sync ScrollTrigger to Lenis (defensive — only if Lenis is running).
    // Guarded by __stRegistered so chapter-scroll modules can't double-register
    // the listener — otherwise ScrollTrigger.update fires twice per frame and
    // jank shows up at section boundaries.
    if (window.__lenis && typeof window.__lenis.on === 'function' && !window.__lenis.__stRegistered) {
        window.__lenis.on('scroll', ScrollTrigger.update);
        window.__lenis.__stRegistered = true;
    }

    // Initial state — ch1 starts hidden, will fade in at end of scrub
    if (ch1) gsap.set(ch1, { opacity: 0, y: 20 });

    /**
     * Build the scrub timeline once bg05 metadata is known.
     * Timeline durations are normalized to 1.0 = full scrub:
     *   0.00 – 0.20 → bg02 + heroContent fade out
     *   0.00 – 1.00 → bg05.currentTime tracks scroll
     *   0.85 – 1.00 → chapter 1 fades up
     */
    const buildTimeline = () => {
        const fullDuration = bg05.duration;
        if (!Number.isFinite(fullDuration) || fullDuration <= 0) return;

        // Use only the first N% of the video, and shrink the scroll spacer to match
        const duration = fullDuration * BG05_PLAYBACK_FRACTION;
        const scrubPx = Math.round(duration * SCRUB_PX_PER_SECOND);

        // Tell CSS how tall the hero scroll spacer should be
        hero.style.setProperty('--hero-scrub-height', `${scrubPx}px`);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: () => `+=${scrubPx}`,
                // scrub: 0.5 instead of `true` — GSAP lerps the timeline
                // playhead toward the scroll target over 0.5s instead of
                // matching it 1:1. Chrome stops re-seeking the video on
                // every single scroll event, decoder pressure drops, scroll
                // smooths out. Cost: video frame trails the scroll position
                // by ~half a second under fast wheel input.
                scrub: 0.5,
                invalidateOnRefresh: true,
            },
        });

        // Snappy crossfade — fades happen early in the scrub so bg05 has
        // time to "hold" before chapter-01 enters. Scrub area is still wide
        // (SCRUB_PX_PER_SECOND = 500) so the fade isn't completed instantly.
        tl.to(bg02, { opacity: 0, duration: 0.28, ease: 'power1.inOut' }, 0);
        tl.to(bg05, { opacity: 1, duration: 0.22, ease: 'power1.inOut' }, 0);
        if (heroContent) {
            tl.to(heroContent, { opacity: 0, duration: 0.32, ease: 'power1.inOut' }, 0);
        }

        // Full scrub — frame-gated, delta-gated, fastSeek path.
        //
        // Each layer fixes a different decoder-jank source on Chrome:
        //
        //   1. PROXY animation — GSAP tweens a plain number (`seekProxy.t`),
        //      not video.currentTime directly. Decouples GSAP's RAF cadence
        //      from when we actually ask the video to seek.
        //
        //   2. fastSeek() — bypasses Chrome's frame-accurate seek (which on
        //      a sparsely-keyframed clip decodes every intermediate P-frame)
        //      and jumps straight to the nearest keyframe.
        //
        //   3. requestVideoFrameCallback gate — never request the next seek
        //      until the previous decoded frame has actually been presented.
        //      Stops Chrome's decode queue from backing up under fast scroll.
        //      If we got a newer target while busy, we seek to it now instead
        //      of replaying every intermediate value.
        //
        //   4. Delta gate — skip seek requests that are <40ms of video time
        //      from the last one. Slow scroll won't hammer the decoder for
        //      effectively-the-same frame.
        const seekProxy = { t: 0 };
        let pending = false;
        let lastSeekedT = -1;
        const MIN_DELTA = 0.04;                  // ~1 frame at 25fps
        const supportsRVFC =
            typeof bg05.requestVideoFrameCallback === 'function';

        const seekVideo = (t) => {
            if (typeof bg05.fastSeek === 'function') bg05.fastSeek(t);
            else bg05.currentTime = t;
        };

        const requestSeek = (target) => {
            if (pending) return;                 // wait for in-flight frame
            if (Math.abs(target - lastSeekedT) < MIN_DELTA) return;
            pending = true;
            lastSeekedT = target;
            seekVideo(target);

            // Once-only release — whichever signal fires first wins.
            //
            // Safari has a sharp edge here: requestVideoFrameCallback only
            // fires after a frame is *presented to the compositor*. Until
            // bg05's opacity animates above 0 it never gets composited, the
            // callback never fires, `pending` stays true forever, and every
            // subsequent seek is silently dropped — that's why scrub stayed
            // dead until you reached Ch1 (which triggers a layout pass that
            // wakes the compositor up).
            //
            // Belt + braces: register both rVFC and a 100ms timeout. The
            // timeout is ignored on Chrome (rVFC fires first, well within
            // 100ms when actually decoding) and acts as the rescue path on
            // Safari while the video is invisible.
            let released = false;
            const release = () => {
                if (released) return;
                released = true;
                pending = false;
                if (Math.abs(seekProxy.t - lastSeekedT) >= MIN_DELTA) {
                    requestSeek(seekProxy.t);
                }
            };
            if (supportsRVFC) bg05.requestVideoFrameCallback(release);
            setTimeout(release, 100);
        };

        tl.fromTo(
            seekProxy,
            { t: 0 },
            {
                t: duration,
                duration: 1,
                ease: 'none',
                onUpdate: () => requestSeek(seekProxy.t),
                onComplete: () => {
                    pending = false;             // make sure final frame lands
                    seekVideo(duration);
                    lastSeekedT = duration;
                },
            },
            0
        );

        // Last 15%: chapter 1 fades up
        if (ch1) {
            tl.to(ch1, { opacity: 1, y: 0, duration: 0.15, ease: 'none' }, 0.85);
        }

        // Hero must already be at the correct height before ScrollTrigger
        // measures positions — refresh after the CSS var is applied.
        ScrollTrigger.refresh();
    };

    // Prime as soon as we can, then build the timeline once the video is
    // actually decode-ready (readyState >= 2 = HAVE_CURRENT_DATA).
    const start = async () => {
        await primeBg05();
        buildTimeline();
    };

    if (bg05.readyState >= 2) {
        start();
    } else {
        bg05.addEventListener('canplay', start, { once: true });
        // Fallback: some browsers fire loadeddata but not canplay until played
        bg05.addEventListener('loadeddata', start, { once: true });
    }
}
