// (bindScrollChevrons no longer needed — the shrine row is now a 3D
//  coverflow carousel, not a scrolling list. Chevrons advance the active
//  index by ±1 instead of scrolling.)

/**
 * geography-map.js — Faith Engineered · Chapter 02 · The Geography of Luck
 *
 * Initialises the Bangkok Shrine Map (Leaflet, CartoDB Dark Matter tiles)
 * and wires up bidirectional sync between:
 *   - Map pins (gold dot markers)
 *   - Detail card on the right of the map
 *   - "All 6 Shrines" mini-card row below
 *
 * Click any pin OR mini card → activates that shrine everywhere.
 * Default activated: Erawan Shrine.
 *
 * Gracefully degrades if Leaflet failed to load (CDN blocked, offline, etc.).
 */

const SHRINES = [
    {
        id: 'erawan',
        nameEn: 'Erawan Shrine',
        district: 'Ratchaprasong · Central Bangkok',
        deity: 'Brahma (Phra Phrom)',
        specialty: 'General wishes · any request',
        bestTime: 'Early morning · 6–8 AM',
        offering: 'Garland + 7 incense sticks',
        visitor: 'Tourists, businesspeople, anyone in need',
        endpoint: '/wishes/any',
        lat: 13.7443,
        lng: 100.5409,
        body: 'Bangkok\'s busiest spiritual node. Erected in 1956 to break a construction curse on the original Erawan Hotel and now drawing several thousand petitioners daily, the four-faced Brahmā at Ratchaprasong functions as the city\'s general-purpose endpoint for success — career, exams, family, travel, anything. The shrine pays its own dance troupe to perform commissioned offerings on the spot, the price of a dance set on a public board next to the booth.',
    },
    {
        id: 'trimurti',
        nameEn: 'Trimurti Shrine',
        district: 'CentralWorld · Central Bangkok',
        deity: 'Trimurti (Brahma + Vishnu + Shiva)',
        specialty: 'Love & romance',
        bestTime: 'Thursday · 9:30–10 PM',
        offering: 'Red roses + red incense',
        visitor: 'Singles, couples',
        endpoint: '/love/romance',
        lat: 13.7470,
        lng: 100.5395,
        body: 'A specialised love endpoint at the north entrance of CentralWorld. Thursday nights between 9:30 and 10 PM are the only valid call window — the moment Thai folk tradition holds that the Trimurti descends to receive offerings. Crowds form on the sidewalk by 9 PM clutching odd-numbered red roses and red incense. Outside that window the queue is empty even though the shrine is open.',
    },
    {
        id: 'ganesh',
        nameEn: 'Ganesh Shrine',
        district: 'Huai Khwang · East Bangkok',
        deity: 'Ganesha (Phra Phikanet)',
        specialty: 'Career & creative success',
        bestTime: 'Tuesday & Thursday evenings',
        offering: 'Marigolds, milk, modaks, fresh fruit',
        visitor: 'Artists, entrepreneurs, students',
        endpoint: '/career/creative',
        lat: 13.7779,
        lng: 100.5733,
        body: 'The 9-metre bronze Ganesh on Ratchadaphisek Road, at the corner just north of Huai Khwang MRT, is Bangkok\'s flagship endpoint for career and creative requests. Built in the 2000s next to the Thai Cultural Centre, the shrine draws a constant stream of designers, founders, students, and TV-industry workers — the surrounding neighbourhood is one of the city\'s media-and-production clusters. The canonical visit days are Tuesday and Thursday evenings; offerings are marigolds, fresh milk, modaks, and any uncut fruit.',
    },
    {
        id: 'aikhai',
        nameEn: 'Ai Khai Bangkok',
        district: 'Huai Khwang · East Bangkok',
        deity: 'Ai Khai (child spirit)',
        specialty: 'Fast wealth & lottery',
        bestTime: 'Any time',
        offering: 'Red drinks, toys, firecrackers',
        visitor: 'Lottery players, risk-takers',
        endpoint: '/wealth/fast',
        lat: 13.7700,
        lng: 100.5740,
        body: 'A satellite outpost of the original Ai Khai shrine in Nakhon Si Thammarat — a child spirit specialised in fast money and lottery numbers. The viral peak between 2018 and 2021 turned this branch into a near-permanent crowd of risk-takers leaving stucco roosters, toy cars, and red sugary drinks. There is no canonical schedule; the shrine is on-demand.',
    },
    {
        id: 'kuanyin',
        nameEn: 'Kuan Yin Shrine',
        district: 'Chinatown · Yaowarat',
        deity: 'Guanyin (bodhisattva of mercy)',
        specialty: 'Healing & mercy',
        bestTime: '1st & 15th lunar month',
        offering: 'Fruit + incense',
        visitor: 'Elderly, sick, devout',
        endpoint: '/healing/mercy',
        lat: 13.7407,
        lng: 100.5097,
        body: 'Bangkok\'s busiest Guanyin halls cluster along Yaowarat — the bodhisattva of mercy as imported through Sino-Thai families across two centuries. The 1st and 15th of every lunar month are the canonical visit days. Offerings are vegetarian: fruit, incense, lotus. The endpoint serves healing requests, family illness, and the elderly.',
    },
    {
        id: 'tubtim',
        nameEn: 'Jao Mae Tubtim',
        district: 'Sukhumvit 3 · Sukhumvit',
        deity: 'Chao Mae Tubtim (fertility goddess)',
        specialty: 'Children & conception',
        bestTime: 'Morning',
        offering: 'Wooden phallus offerings',
        visitor: 'Couples wanting children',
        endpoint: '/children/conceive',
        lat: 13.7445,
        lng: 100.5450,
        body: 'A small, intensely-specialised shrine inside the Nai Lert garden complex on Sukhumvit. Almost the entire surface is covered in carved wooden phalluses left by petitioners — the offering associated with successful conception. Couples come quietly, leave their carved offering, and go. The shrine handles exactly one category of request and handles it well.',
    },
];

