// ─── Utilities ───────────────────────────────────────────────────────────────

let _uid = 0;
function uid() { return 'u' + (++_uid); }

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showSection(id, state, errorMsg) {
  const loading = document.getElementById(`${id}-loading`);
  const error   = document.getElementById(`${id}-error`);
  const content = document.getElementById(`${id}-content`);
  if (loading) loading.hidden = state !== 'loading';
  if (error)   { error.hidden = state !== 'error'; if (errorMsg) error.textContent = errorMsg; }
  if (content) content.hidden = state !== 'content';
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle) {
    toggle.addEventListener('click', e => { e.stopPropagation(); links.classList.toggle('nav-open'); });
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('nav-open'))
    );
    document.addEventListener('click', e => {
      if (!links.contains(e.target) && e.target !== toggle) links.classList.remove('nav-open');
    });
  }
  // Highlight the current page in the nav
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('nav-active', a.getAttribute('href') === page);
  });
}

// ─── Countdown ───────────────────────────────────────────────────────────────

function initCountdown() {
  const target = new Date('2026-05-30T16:00:00-04:00');
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
        document.getElementById(id).textContent = '0';
      });
      return;
    }
    document.getElementById('cd-days').textContent  = Math.floor(diff / 86400000);
    document.getElementById('cd-hours').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
    document.getElementById('cd-mins').textContent  = String(Math.floor((diff % 3600000)  / 60000)).padStart(2,'0');
    document.getElementById('cd-secs').textContent  = String(Math.floor((diff % 60000)    / 1000)).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);
}

// ─── Itinerary — cruise-app timeline style ───────────────────────────────────
// Sheet columns: Date, Day, Time, Activity, Location, Who
// (falls back: Time → Time Block, Location → Detail)

