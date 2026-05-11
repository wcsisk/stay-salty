const SHEET_URLS = {
  itinerary: 'https://docs.google.com/spreadsheets/d/1tY7nPGrznVVvA2wj4WlR-FjYJXJf_C8nGP4gCoOo7o4/gviz/tq?tqx=out:json&sheet=Itinerary&headers=0',
  dinners:   'https://docs.google.com/spreadsheets/d/1tY7nPGrznVVvA2wj4WlR-FjYJXJf_C8nGP4gCoOo7o4/gviz/tq?tqx=out:json&sheet=Dinners&headers=0',
  outings:   'https://docs.google.com/spreadsheets/d/1tY7nPGrznVVvA2wj4WlR-FjYJXJf_C8nGP4gCoOo7o4/gviz/tq?tqx=out:json&sheet=Outings&headers=0',
  people:    'https://docs.google.com/spreadsheets/d/1tY7nPGrznVVvA2wj4WlR-FjYJXJf_C8nGP4gCoOo7o4/gviz/tq?tqx=out:json&sheet=People&headers=0',
  packing:   'https://docs.google.com/spreadsheets/d/1tY7nPGrznVVvA2wj4WlR-FjYJXJf_C8nGP4gCoOo7o4/gviz/tq?tqx=out:json&sheet=Packing&headers=0',
};

// Prefer the formatted value (f) over raw (v); handles gviz date objects cleanly.
function getCellValue(cell) {
  if (!cell || cell.v == null) return '';
  if (cell.f != null) return String(cell.f).trim();
  return String(cell.v).trim();
}

// Fetches a Google Sheets gviz JSON feed.
// Strips the /*O_o*/ JSONP wrapper, then uses the row at index 2 as column headers
// (rows 0–1 are the merged title/subtitle in these sheets).
async function fetchSheet(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let resp;
  try {
    resp = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();

  const jsonStr = text.replace(/^[^\{]*/, '').replace(/\);\s*$/, '');
  const { table } = JSON.parse(jsonStr);

  if (!table || !table.rows || table.rows.length < 4) return [];

  const headers = (table.rows[2].c || []).map(getCellValue);

  return table.rows.slice(3)
    .map(row => {
      const obj = {};
      (row.c || []).forEach((cell, i) => {
        const key = headers[i] || `col${i}`;
        obj[key] = getCellValue(cell);
      });
      return obj;
    })
    .filter(row => Object.values(row).some(v => v !== ''));
}