const DEFAULT_SHRINE_ID = 'erawan';

// ─────────────────────────────────────────────────────────
// Helpers — DOM construction
// ─────────────────────────────────────────────────────────

/** Build a [GET] /path API pill inner-HTML fragment. */
function pillHTML(endpoint) {
    return `
        <span class="ch02-pill" role="text">
            <span class="ch02-pill__badge">GET</span>
            <span class="ch02-pill__path">${endpoint}</span>
        </span>
    `;
}

/** Build the right-side detail card for a given shrine. */
function detailHTML(shrine) {
    return `
        <h3 class="ch02-detail__name">${shrine.nameEn}</h3>
        <p class="ch02-detail__hood">${shrine.district}</p>

        <hr class="ch02-detail__rule">

        <dl class="ch02-detail__list">
            <dt>Deity</dt>      <dd>${shrine.deity}</dd>
            <dt>Specialty</dt>  <dd>${shrine.specialty}</dd>
            <dt>Best time</dt>  <dd>${shrine.bestTime}</dd>
            <dt>Offering</dt>   <dd>${shrine.offering}</dd>
            <dt>Visitor</dt>    <dd>${shrine.visitor}</dd>
        </dl>

        <hr class="ch02-detail__rule">

        <div class="ch02-detail__pill">${pillHTML(shrine.endpoint)}</div>

        <p class="ch02-detail__body">${shrine.body}</p>
    `;
}

/** Render the 6 mini cards into the horizontal scroll row. */
function renderMiniCards(rowEl) {
    rowEl.innerHTML = SHRINES.map((s) => `
        <li>
            <button class="ch02-mini" type="button"
                    data-shrine-id="${s.id}" data-active="false"
                    aria-label="Select ${s.nameEn}">
                <div class="ch02-mini__head">
                    <h4 class="ch02-mini__name">${s.nameEn}</h4>
                    <p class="ch02-mini__hood">${s.district.split(' · ')[0]}</p>
                </div>
                <hr class="ch02-mini__rule">
                ${pillHTML(s.endpoint)}
            </button>
        </li>
    `).join('');
}

/**
 * Update each <li> in the coverflow carousel with its --offset and --abs
 * CSS variables, based on its index relative to the active card. Cards
 * more than 2 steps from active get data-hidden="true" so they fade out.
 *
 * The transform/opacity formulas live in CSS (.ch02-shrines__row > li);
 * this function only writes the per-li input variables.
 */
function updateCarouselOffsets(rowEl, activeId) {
    const items = rowEl.querySelectorAll(':scope > li');
    let activeIdx = -1;
    items.forEach((li, idx) => {
        const btn = li.querySelector('[data-shrine-id]');
        if (btn && btn.dataset.shrineId === activeId) activeIdx = idx;
    });
    if (activeIdx < 0) return;
    items.forEach((li, idx) => {
        const offset = idx - activeIdx;
        const abs = Math.abs(offset);
        li.style.setProperty('--offset', String(offset));
        li.style.setProperty('--abs', String(abs));
        li.dataset.hidden = abs > 2 ? 'true' : 'false';
    });
}

// ─────────────────────────────────────────────────────────
// State sync
// ─────────────────────────────────────────────────────────

/**
 * Activate a shrine: refresh detail card, update mini-card and pin states,
 * and pan/zoom the map (if present) so the chosen shrine is in view.
 */
function activateShrine(id, ctx) {
    const shrine = SHRINES.find((s) => s.id === id);
    if (!shrine) return;

    const { detailEl, rowEl, markers, map, leftChevron, rightChevron } = ctx;

    // Detail card
    if (detailEl) detailEl.innerHTML = detailHTML(shrine);

    // Mini-card states + coverflow geometry update
    if (rowEl) {
        const items = rowEl.querySelectorAll(':scope > li');
        items.forEach((li) => {
            const btn = li.querySelector('[data-shrine-id]');
            if (btn) btn.dataset.active = String(btn.dataset.shrineId === id);
        });
        updateCarouselOffsets(rowEl, id);

        // Sync boundary state on chevrons (disabled at row ends).
        const activeIdx = Array.prototype.findIndex.call(items, (li) =>
            li.querySelector('[data-shrine-id]')?.dataset.shrineId === id);
        if (leftChevron)  leftChevron.toggleAttribute('disabled',  activeIdx <= 0);
        if (rightChevron) rightChevron.toggleAttribute('disabled', activeIdx >= items.length - 1);
    }

    // Pin states (custom data-active on the marker DOM element)
    if (markers) {
        Object.entries(markers).forEach(([mid, marker]) => {
            const el = marker.getElement?.();
            if (!el) return;
            el.dataset.active = String(mid === id);
        });
    }

    // Map pan
    if (map && shrine.lat && shrine.lng) {
        map.panTo([shrine.lat, shrine.lng], { animate: true, duration: 0.6 });
    }
}

