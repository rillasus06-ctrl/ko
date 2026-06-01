// landing.js — animations + floating poster background

const SAMPLE_MOVIES = [
  'tt0816692','tt0468569','tt1375666','tt0110912','tt0137523',
  'tt0245429','tt0167260','tt0073195','tt0120737','tt0266697'
];

async function fetchPosterUrls() {
  if (!window.CONFIG?.TMDB_KEY) return [];
  const ids = [
    550, 680, 13, 278, 240, 424, 389, 129, 637, 
    155, 27205, 122, 11, 1891, 1892
  ];
  const urls = [];
  await Promise.allSettled(ids.map(async id => {
    try {
      const r = await fetch(`${CONFIG.TMDB_BASE}/movie/${id}?api_key=${CONFIG.TMDB_KEY}`);
      const d = await r.json();
      if (d.poster_path) urls.push(CONFIG.TMDB_IMG + d.poster_path);
    } catch {}
  }));
  return urls;
}

function spawnPosters(urls) {
  const field = document.getElementById('posterField');
  if (!field || !urls.length) return;

  const count = Math.min(urls.length, 12);
  const cols = 6;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'poster-float';

    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = (col / (cols - 1)) * 85 + 2;
    const startY = 100 + row * 55 + Math.random() * 20;
    const width = 100 + Math.random() * 60;
    const rotation = (Math.random() - 0.5) * 14;
    const duration = 18 + Math.random() * 16;
    const delay = -(Math.random() * duration);
    const opacity = 0.12 + Math.random() * 0.18;

    el.style.cssText = `
      left: ${x}%;
      top: ${startY}%;
      width: ${width}px;
      --r: ${rotation}deg;
      --op: ${opacity};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    const img = document.createElement('img');
    img.src = urls[i];
    img.alt = '';
    img.loading = 'lazy';
    el.appendChild(img);
    field.appendChild(el);
  }
}

// also pull saved movie posters from localStorage
function getLocalPosterUrls() {
  try {
    const movies = JSON.parse(localStorage.getItem('vault_movies') || '[]');
    return movies.filter(m => m.poster).map(m => m.poster).slice(0, 6);
  } catch { return []; }
}

async function init() {
  // staggered text reveals
  const els = document.querySelectorAll('.reveal');
  els.forEach(el => {
    const delay = parseInt(el.dataset.delay || 0);
    setTimeout(() => el.classList.add('visible'), delay);
  });

  // floating posters
  const local = getLocalPosterUrls();
  const remote = await fetchPosterUrls();
  const combined = [...local, ...remote.filter(u => !local.includes(u))];
  spawnPosters(combined);
}

document.addEventListener('DOMContentLoaded', init);