function renderItinerary(data) {
  _itineraryData = data;
  renderNowCard(data);
  const el = document.getElementById('itinerary-content');
  if (!data.length) { el.innerHTML = '<p class="empty-note">No itinerary data yet.</p>'; return; }

  // Group rows by Date, preserving order
  const days = {};
  for (const row of data) {
    const date = row['Date'] || 'TBD';
    if (!days[date]) days[date] = { label: row['Day'] || '', entries: [] };
    days[date].entries.push(row);
  }

  el.innerHTML = Object.entries(days).map(([date, { label, entries }], i) => {
    const eventsHtml = entries.map((e, idx) => {
      const time     = e['Time']     || e['Time Block'] || e['col2'] || '';
      const activity = e['Activity'] || '';
      const location = e['Location'] || e['Detail']     || '';
      const who      = e['Who']      || '';
      const isLast   = idx === entries.length - 1;

      return `
        <div class="cruise-entry">
          <div class="cruise-marker">
            <div class="cruise-dot"></div>
            ${isLast ? '' : '<div class="cruise-line"></div>'}
          </div>
          <div class="cruise-content">
            <div class="cruise-activity-row">
              <span class="cruise-activity">${esc(activity)}</span>
              ${time ? `<span class="cruise-time">${esc(time)}</span>` : ''}
            </div>
            ${location ? `<div class="cruise-location">&#128205; ${esc(location)}</div>` : ''}
            ${who      ? `<div class="cruise-who">${esc(who)}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    const count = entries.length;
    return `
      <details class="day-block"${i === 0 ? ' open' : ''}>
        <summary>
          <span class="day-header-date">${esc(date)}${label ? ` &mdash; ${esc(label)}` : ''}</span>
          <span class="day-header-count">${count} ${count === 1 ? 'activity' : 'activities'}</span>
          <span class="day-arrow">&#9660;</span>
        </summary>
        <div class="day-events">${eventsHtml}</div>
      </details>`;
  }).join('');
}

// ─── Dinners ─────────────────────────────────────────────────────────────────
// Columns: Date, Night, Restaurant/Meal, Type, Address, Reservation Time, Notes

function renderDinners(data) {
  const el = document.getElementById('dinners-content');
  if (!data.length) { el.innerHTML = '<p class="empty-note">No dinner data found.</p>'; return; }

  el.innerHTML = data.map(d => {
    const addr = d['Address'] || '';
    const mapsHref = addr ? `https://maps.google.com/?q=${encodeURIComponent(addr)}` : '';
    return `
      <div class="dinner-card">
        <div class="dinner-night">${esc(d['Night'] || d['Date'] || '')}</div>
        <div class="dinner-name">${esc(d['Restaurant/Meal'] || '')}</div>
        ${d['Type'] ? `<div class="dinner-type">${esc(d['Type'])}</div>` : ''}
        <div class="dinner-meta">
          ${d['Reservation Time'] ? `
            <div class="dinner-meta-row">
              <span class="dinner-meta-label">Reservation</span>
              <span>${esc(d['Reservation Time'])}</span>
            </div>` : ''}
          ${addr ? `
            <div class="dinner-meta-row">
              <span class="dinner-meta-label">Address</span>
              <span>${esc(addr)}</span>
            </div>` : ''}
          ${d['Notes'] ? `
            <div class="dinner-meta-row">
              <span class="dinner-meta-label">Notes</span>
              <span>${esc(d['Notes'])}</span>
            </div>` : ''}
        </div>
        ${mapsHref ? `<a class="dinner-maps-link" href="${esc(mapsHref)}" target="_blank" rel="noopener noreferrer">View on Google Maps &#8599;</a>` : ''}
      </div>`;
  }).join('');
}

// ─── Outings ─────────────────────────────────────────────────────────────────
// Columns: Activity, Category, Suggested Day, Time, Cost, Good For, Notes/Booking

function renderOutings(data) {
  const el       = document.getElementById('outings-content');
  const controls = document.getElementById('outings-controls');
  if (!data.length) { el.innerHTML = '<p class="empty-note">No outings data found.</p>'; return; }

  controls.hidden = false;
  el.innerHTML = data.map(o => {
    const cat = o['Category'] || '';
    return `
      <div class="outing-card" data-category="${esc(cat)}">
        <div class="outing-header">
          <div class="outing-name">${esc(o['Activity'] || '')}</div>
          ${cat ? `<span class="category-badge badge-${esc(cat)}">${esc(cat)}</span>` : ''}
        </div>
        <div class="outing-meta">
          ${o['Suggested Day'] ? `<div><strong>Day:</strong> ${esc(o['Suggested Day'])}</div>` : ''}
          ${o['Time']          ? `<div><strong>Time:</strong> ${esc(o['Time'])}</div>` : ''}
          ${o['Cost']          ? `<div><strong>Cost:</strong> ${esc(o['Cost'])}</div>` : ''}
          ${o['Good For']      ? `<div><strong>Good for:</strong> ${esc(o['Good For'])}</div>` : ''}
        </div>
        ${o['Notes/Booking'] ? `<div class="outing-notes">${esc(o['Notes/Booking'])}</div>` : ''}
      </div>`;
  }).join('');

  controls.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      controls.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      el.querySelectorAll('.outing-card').forEach(card => {
        card.hidden = f !== 'all' && card.dataset.category !== f;
      });
    });
  });
}

// ─── People ──────────────────────────────────────────────────────────────────
// Columns: Name, Family Unit, Role, Arrives, Leaves, Room, Initials, Avatar Color

function renderPeople(data) {
  const el = document.getElementById('people-content');
  if (!data.length) { el.innerHTML = '<p class="empty-note">No people data found.</p>'; return; }

  el.innerHTML = data.map(p => {
    const color    = p['Avatar Color'] || '#1A4D66';
    const initials = p['Initials'] ||
      (p['Name'] || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return `
      <div class="person-card">
        <div class="avatar" style="background-color:${esc(color)}">${esc(initials)}</div>
        <div class="person-name">${esc(p['Name'] || '')}</div>
        ${p['Family Unit'] ? `<div class="person-family">${esc(p['Family Unit'])}</div>` : ''}
        ${p['Role']        ? `<div class="person-role">${esc(p['Role'])}</div>` : ''}
        <div class="person-details">
          ${p['Arrives'] ? `<div>Arrives: ${esc(p['Arrives'])}</div>` : ''}
          ${p['Leaves']  ? `<div>Leaves: ${esc(p['Leaves'])}</div>` : ''}
          ${p['Room']    ? `<div>Room: ${esc(p['Room'])}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ─── Packing ─────────────────────────────────────────────────────────────────
// Columns: Item, Category, Assigned To, Packed?, Notes

const LS_PREFIX = 'staySalty2026_packed_';

function renderPacking(data) {
  const el           = document.getElementById('packing-content');
  const progressWrap = document.getElementById('packing-progress');
  if (!data.length) { el.innerHTML = '<p class="empty-note">No packing data found.</p>'; return; }

  progressWrap.hidden = false;

  const byCategory = {};
  for (const row of data) {
    const cat = row['Category'] || 'General';
    (byCategory[cat] = byCategory[cat] || []).push(row);
  }

  el.innerHTML = Object.entries(byCategory).map(([cat, items]) => {
    const rows = items.map(item => {
      const key       = LS_PREFIX + encodeURIComponent(cat + '_' + (item['Item'] || ''));
      const isChecked = localStorage.getItem(key) === '1';
      const id        = uid();
      const sub       = [item['Assigned To'], item['Notes']].filter(Boolean).join(' · ');
      return `
        <div class="packing-item${isChecked ? ' checked' : ''}">
          <input type="checkbox" class="packing-checkbox" id="${id}"
            ${isChecked ? 'checked' : ''} data-key="${esc(key)}">
          <label class="packing-item-label" for="${id}">
            <div class="packing-item-name">${esc(item['Item'] || '')}</div>
            ${sub ? `<div class="packing-item-sub">${esc(sub)}</div>` : ''}
          </label>
        </div>`;
    }).join('');

    return `
      <div class="packing-group">
        <div class="packing-category-header">
          <span>${esc(cat)}</span>
          <span class="packing-count"></span>
        </div>
        ${rows}
      </div>`;
  }).join('');

  el.addEventListener('change', e => {
    if (!e.target.matches('.packing-checkbox')) return;
    const key  = e.target.dataset.key;
    const wrap = e.target.closest('.packing-item');
    if (e.target.checked) { localStorage.setItem(key, '1'); wrap.classList.add('checked'); }
    else                  { localStorage.removeItem(key);   wrap.classList.remove('checked'); }
    updatePackingProgress();
  });

  updatePackingProgress();
}

function updatePackingProgress() {
  const all     = document.querySelectorAll('.packing-checkbox');
  const checked = document.querySelectorAll('.packing-checkbox:checked');
  const pct     = all.length ? Math.round(checked.length / all.length * 100) : 0;
  document.getElementById('packing-bar').style.width   = pct + '%';
  document.getElementById('packing-label').textContent =
    `${checked.length} of ${all.length} items packed (${pct}%)`;
  document.querySelectorAll('.packing-group').forEach(group => {
    const total = group.querySelectorAll('.packing-checkbox').length;
    const done  = group.querySelectorAll('.packing-checkbox:checked').length;
    group.querySelector('.packing-count').textContent = `${done}/${total}`;
  });
}

// ─── Gallery (Cloudinary) ────────────────────────────────────────────────────

const CLOUD_NAME    = 'dgy6efs3i';
const UPLOAD_PRESET = 'stay-salty-uploads';
const PHOTO_TAG     = 'stay-salty-2026';

const GALLERY_PLACEHOLDERS = [
  { year:'2018', emoji:'🏖️', label:'Beach Day' },
  { year:'2018', emoji:'🌅', label:'Sunset Views' },
  { year:'2018', emoji:'🦀', label:'Crab Night' },
  { year:'2019', emoji:'🌊', label:'First Stay Salty' },
  { year:'2019', emoji:'🏄', label:'Surf Session' },
  { year:'2019', emoji:'🍹', label:'Happy Hour' },
  { year:'2020', emoji:'🏠', label:'Stayed Home' },
  { year:'2021', emoji:'🌴', label:'Return to IOP' },
  { year:'2021', emoji:'🐚', label:'Shell Hunting' },
  { year:'2021', emoji:'🦞', label:'Seafood Feast' },
  { year:'2022', emoji:'🎣', label:'Fishing Trip' },
  { year:'2022', emoji:'🏊', label:'Pool Day' },
  { year:'2022', emoji:'🎆', label:'Fireworks Night' },
  { year:'2023', emoji:'🏖️', label:'Beach Day' },
  { year:'2023', emoji:'🌅', label:'Sunset Cruise' },
  { year:'2023', emoji:'🦞', label:'Seafood Feast' },
  { year:'2023', emoji:'🏄', label:'Surf Lessons' },
  { year:'2023', emoji:'🌊', label:'Wave Runners' },
  { year:'2023', emoji:'🦀', label:'Crab Shack Night' },
  { year:'2024', emoji:'🐚', label:'Shell Hunting' },
  { year:'2024', emoji:'🏊', label:'Pool Day' },
  { year:'2024', emoji:'🎣', label:'Fishing Trip' },
  { year:'2024', emoji:'🍹', label:'Happy Hour' },
  { year:'2024', emoji:'🌴', label:'Fort Moultrie Visit' },
  { year:'2024', emoji:'🎆', label:'Fireworks Night' },
  { year:'2025', emoji:'🚣', label:'Kayaking' },
  { year:'2025', emoji:'🐬', label:'Dolphin Watch' },
  { year:'2025', emoji:'🍦', label:'Ice Cream Run' },
  { year:'2025', emoji:'📸', label:'Family Portrait' },
  { year:'2025', emoji:'🛒', label:'Market Day' },
  { year:'2025', emoji:'🎵', label:'Live Music Night' },
];

let _cloudPhotos   = [];
let _galleryWidget = null;
let _activeYear    = 'all';

const LS_YEAR_KEY = 'ssPhotoYear_';
function savePhotoYear(publicId, year) {
  try { localStorage.setItem(LS_YEAR_KEY + publicId, year); } catch {}
}
function getPhotoYear(publicId, fallback) {
  try { return localStorage.getItem(LS_YEAR_KEY + publicId) || fallback; } catch { return fallback; }
}


function cloudThumbUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_600,h_600,c_fill,q_auto,f_auto/${publicId}`;
}
function cloudFullUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${publicId}`;
}

function renderGalleryGrid(photos, yr) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const filtered  = yr === 'all' ? photos : photos.filter(p => p.year === yr);
  const photosWithData = new Set(photos.map(p => p.year));

  const realHtml = filtered.map(p => `
    <div class="gallery-card gallery-photo" data-year="${esc(p.year)}"
         data-full="${esc(cloudFullUrl(p.publicId))}" role="button" tabindex="0" aria-label="View photo from ${esc(p.year)}">
      <img src="${esc(cloudThumbUrl(p.publicId))}" alt="Stay Salty ${esc(p.year)}" loading="lazy">
      <div class="gallery-photo-meta"><span class="gallery-year-tag">${esc(p.year)}</span></div>
    </div>`).join('');

  const phHtml = GALLERY_PLACEHOLDERS
    .filter(p => yr === 'all' ? !photosWithData.has(p.year) : p.year === yr && !photosWithData.has(p.year))
    .map(p => `
      <div class="gallery-card" data-year="${p.year}">
        <span class="gallery-emoji">${p.emoji}</span>
        <span class="gallery-label">${esc(p.label)}</span>
        <span class="gallery-year-tag">${p.year}</span>
      </div>`).join('');

  const show2026 = !photosWithData.has('2026') && (yr === 'all' || yr === '2026');
  const upcomingHtml = show2026 ? `
    <div class="gallery-card gallery-card-upcoming" data-year="2026">
      <span class="gallery-emoji">⭐</span>
      <span class="gallery-label">Coming this summer!</span>
      <span class="gallery-year-tag">2026</span>
    </div>` : '';

  grid.innerHTML = realHtml + phHtml + upcomingHtml;

  grid.querySelectorAll('.gallery-photo').forEach(card => {
    const open = () => openLightbox(card.dataset.full);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });
}

function openLightbox(src) {
  const lb = document.getElementById('gallery-lightbox');
  if (!lb) return;
  lb.querySelector('.lightbox-img').src = src;
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('gallery-lightbox');
  if (!lb) return;
  lb.hidden = true;
  lb.querySelector('.lightbox-img').src = '';
  document.body.style.overflow = '';
}

function initLightbox() {
  const lb = document.getElementById('gallery-lightbox');
  if (!lb) return;
  lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

function loadCloudinaryScript() {
  return new Promise(resolve => {
    if (window.cloudinary) { resolve(); return; }
    const s = document.createElement('script');
    s.src    = 'https://upload-widget.cloudinary.com/global/all.js';
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

async function initGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  renderGalleryGrid([], 'all');

  // Fetch all tagged photos from Cloudinary (requires "Resource list" in Cloudinary → Settings → Security)
  try {
    const res  = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${PHOTO_TAG}.json`);
    const data = await res.json();
    _cloudPhotos = (data.resources || [])
      .map(r => {
        // Try folder path first (e.g. "stay-salty/2023/img"), then localStorage, then created_at
        const pathYear = r.public_id.split('/').find(p => /^20\d{2}$/.test(p));
        const fallback = pathYear || new Date(r.created_at).getFullYear().toString();
        return {
          publicId:  r.public_id,
          year:      getPhotoYear(r.public_id, fallback),
          createdAt: r.created_at,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderGalleryGrid(_cloudPhotos, _activeYear);
  } catch { /* resource list not enabled yet — grid shows placeholders */ }

  function updateUploadLabel() {
    const lbl = document.getElementById('upload-btn-label');
    if (lbl) lbl.textContent = _activeYear === 'all' ? 'Add a Photo' : `Add a ${_activeYear} Photo`;
  }

  document.querySelectorAll('.gallery-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gallery-filter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _activeYear = btn.dataset.year;
      renderGalleryGrid(_cloudPhotos, _activeYear);
      updateUploadLabel();
    });
  });

  initLightbox();

  await loadCloudinaryScript();
  const uploadBtn = document.getElementById('gallery-upload-btn');
  if (!uploadBtn || !window.cloudinary) return;

  const WIDGET_STYLES = {
    palette: {
      window:          '#FFFDF7',
      windowBorder:    '#1A4D66',
      tabIcon:         '#E07A5F',
      menuIcons:       '#1A4D66',
      textDark:        '#1a2e3b',
      textLight:       '#FFFDF7',
      link:            '#E07A5F',
      action:          '#1A4D66',
      inactiveTabIcon: '#7a99aa',
      error:           '#f44235',
      inProgress:      '#1A4D66',
      complete:        '#3D6B4F',
      sourceBg:        '#F5EFE0',
    },
  };

  uploadBtn.addEventListener('click', () => {
    const uploadYear = _activeYear !== 'all' ? _activeYear : new Date().getFullYear().toString();
    const widget = window.cloudinary.createUploadWidget({
      cloudName:    CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      folder:       `stay-salty/${uploadYear}`,
      sources:      ['local', 'camera'],
      multiple:     true,
      maxFiles:     20,
      cropping:     false,
      showAdvancedOptions:  false,
      showCompletedButton:  true,
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'heic', 'webp'],
      maxImageFileSize:     20000000,
      styles:       WIDGET_STYLES,
    }, (error, result) => {
      if (!error && result?.event === 'success') {
        const pid = result.info.public_id;
        savePhotoYear(pid, uploadYear);
        const newPhoto = { publicId: pid, year: uploadYear, createdAt: new Date().toISOString() };
        _cloudPhotos = [newPhoto, ..._cloudPhotos];
        renderGalleryGrid(_cloudPhotos, _activeYear);
      }
    });
    widget.open();
  });
}

// ─── Live Conditions: Weather · Waves · Tides ────────────────────────────────
// Weather + waves: Open-Meteo (free, no key, CORS-open)
// Tides: NOAA Tides & Currents API, station 8665530 (Charleston, SC)

const IOP_LAT = 32.7868;
const IOP_LNG = -79.7630;

const WMO_ICONS = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
  45:'🌫️', 48:'🌫️',
  51:'🌦️', 53:'🌦️', 55:'🌧️',
  61:'🌧️', 63:'🌧️', 65:'🌧️',
  71:'❄️', 73:'❄️', 75:'❄️', 77:'🌨️',
  80:'🌦️', 81:'🌦️', 82:'🌧️',
  95:'⛈️', 96:'⛈️', 99:'⛈️',
};
function wmoIcon(c) { return WMO_ICONS[c] || '🌡️'; }
function wmoDesc(c) {
  if (c === 0)  return 'Clear';
  if (c <= 2)   return 'Partly Cloudy';
  if (c === 3)  return 'Overcast';
  if (c <= 48)  return 'Foggy';
  if (c <= 55)  return 'Drizzle';
  if (c <= 67)  return 'Rain';
  if (c <= 77)  return 'Snow';
  if (c <= 82)  return 'Showers';
  if (c <= 99)  return 'Thunderstorm';
  return 'Cloudy';
}

function injectNavConditions() {
  const inner = document.querySelector('.nav-inner');
  if (!inner || document.getElementById('nav-conditions')) return;
  const w = document.createElement('div');
  w.id        = 'nav-conditions';
  w.className = 'nav-conditions';
  w.innerHTML =
    '<span id="nc-weather" class="nc-item nc-loading">&#9729;&#65039;</span>' +
    '<span class="nc-sep">&middot;</span>'                                   +
    '<span id="nc-surf"    class="nc-item nc-loading">&#127754;</span>'      +
    '<span class="nc-sep">&middot;</span>'                                   +
    '<span id="nc-tide"    class="nc-item nc-loading">&#8593;</span>'        +
    '<span class="nc-sep">&middot;</span>'                                   +
    '<span id="nc-sun"     class="nc-item nc-loading">&#127769;</span>';
  inner.insertBefore(w, inner.querySelector('.nav-toggle'));
}

// Parse an ISO datetime string ("2026-05-30T06:12") to 12-hour time without
// any timezone conversion — Open-Meteo returns times already in local time.
function to12hr(isoStr) {
  const [h, m] = isoStr.slice(11, 16).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// Writes the same data to both the desktop nav widget and the mobile hero pills.
function setCondEl(navId, heroId, html) {
  const n = document.getElementById(navId);
  const h = document.getElementById(heroId);
  if (n) { n.classList.remove('nc-loading'); n.innerHTML = html; }
  if (h) { h.classList.remove('hc-loading'); h.innerHTML = html; }
}

async function loadConditions() {
  injectNavConditions();

  // ── Weather ──────────────────────────────────────────────────────────────
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${IOP_LAT}&longitude=${IOP_LNG}` +
        `&current=temperature_2m,weather_code,wind_speed_10m` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph`)
    .then(r => r.json())
    .then(({ current: c }) => {
      const icon = wmoIcon(c.weather_code);
      const desc = wmoDesc(c.weather_code);
      const temp = Math.round(c.temperature_2m);
      const wind = c.wind_speed_10m ? ` &middot; ${Math.round(c.wind_speed_10m)} mph` : '';
      setCondEl('nc-weather', 'hc-weather',
        `${icon}&thinsp;<strong>${temp}&deg;F</strong><span class="nc-sub">${desc}${wind}</span>`);
    })
    .catch(() => setCondEl('nc-weather', 'hc-weather', '&#9729;&#65039; —'));

  // ── Waves (Open-Meteo Marine) ─────────────────────────────────────────────
  fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${IOP_LAT}&longitude=${IOP_LNG}` +
        `&current=wave_height,wave_period&length_unit=imperial`)
    .then(r => r.json())
    .then(({ current: c }) => {
      const ht  = c.wave_height != null ? c.wave_height.toFixed(1) : '—';
      const per = c.wave_period != null ? ` &middot; ${Math.round(c.wave_period)}s` : '';
      setCondEl('nc-surf', 'hc-surf',
        `🌊&thinsp;<strong>${ht} ft</strong><span class="nc-sub">Waves${per}</span>`);
    })
    .catch(() => setCondEl('nc-surf', 'hc-surf', '🌊 —'));

  // ── Tides (NOAA station 8665530 — Charleston, SC) ─────────────────────────
  const fmt = d => d.toISOString().slice(0,10).replace(/-/g,'');
  const t0  = new Date();
  const t1  = new Date(); t1.setDate(t1.getDate() + 1);
  fetch(`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
        `?product=predictions&datum=MLLW&station=8665530&time_zone=lst_ldt` +
        `&interval=hilo&units=english&application=web_services&format=json` +
        `&begin_date=${fmt(t0)}&end_date=${fmt(t1)}`)
    .then(r => r.json())
    .then(({ predictions }) => {
      const now  = Date.now();
      const next = (predictions || []).find(p => new Date(p.t).getTime() > now);
      if (!next) { setCondEl('nc-tide','hc-tide','&#8593; Tides N/A'); return; }
      const isHigh = next.type === 'H';
      const arrow  = isHigh ? '↑' : '↓';
      const label  = isHigh ? 'High' : 'Low';
      const hgt    = parseFloat(next.v).toFixed(1);
      const tStr   = new Date(next.t).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });
      setCondEl('nc-tide', 'hc-tide',
        `${arrow}&thinsp;<strong>${label} ${tStr}</strong><span class="nc-sub">${hgt} ft</span>`);
    })
    .catch(() => setCondEl('nc-tide', 'hc-tide', '&#8593; Tides N/A'));

  // ── Sunrise / Sunset (Open-Meteo daily) ──────────────────────────────────
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${IOP_LAT}&longitude=${IOP_LNG}` +
        `&daily=sunrise,sunset&timezone=America%2FNew_York&forecast_days=1`)
    .then(r => r.json())
    .then(({ daily }) => {
      const rise = to12hr(daily.sunrise[0]);
      const set  = to12hr(daily.sunset[0]);
      setCondEl('nc-sun', 'hc-sun',
        `&#127774;&thinsp;<strong>${rise}</strong>` +
        `<span class="nc-sub">rise &middot;</span>` +
        `<strong>${set}</strong><span class="nc-sub">set</span>`);
    })
    .catch(() => setCondEl('nc-sun', 'hc-sun', '&#127774; —'));
}

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────────