// ─────────────────────────────────────────────────────────
// Leaflet map setup
// ─────────────────────────────────────────────────────────

function buildMap(mapEl) {
    const placeholder = mapEl.querySelector('.ch02-map__placeholder');
    if (placeholder) placeholder.remove();

    const map = L.map(mapEl, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' +
            ' &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    }).addTo(map);

    map.fitBounds(SHRINES.map((s) => [s.lat, s.lng]), { padding: [60, 60] });

    return map;
}

function buildMarkers(map, onClickShrine) {
    const markers = {};

    SHRINES.forEach((shrine) => {
        const icon = L.divIcon({
            html:
                `<span class="ch02-pin__ring"></span>` +
                `<span class="ch02-pin__dot"></span>`,
            className: 'ch02-pin',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            tooltipAnchor: [10, 0],
        });

        const m = L.marker([shrine.lat, shrine.lng], {
            icon,
            alt: shrine.nameEn,
            keyboard: true,
            title: shrine.nameEn,
        }).addTo(map);

        m.bindTooltip(shrine.nameEn, {
            permanent: true,
            direction: 'right',
            offset: [4, 0],
            className: 'ch02-tip',
        });

        m.on('click', () => onClickShrine(shrine.id));

        markers[shrine.id] = m;
    });

    return markers;
}

// ─────────────────────────────────────────────────────────
// Public init
// ─────────────────────────────────────────────────────────

export function initGeographyMap() {
    const mapEl = document.getElementById('ch02-map');
    const detailEl = document.querySelector('[data-shrine-detail]');
    const rowEl = document.querySelector('[data-shrine-row]');
    const viewportEl = rowEl?.parentElement || null;
    const rightChevron = document.querySelector('[data-shrine-chevron][data-direction="right"]');
    const leftChevron  = document.querySelector('[data-shrine-chevron][data-direction="left"]');

    if (!mapEl || !detailEl || !rowEl) return;

    // Mini-card row: render once, then bind clicks regardless of map state.
    renderMiniCards(rowEl);

    let map = null;
    let markers = null;

    if (typeof window.L !== 'undefined') {
        try {
            map = buildMap(mapEl);
        } catch (err) {
            console.warn('[geography-map] Leaflet init failed:', err);
            map = null;
        }
    } else {
        console.warn('[geography-map] Leaflet not available — map disabled, list still functional.');
        const ph = mapEl.querySelector('.ch02-map__placeholder');
        if (ph) ph.textContent = 'Map unavailable — interactive list below works fully.';
    }

    const ctx = { detailEl, rowEl, markers, map, leftChevron, rightChevron };

    // Build markers AFTER ctx exists so the click handler can read it via closure.
    if (map) {
        markers = buildMarkers(map, (id) => activateShrine(id, ctx));
        ctx.markers = markers;
    }

    // Mini-card row → activate
    rowEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-shrine-id]');
        if (!btn) return;
        activateShrine(btn.dataset.shrineId, ctx);
    });

    // Chevrons — advance the active shrine by ±1 (clamped at row ends),
    // so the carousel rotates one card to the side instead of scrolling.
    // Boundary disabled state is synced inside activateShrine().
    function activateAdjacent(delta) {
        const items = rowEl.querySelectorAll(':scope > li');
        if (!items.length) return;
        const currentLi = rowEl
            .querySelector('[data-shrine-id][data-active="true"]')
            ?.closest('li');
        const currentIdx = currentLi
            ? Array.prototype.indexOf.call(items, currentLi)
            : 0;
        const nextIdx = Math.max(0, Math.min(items.length - 1, currentIdx + delta));
        const nextBtn = items[nextIdx]?.querySelector('[data-shrine-id]');
        if (nextBtn) activateShrine(nextBtn.dataset.shrineId, ctx);
    }

    if (rightChevron) rightChevron.addEventListener('click', () => activateAdjacent(+1));
    if (leftChevron)  leftChevron.addEventListener('click',  () => activateAdjacent(-1));

    // Keyboard nav on the carousel viewport — Arrow Left / Right advances.
    if (viewportEl) {
        viewportEl.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { activateAdjacent(+1); e.preventDefault(); }
            else if (e.key === 'ArrowLeft') { activateAdjacent(-1); e.preventDefault(); }
        });
    }

    // Default selection — also seeds the initial coverflow offsets.
    activateShrine(DEFAULT_SHRINE_ID, ctx);
}
