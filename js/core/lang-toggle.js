/**
 * lang-toggle.js — Faith Engineered
 * Bilingual EN/TH toggle.
 *
 * Responsibilities:
 * - Load content/copy.json once
 * - Detect browser language on first visit
 * - Persist language choice to localStorage
 * - Update all [data-i18n] elements on toggle
 * - Announce language change to screen readers
 * - Crossfade transition (400ms) per §2.3 spec
 */

// ─── State ────────────────────────────────────────────────
let copy = null;
let currentLang = 'en';

// ─── Helpers ──────────────────────────────────────────────

/**
 * Detect browser preferred language.
 * Returns 'th' if Thai, 'en' otherwise.
 * @returns {'en'|'th'}
 */
function detectBrowserLang() {
    const lang = navigator.language || navigator.languages?.[0] || 'en';
    return lang.startsWith('th') ? 'th' : 'en';
}

/**
 * Resolve a dot-notation key path against the copy object.
 * e.g. 'hero.title' → copy.hero.title
 * @param {string} path
 * @returns {Object|null}
 */
function resolvePath(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], copy) ?? null;
}

/**
 * Load copy.json from server. Cached after first load.
 * @returns {Promise<void>}
 */
async function loadCopy() {
    if (copy) return; // already loaded
    try {
        const res = await fetch('/content/copy.json');
        if (!res.ok) throw new Error(`copy.json fetch failed: ${res.status}`);
        copy = await res.json();
    } catch (err) {
        console.error('[lang-toggle] Failed to load copy.json:', err);
        // Graceful degradation: copy stays null, DOM keeps hardcoded fallback text
    }
}

// ─── Core ─────────────────────────────────────────────────

/**
 * Update all [data-i18n] elements with text for the given language.
 * Falls back to existing element text if key not found.
 * @param {'en'|'th'} lang
 */
function applyLanguage(lang) {
    if (!copy) return; // copy.json not loaded yet

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const node = resolvePath(el.dataset.i18n);
        if (!node) return;

        const text = node[lang];
        if (text) el.textContent = text;
    });
}

/**
 * Update toggle button aria-pressed states.
 * @param {'en'|'th'} lang
 */
function updateToggleState(lang) {
    document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
        const isActive = btn.dataset.lang === lang;
        btn.setAttribute('aria-pressed', String(isActive));
    });
}

/**
 * Announce language change to screen readers via live region.
 * @param {'en'|'th'} lang
 */
function announceLanguageChange(lang) {
    const message = lang === 'th'
        ? 'เปลี่ยนเป็นภาษาไทยแล้ว'
        : 'Switched to English';

    // Find or create live region
    let liveRegion = document.getElementById('lang-announcement');
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'lang-announcement';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        // Visually hidden
        Object.assign(liveRegion.style, {
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
        });
        document.body.appendChild(liveRegion);
    }

    // Clear then set (forces re-announcement)
    liveRegion.textContent = '';
    requestAnimationFrame(() => {
        liveRegion.textContent = message;
    });
}

/**
 * Set the active language. Updates DOM, state, and persistence.
 * @param {'en'|'th'} lang
 */
function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'th') return; // guard

    currentLang = lang;

    // Update <html lang=""> for screen readers + CSS font switching
    document.documentElement.lang = lang;

    // Crossfade: fade out → swap text → fade in (400ms per spec §2.3)
    const main = document.getElementById('main');
    if (main) {
        main.style.transition = 'opacity 200ms ease';
        main.style.opacity = '0';

        setTimeout(() => {
            applyLanguage(lang);
            main.style.opacity = '1';
        }, 200);
    } else {
        applyLanguage(lang);
    }

    updateToggleState(lang);
    announceLanguageChange(lang);
    localStorage.setItem('lang', lang);
}

// ─── Event Listeners ──────────────────────────────────────

/**
 * Wire up toggle buttons using event delegation.
 */
function bindToggleButtons() {
    // Event delegation on document — works even if nav is replaced
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-toggle__btn');
        if (!btn) return;

        const lang = btn.dataset.lang;
        if (lang && lang !== currentLang) {
            setLanguage(lang);
        }
    });

    // Keyboard: Enter or Space on toggle buttons
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const btn = e.target.closest('.lang-toggle__btn');
        if (!btn) return;

        e.preventDefault();
        const lang = btn.dataset.lang;
        if (lang && lang !== currentLang) {
            setLanguage(lang);
        }
    });
}

// ─── Init ─────────────────────────────────────────────────

/**
 * Initialize the language toggle system.
 * Call once from main.js after DOMContentLoaded.
 * @returns {Promise<void>}
 */
export async function initLanguageToggle() {
    // Determine initial language: stored > browser > default 'en'
    const stored = localStorage.getItem('lang');
    currentLang = stored || detectBrowserLang();

    // Load copy.json
    await loadCopy();

    // Apply on first load
    document.documentElement.lang = currentLang;
    applyLanguage(currentLang);
    updateToggleState(currentLang);

    // Wire up buttons
    bindToggleButtons();
}

/**
 * Get the current active language.
 * Useful for other modules that need to know the language.
 * @returns {'en'|'th'}
 */
export function getCurrentLang() {
    return currentLang;
}