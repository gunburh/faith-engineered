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

// ── i18n helpers (mirrors stack-build.js) ─────────────────
const getLang = () => (document.documentElement.lang === 'th' ? 'th' : 'en');
const t = (v) => (v && typeof v === 'object' && 'en' in v) ? (v[getLang()] || v.en) : v;

// Detail-panel labels — kept inline for self-contained module.
const SHRINE_LABELS = {
    deity:     { en: 'Deity',     th: 'เทพ' },
    specialty: { en: 'Specialty', th: 'ความเชี่ยวชาญ' },
    bestTime:  { en: 'Best time', th: 'เวลาที่ดีที่สุด' },
    offering:  { en: 'Offering',  th: 'เครื่องบูชา' },
    visitor:   { en: 'Visitor',   th: 'ผู้มาเยือน' },
};

const SHRINES = [
    {
        id: 'erawan',
        name:      { en: 'Erawan Shrine',                          th: 'ศาลพระพรหมเอราวัณ' },
        district:  { en: 'Ratchaprasong · Central Bangkok',         th: 'ราชประสงค์ · กลางกรุงเทพฯ' },
        deity:     { en: 'Brahma (Phra Phrom)',                    th: 'พระพรหม' },
        specialty: { en: 'General wishes · any request',           th: 'คำอธิษฐานทั่วไป · ทุกคำขอ' },
        bestTime:  { en: 'Early morning · 6–8 AM',                 th: 'เช้าตรู่ · 6–8 น.' },
        offering:  { en: 'Garland + 7 incense sticks',             th: 'พวงมาลัย + ธูป 7 ดอก' },
        visitor:   { en: 'Tourists, businesspeople, anyone in need', th: 'นักท่องเที่ยว นักธุรกิจ ทุกคนที่ต้องการ' },
        endpoint: '/wishes/any',
        lat: 13.7443,
        lng: 100.5409,
        body: {
            en: 'Bangkok\'s busiest spiritual node. Erected in 1956 to break a construction curse on the original Erawan Hotel and now drawing several thousand petitioners daily, the four-faced Brahmā at Ratchaprasong functions as the city\'s general-purpose endpoint for success — career, exams, family, travel, anything. The shrine pays its own dance troupe to perform commissioned offerings on the spot, the price of a dance set on a public board next to the booth.',
            th: 'จุดศักดิ์สิทธิ์ที่คนแน่นที่สุดในกรุงเทพฯ สร้างขึ้นปี 2499 เพื่อแก้คำสาปการก่อสร้างของโรงแรมเอราวัณเดิม ปัจจุบันมีผู้มาขอพรหลายพันคนต่อวัน พระพรหมสี่หน้าที่ราชประสงค์ทำหน้าที่เป็น endpoint อเนกประสงค์ของเมืองสำหรับความสำเร็จ — อาชีพ การสอบ ครอบครัว การเดินทาง ทุกอย่าง ศาลจ้างคณะนาฏศิลป์ของตัวเองให้แสดงรำแก้บนได้ทันที โดยมีราคาชุดการแสดงติดบนป้ายสาธารณะข้างซุ้ม',
        },
    },
    {
        id: 'trimurti',
        name:      { en: 'Trimurti Shrine',                        th: 'ศาลท้าวตรีมูรติ' },
        district:  { en: 'CentralWorld · Central Bangkok',         th: 'เซ็นทรัลเวิลด์ · กลางกรุงเทพฯ' },
        deity:     { en: 'Trimurti (Brahma + Vishnu + Shiva)',     th: 'ตรีมูรติ (พระพรหม + พระวิษณุ + พระศิวะ)' },
        specialty: { en: 'Love & romance',                         th: 'ความรักและคู่ครอง' },
        bestTime:  { en: 'Thursday · 9:30–10 PM',                  th: 'วันพฤหัสบดี · 21:30–22:00 น.' },
        offering:  { en: 'Red roses + red incense',                th: 'กุหลาบแดง + ธูปแดง' },
        visitor:   { en: 'Singles, couples',                       th: 'คนโสด คู่รัก' },
        endpoint: '/love/romance',
        lat: 13.7470,
        lng: 100.5395,
        body: {
            en: 'A specialised love endpoint at the north entrance of CentralWorld. Thursday nights between 9:30 and 10 PM are the only valid call window — the moment Thai folk tradition holds that the Trimurti descends to receive offerings. Crowds form on the sidewalk by 9 PM clutching odd-numbered red roses and red incense. Outside that window the queue is empty even though the shrine is open.',
            th: 'endpoint เฉพาะทางสำหรับเรื่องความรัก อยู่ทางเข้าด้านเหนือของเซ็นทรัลเวิลด์ คืนวันพฤหัสบดีระหว่าง 21:30 ถึง 22:00 น. คือช่วงเวลาเดียวที่ใช้ได้ — เป็นช่วงที่ความเชื่อพื้นบ้านไทยถือว่าตรีมูรติเสด็จลงมารับเครื่องบูชา ผู้คนเริ่มมาออกันบนทางเท้าตั้งแต่ 21:00 น. พร้อมกุหลาบแดงจำนวนคี่และธูปสีแดง นอกช่วงเวลานั้นไม่มีคิวเลยแม้ว่าศาลจะเปิดอยู่',
        },
    },
    {
        id: 'ganesh',
        name:      { en: 'Ganesh Shrine',                          th: 'ศาลพระพิฆเนศ' },
        district:  { en: 'Huai Khwang · East Bangkok',             th: 'ห้วยขวาง · กรุงเทพฯ ตะวันออก' },
        deity:     { en: 'Ganesha (Phra Phikanet)',                th: 'พระคเณศ (พระพิฆเนศ)' },
        specialty: { en: 'Career & creative success',              th: 'อาชีพและความสำเร็จด้านสร้างสรรค์' },
        bestTime:  { en: 'Tuesday & Thursday evenings',            th: 'เย็นวันอังคารและวันพฤหัสบดี' },
        offering:  { en: 'Marigolds, milk, modaks, fresh fruit',   th: 'ดอกดาวเรือง นม ขนมโมทกะ ผลไม้สด' },
        visitor:   { en: 'Artists, entrepreneurs, students',        th: 'ศิลปิน ผู้ประกอบการ นักศึกษา' },
        endpoint: '/career/creative',
        lat: 13.7779,
        lng: 100.5733,
        body: {
            en: 'The 9-metre bronze Ganesh on Ratchadaphisek Road, at the corner just north of Huai Khwang MRT, is Bangkok\'s flagship endpoint for career and creative requests. Built in the 2000s next to the Thai Cultural Centre, the shrine draws a constant stream of designers, founders, students, and TV-industry workers — the surrounding neighbourhood is one of the city\'s media-and-production clusters. The canonical visit days are Tuesday and Thursday evenings; offerings are marigolds, fresh milk, modaks, and any uncut fruit.',
            th: 'พระคเณศบรอนซ์สูง 9 เมตรบนถนนรัชดาภิเษก ที่หัวมุมเหนือสถานี MRT ห้วยขวาง คือ endpoint เรือธงของกรุงเทพฯ สำหรับคำขอเรื่องอาชีพและงานสร้างสรรค์ สร้างในยุค 2000 ข้างศูนย์วัฒนธรรมแห่งประเทศไทย ดึงดูดดีไซเนอร์ ผู้ก่อตั้งสตาร์ตอัป นักศึกษา และคนในวงการโทรทัศน์อย่างต่อเนื่อง — ย่านโดยรอบเป็นหนึ่งในศูนย์รวมสื่อและงานโปรดักชันของเมือง วันมาตรฐานคือเย็นวันอังคารและวันพฤหัสบดี เครื่องบูชาคือดอกดาวเรือง นมสด ขนมโมทกะ และผลไม้ที่ยังไม่ได้หั่น',
        },
    },
    {
        id: 'aikhai',
        name:      { en: 'Ai Khai Bangkok',                        th: 'ไอ้ไข่ กรุงเทพฯ' },
        district:  { en: 'Huai Khwang · East Bangkok',             th: 'ห้วยขวาง · กรุงเทพฯ ตะวันออก' },
        deity:     { en: 'Ai Khai (child spirit)',                 th: 'ไอ้ไข่ (วิญญาณเด็ก)' },
        specialty: { en: 'Fast wealth & lottery',                  th: 'ความรวยด่วนและหวย' },
        bestTime:  { en: 'Any time',                                th: 'ตลอดเวลา' },
        offering:  { en: 'Red drinks, toys, firecrackers',         th: 'เครื่องดื่มสีแดง ของเล่น ประทัด' },
        visitor:   { en: 'Lottery players, risk-takers',            th: 'คนเล่นหวย คนเสี่ยงโชค' },
        endpoint: '/wealth/fast',
        lat: 13.7700,
        lng: 100.5740,
        body: {
            en: 'A satellite outpost of the original Ai Khai shrine in Nakhon Si Thammarat — a child spirit specialised in fast money and lottery numbers. The viral peak between 2018 and 2021 turned this branch into a near-permanent crowd of risk-takers leaving stucco roosters, toy cars, and red sugary drinks. There is no canonical schedule; the shrine is on-demand.',
            th: 'สาขาย่อยของศาลไอ้ไข่ต้นตำรับที่นครศรีธรรมราช — วิญญาณเด็กที่เชี่ยวชาญเรื่องเงินด่วนและเลขหวย ช่วงไวรัลระหว่างปี 2561–2564 ทำให้สาขานี้กลายเป็นที่ออกันแทบถาวรของคนเสี่ยงโชค ทิ้งรูปไก่ปูนปั้น รถของเล่น และน้ำหวานสีแดงไว้เต็มลาน ไม่มีตารางเวลามาตรฐาน — ศาลเปิดให้บริการแบบ on-demand',
        },
    },
    {
        id: 'kuanyin',
        name:      { en: 'Kuan Yin Shrine',                        th: 'ศาลกวนอิม' },
        district:  { en: 'Chinatown · Yaowarat',                   th: 'เยาวราช · ไชน่าทาวน์' },
        deity:     { en: 'Guanyin (bodhisattva of mercy)',         th: 'กวนอิม (พระโพธิสัตว์แห่งความเมตตา)' },
        specialty: { en: 'Healing & mercy',                        th: 'การรักษาและความเมตตา' },
        bestTime:  { en: '1st & 15th lunar month',                 th: 'วันขึ้น 1 ค่ำและ 15 ค่ำ' },
        offering:  { en: 'Fruit + incense',                        th: 'ผลไม้ + ธูป' },
        visitor:   { en: 'Elderly, sick, devout',                  th: 'ผู้สูงอายุ ผู้ป่วย ผู้ศรัทธา' },
        endpoint: '/healing/mercy',
        lat: 13.7407,
        lng: 100.5097,
        body: {
            en: 'Bangkok\'s busiest Guanyin halls cluster along Yaowarat — the bodhisattva of mercy as imported through Sino-Thai families across two centuries. The 1st and 15th of every lunar month are the canonical visit days. Offerings are vegetarian: fruit, incense, lotus. The endpoint serves healing requests, family illness, and the elderly.',
            th: 'หอกวนอิมที่คนแน่นที่สุดของกรุงเทพฯ กระจุกอยู่ตามเยาวราช — พระโพธิสัตว์แห่งความเมตตาที่ถูกนำเข้าโดยตระกูลคนจีน-ไทยตลอดสองศตวรรษ วันขึ้น 1 ค่ำและ 15 ค่ำของทุกเดือนจันทรคติคือวันมาตรฐาน เครื่องบูชาเป็นมังสวิรัติ: ผลไม้ ธูป ดอกบัว endpoint นี้รับคำขอเรื่องการรักษาโรค ความเจ็บป่วยของครอบครัว และผู้สูงอายุ',
        },
    },
    {
        id: 'tubtim',
        name:      { en: 'Jao Mae Tubtim',                         th: 'เจ้าแม่ทับทิม' },
        district:  { en: 'Sukhumvit 3 · Sukhumvit',                th: 'สุขุมวิท 3 · สุขุมวิท' },
        deity:     { en: 'Chao Mae Tubtim (fertility goddess)',    th: 'เจ้าแม่ทับทิม (เทพีแห่งการเจริญพันธุ์)' },
        specialty: { en: 'Children & conception',                  th: 'ลูกและการตั้งครรภ์' },
        bestTime:  { en: 'Morning',                                 th: 'เช้า' },
        offering:  { en: 'Wooden phallus offerings',               th: 'เครื่องบูชาลึงค์ไม้แกะสลัก' },
        visitor:   { en: 'Couples wanting children',                th: 'คู่รักที่ต้องการมีบุตร' },
        endpoint: '/children/conceive',
        lat: 13.7445,
        lng: 100.5450,
        body: {
            en: 'A small, intensely-specialised shrine inside the Nai Lert garden complex on Sukhumvit. Almost the entire surface is covered in carved wooden phalluses left by petitioners — the offering associated with successful conception. Couples come quietly, leave their carved offering, and go. The shrine handles exactly one category of request and handles it well.',
            th: 'ศาลเล็กที่เน้นเฉพาะทางสุดๆ อยู่ในสวนนายเลิศบนถนนสุขุมวิท พื้นที่เกือบทั้งหมดถูกปกคลุมด้วยลึงค์ไม้แกะสลักที่ผู้มาขอพรนำมาถวาย — เครื่องบูชาที่เกี่ยวข้องกับการตั้งครรภ์ที่สำเร็จ คู่รักมาเงียบๆ วางเครื่องบูชาแล้วไป ศาลรับคำขอประเภทเดียวจริงๆ และทำได้ดี',
        },
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

/** Build the right-side detail card for a given shrine.
 *  Reads the active language live so a re-render after lang switch
 *  produces translated copy without restructuring the data. */
function detailHTML(shrine) {
    return `
        <h3 class="ch02-detail__name">${t(shrine.name)}</h3>
        <p class="ch02-detail__hood">${t(shrine.district)}</p>

        <hr class="ch02-detail__rule">

        <dl class="ch02-detail__list">
            <dt>${t(SHRINE_LABELS.deity)}</dt>      <dd>${t(shrine.deity)}</dd>
            <dt>${t(SHRINE_LABELS.specialty)}</dt>  <dd>${t(shrine.specialty)}</dd>
            <dt>${t(SHRINE_LABELS.bestTime)}</dt>   <dd>${t(shrine.bestTime)}</dd>
            <dt>${t(SHRINE_LABELS.offering)}</dt>   <dd>${t(shrine.offering)}</dd>
            <dt>${t(SHRINE_LABELS.visitor)}</dt>    <dd>${t(shrine.visitor)}</dd>
        </dl>

        <hr class="ch02-detail__rule">

        <div class="ch02-detail__pill">${pillHTML(shrine.endpoint)}</div>

        <p class="ch02-detail__body">${t(shrine.body)}</p>
    `;
}

/** Render the 6 mini cards into the horizontal scroll row.
 *  District is split on ' · ' for the short hood label — splitter works
 *  in both languages because we kept the ' · ' separator in TH names. */
function renderMiniCards(rowEl) {
    rowEl.innerHTML = SHRINES.map((s) => {
        const name = t(s.name);
        const district = t(s.district);
        const hood = district.split(' · ')[0];
        return `
            <li>
                <button class="ch02-mini" type="button"
                        data-shrine-id="${s.id}" data-active="false"
                        aria-label="Select ${name}">
                    <div class="ch02-mini__head">
                        <h4 class="ch02-mini__name">${name}</h4>
                        <p class="ch02-mini__hood">${hood}</p>
                    </div>
                    <hr class="ch02-mini__rule">
                    ${pillHTML(s.endpoint)}
                </button>
            </li>
        `;
    }).join('');
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

        const shrineName = t(shrine.name);
        const m = L.marker([shrine.lat, shrine.lng], {
            icon,
            alt: shrineName,
            keyboard: true,
            title: shrineName,
        }).addTo(map);

        m.bindTooltip(shrineName, {
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

    // ── Re-render on lang toggle ─────────────────────────
    // <html lang> is the canonical signal from lang-toggle.js. We rebuild
    // the mini cards (text + aria-label change), refresh marker tooltips,
    // and re-run activateShrine for the currently-active id so the detail
    // panel picks up the new translations.
    const langObserver = new MutationObserver(() => {
        // Mini cards — fully rebuilt
        renderMiniCards(rowEl);
        // Marker tooltips — Leaflet caches text, update inline
        if (markers) {
            SHRINES.forEach((s) => {
                const m = markers[s.id];
                if (!m) return;
                const name = t(s.name);
                m.setTooltipContent(name);
                const el = m.getElement?.();
                if (el) {
                    el.setAttribute('alt',   name);
                    el.setAttribute('title', name);
                }
            });
        }
        // Detail panel — re-render with current active shrine
        const currentId = rowEl
            .querySelector('[data-shrine-id][data-active="true"]')
            ?.dataset.shrineId || DEFAULT_SHRINE_ID;
        activateShrine(currentId, ctx);
    });
    langObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang'],
    });
}