const BN_SVG = {
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  cal:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  fork: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6h3.5"/><path d="M16.5 13H20v9"/></svg>`,
  comp: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  grid: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
};

const BN_MAIN = [
  { href:'index.html',     svg:BN_SVG.home, label:'Home'     },
  { href:'itinerary.html', svg:BN_SVG.cal,  label:'Plan'     },
  { href:'dinners.html',   svg:BN_SVG.fork, label:'Eat'      },
  { href:'outings.html',   svg:BN_SVG.comp, label:'Explore'  },
];
const BN_MORE = [
  { href:'people.html',  label:'People'  },
  { href:'packing.html', label:'Packing' },
  { href:'gallery.html', label:'Gallery' },
  { href:'history.html', label:'History' },
];

function injectBottomNav() {
  if (document.getElementById('bottom-nav')) return;
  const page = location.pathname.split('/').pop() || 'index.html';

  const nav = document.createElement('nav');
  nav.id = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = BN_MAIN.map(item =>
    `<a href="${item.href}" class="bn-item${item.href === page ? ' bn-active' : ''}" aria-label="${item.label}">
       ${item.svg}<span>${item.label}</span>
     </a>`
  ).join('') +
  `<button class="bn-item${BN_MORE.some(i=>i.href===page)?' bn-active':''}" id="bn-more" aria-label="More">
     ${BN_SVG.grid}<span>More</span>
   </button>`;
  document.body.appendChild(nav);

  const drawer = document.createElement('div');
  drawer.id = 'bn-drawer';
  drawer.hidden = true;
  drawer.innerHTML = `<div class="bn-drawer-grid">${
    BN_MORE.map(item =>
      `<a href="${item.href}" class="bn-drawer-item${item.href===page?' bn-active':''}">${item.label}</a>`
    ).join('')
  }</div>`;
  document.body.appendChild(drawer);

  document.getElementById('bn-more').addEventListener('click', e => {
    e.stopPropagation();
    drawer.hidden = !drawer.hidden;
  });
  document.addEventListener('click', e => {
    if (!drawer.hidden && !drawer.contains(e.target) && e.target.id !== 'bn-more')
      drawer.hidden = true;
  });
}

