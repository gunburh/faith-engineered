/**
 * about-accordion.js — Faith Engineered · Sources & About
 *
 * Click any [data-accordion-row] head → toggle data-expanded between true/false.
 * The body uses a `grid-template-rows: 0fr → 1fr` CSS transition (handled in
 * 05-about.css) so the height animates smoothly without measuring children.
 *
 * Accessibility:
 *   - Updates aria-expanded on the head button
 *   - Click + Enter/Space supported (native button handles keyboard)
 *
 * prefers-reduced-motion: the CSS transition is removed in 05-about.css media
 * query, so toggles snap instantly without any JS change here.
 */

export function initAboutAccordion() {
    const rows = document.querySelectorAll('[data-accordion-row]');
    if (!rows.length) return;

    rows.forEach((row) => {
        const head = row.querySelector('[data-accordion-head]');
        if (!head) return;

        head.addEventListener('click', () => {
            const expanded = row.dataset.expanded === 'true';
            const next = !expanded;
            row.dataset.expanded = String(next);
            head.setAttribute('aria-expanded', String(next));
        });
    });
}
