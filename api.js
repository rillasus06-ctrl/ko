// api.js — TMDB search + vinyl disc SVG generator

const API = {

  // Search movies or TV shows
  async search(query, type = 'movie') {
    if (!query || !CONFIG?.TMDB_KEY) return [];
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const r = await fetch(
      `${CONFIG.TMDB_BASE}/search/${endpoint}?api_key=${CONFIG.TMDB_KEY}&query=${encodeURIComponent(query)}&page=1`
    );
    const d = await r.json();
    return (d.results || []).slice(0, 6).map(item => ({
      id: item.id,
      title: item.title || item.name,
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      poster: item.poster_path ? CONFIG.TMDB_IMG + item.poster_path : null,
      type: endpoint,
    }));
  },

  // Debounced search
  searchDebounced: null,
  debounceSearch(query, type, cb, delay = 400) {
    clearTimeout(this.searchDebounced);
    this.searchDebounced = setTimeout(async () => {
      const results = await this.search(query, type);
      cb(results);
    }, delay);
  },
};

// ─── Vinyl disc SVG generator ─────────────────────────────────────────────────
function makeVinylSVG(title) {
  // Generate a color from the title string
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  const labelColor = `hsl(${hue}, 40%, 22%)`;
  const labelAccent = `hsl(${hue}, 60%, 65%)`;
  const grooveColor = `hsl(${hue}, 10%, 16%)`;

  const initials = title.split(' ').slice(0,2).map(w => w[0]?.toUpperCase() || '').join('');
  const shortTitle = title.length > 14 ? title.slice(0, 14) + '…' : title;

  return `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="vinyl-${hash}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1a1a1a"/>
        <stop offset="100%" stop-color="#0a0a0a"/>
      </radialGradient>
    </defs>
    <!-- outer disc -->
    <circle cx="80" cy="80" r="78" fill="url(#vinyl-${hash})"/>
    <!-- grooves -->
    ${[30,35,40,45,50,55,60,65].map(r =>
      `<circle cx="80" cy="80" r="${r}" fill="none" stroke="${grooveColor}" stroke-width="1"/>`
    ).join('')}
    <!-- label -->
    <circle cx="80" cy="80" r="26" fill="${labelColor}"/>
    <!-- spindle -->
    <circle cx="80" cy="80" r="4" fill="#0a0a0a"/>
    <!-- label ring -->
    <circle cx="80" cy="80" r="26" fill="none" stroke="${labelAccent}" stroke-width="0.5"/>
    <!-- initials -->
    <text x="80" y="77" text-anchor="middle" font-family="Playfair Display, serif" 
      font-size="11" font-style="italic" fill="${labelAccent}" dy="0">${initials}</text>
    <text x="80" y="89" text-anchor="middle" font-family="DM Mono, monospace" 
      font-size="5.5" fill="${labelAccent}" opacity="0.7">${shortTitle}</text>
  </svg>`;
}