// ─── Right Now Card ──────────────────────────────────────────────────────────

let _itineraryData = null;

function estNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function parseEntryTime(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function renderNowCard(data) {
  const el = document.getElementById('itinerary-now');
  if (!el) return;

  const now = estNow();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const tripStart = new Date('2026-05-30T16:00:00-04:00');
  const tripEnd   = new Date('2026-06-06T10:00:00-04:00');

  if (now < tripStart) {
    const days = Math.ceil((tripStart - now) / 86400000);
    el.innerHTML = `<div class="now-card">
      <div class="now-eyebrow">Coming Up</div>
      <div class="now-activity">&#127958; ${days} day${days !== 1 ? 's' : ''} until Stay Salty!</div>
      <div class="now-detail">May 30 &ndash; June 6 &middot; 712 Ocean Blvd, Isle of Palms</div>
    </div>`;
    return;
  }

  if (now > tripEnd) {
    el.innerHTML = `<div class="now-card">
      <div class="now-eyebrow">See You Next Year</div>
      <div class="now-activity">&#127754; Another legendary trip in the books!</div>
      <div class="now-detail">Thanks for a great Stay Salty 2026.</div>
    </div>`;
    return;
  }

  if (!data || !data.length) {
    el.innerHTML = `<div class="now-card">
      <div class="now-eyebrow">Right Now</div>
      <div class="now-activity">Loading today&rsquo;s schedule&hellip;</div>
    </div>`;
    return;
  }

  // Today's date string in the same locale format as the sheet (e.g. "5/30/2026")
  const todayStr = now.toLocaleDateString('en-US', { month:'numeric', day:'numeric', year:'numeric' });

  const todayEntries = data.filter(e => {
    const raw = e['Date'] || '';
    if (!raw) return false;
    // Normalise the sheet date to the same locale string for comparison
    const d = new Date(raw);
    if (isNaN(d)) return false;
    return d.toLocaleDateString('en-US', { month:'numeric', day:'numeric', year:'numeric' }) === todayStr;
  });

  if (!todayEntries.length) {
    el.innerHTML = `<div class="now-card">
      <div class="now-eyebrow">Today</div>
      <div class="now-activity">&#127796; Free day &mdash; enjoy the beach!</div>
    </div>`;
    return;
  }

  const timeOf = e => parseEntryTime(e['Time'] || e['Time Block'] || e['col2'] || '');
  const timed  = todayEntries.filter(e => timeOf(e) !== null);

  let current = null, next = null;
  for (const e of timed) {
    if (timeOf(e) <= nowMins) current = e;
    else if (!next)           next    = e;
  }
  if (!current) current = todayEntries[0];

  const activity = current['Activity'] || '';
  const location = current['Location'] || current['Detail'] || '';
  const timeStr  = current['Time'] || current['Time Block'] || current['col2'] || '';
  const clockStr = now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });

  let html = `<div class="now-card">
    <div class="now-eyebrow">Right Now &middot; ${clockStr} EST</div>
    <div class="now-activity">${esc(activity)}</div>`;

  const parts = [timeStr, location].filter(Boolean);
  if (parts.length) html += `<div class="now-detail">${parts.map(esc).join(' &middot; ')}</div>`;

  if (next) {
    const nt = next['Time'] || next['Time Block'] || next['col2'] || '';
    html += `<div class="now-next">Up next: <strong>${esc(next['Activity'] || '')}</strong>${nt ? ` &middot; ${esc(nt)}` : ''}</div>`;
  }

  html += `</div>`;
  el.innerHTML = html;
}

// ─── History ─────────────────────────────────────────────────────────────────

function initHistory() {
  const filter = document.querySelector('.history-filter');
  if (!filter) return;
  filter.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const yr = btn.dataset.year;
      document.querySelectorAll('.timeline-item').forEach(item => {
        item.hidden = yr !== 'all' && item.dataset.year !== yr;
      });
    });
  });
}

// ─── Boot ────────────────────────────────────────────────────────────────────

async function init() {
  initNav();
  injectBottomNav();
  loadConditions();
  if (document.getElementById('cd-days')) initCountdown();
  initGallery();
  initHistory();
  renderNowCard(null);
  setInterval(() => renderNowCard(_itineraryData), 60000);

  // Detect which data section(s) are on this page and load only those
  const pages = [
    { id: 'itinerary', render: renderItinerary },
    { id: 'dinners',   render: renderDinners   },
    { id: 'outings',   render: renderOutings   },
    { id: 'people',    render: renderPeople    },
    { id: 'packing',   render: renderPacking   },
  ];

  const active = pages.filter(p => document.getElementById(`${p.id}-content`));
  if (!active.length) return;

  const results = await Promise.allSettled(active.map(p => fetchSheet(SHEET_URLS[p.id])));
  results.forEach((result, i) => {
    const { id, render } = active[i];
    if (result.status === 'fulfilled') {
      try { render(result.value); } catch (err) { console.error(`Render error (${id}):`, err); }
      showSection(id, 'content');
    } else {
      const hint = 'If opening as a local file, try Firefox or a local server (npx serve .).';
      showSection(id, 'error', `Could not load data. ${result.reason?.message || ''} ${hint}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
