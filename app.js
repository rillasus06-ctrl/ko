// app.js — vault logic, Supabase sync

const CATEGORIES = [
  { id: 'movies', label: 'films',  type: 'movie' },
  { id: 'shows',  label: 'shows',  type: 'tv'    },
  { id: 'books',  label: 'books',  type: null     },
  { id: 'music',  label: 'music',  type: null     },
  { id: 'games',  label: 'games',  type: null     },
  { id: 'custom', label: 'custom', type: null     },
];

let activeCat = 'movies';
let currentUser = null;
let cachedItems = {};

// ─── Supabase DB ───────────────────────────────────────────────────────────────
const DB = {
  async fetchAll() {
    if (!Auth.client || !currentUser) return {};
    const { data, error } = await Auth.client
      .from('vault_items')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return {}; }
    const grouped = {};
    CATEGORIES.forEach(c => grouped[c.id] = []);
    data.forEach(row => {
      if (grouped[row.category]) grouped[row.category].push(row);
    });
    return grouped;
  },

  async add(category, item) {
    if (!Auth.client || !currentUser) return null;
    const { data, error } = await Auth.client
      .from('vault_items')
      .insert({ user_id: currentUser.id, category, ...item })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    return data;
  },

  async remove(id) {
    if (!Auth.client || !currentUser) return;
    await Auth.client.from('vault_items').delete().eq('id', id);
  },
};

// ─── tabs ──────────────────────────────────────────────────────────────────────
function renderTabs() {
  const nav = document.getElementById('catNav');
  nav.innerHTML = CATEGORIES.map(c => {
    const count = (cachedItems[c.id] || []).length;
    return `<button class="cat-btn ${c.id === activeCat ? 'active' : ''}"
      onclick="switchCat('${c.id}')">${c.label}${count ? `<span class="count">${count}</span>` : ''}</button>`;
  }).join('');
}

function switchCat(id) {
  activeCat = id;
  renderTabs();
  renderContent();
}

// ─── content ───────────────────────────────────────────────────────────────────
function renderContent() {
  const posterStage   = document.getElementById('posterStage');
  const discStage     = document.getElementById('discStage');
  const editorialGrid = document.getElementById('editorialGrid');
  const emptyState    = document.getElementById('emptyState');
  const label         = document.getElementById('sectionLabel');

  const cat   = CATEGORIES.find(c => c.id === activeCat);
  const items = cachedItems[activeCat] || [];

  label.textContent = cat.label;
  [posterStage, discStage, editorialGrid, emptyState].forEach(el => el.hidden = true);

  if (!items.length) { emptyState.hidden = false; return; }

  if (activeCat === 'movies' || activeCat === 'shows') {
    posterStage.hidden = false;
    renderPosters(items, posterStage);
  } else if (activeCat === 'music') {
    discStage.hidden = false;
    renderDiscs(items, discStage);
  } else {
    editorialGrid.hidden = false;
    renderEditorial(items, editorialGrid, cat);
  }
}

// ─── floating posters ──────────────────────────────────────────────────────────
function renderPosters(items, stage) {
  stage.innerHTML = '';
  const cols = Math.min(items.length, 5);
  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'poster-card';
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 4 + (col / Math.max(cols - 1, 1)) * 80;
    const y = 4 + row * 48 + (Math.random() * 6 - 3);
    const rotation = (Math.random() - 0.5) * 8;
    const drift = (Math.random() * 16 + 8) + 'px';
    const duration = (4 + Math.random() * 4).toFixed(1) + 's';
    const delay = (Math.random() * -4).toFixed(1) + 's';
    card.style.cssText = `left:${x}%;top:${y}%;--r:${rotation}deg;--drift:-${drift};animation-duration:${duration};animation-delay:${delay}`;
    if (item.poster) {
      const img = document.createElement('img');
      img.src = item.poster; img.alt = item.title;
      card.appendChild(img);
    } else {
      card.style.cssText += ';background:var(--bg3);min-height:200px;display:flex;align-items:center;justify-content:center';
      card.innerHTML += `<span style="font-family:var(--serif);font-style:italic;color:var(--ink2);font-size:13px;padding:12px;text-align:center">${item.title}</span>`;
    }
    card.innerHTML += `
      <div class="poster-label">${item.title}${item.year ? ' · ' + item.year : ''}</div>
      <button class="poster-del" onclick="deleteItem('${item.id}',event)" aria-label="Remove">×</button>`;
    stage.appendChild(card);
  });
}

// ─── vinyl discs ───────────────────────────────────────────────────────────────
function renderDiscs(items, stage) {
  stage.innerHTML = '';
  items.forEach(item => {
    const wrapper = document.createElement('div');
    wrapper.className = 'disc-wrapper';
    wrapper.innerHTML = `
      <div class="disc" style="position:relative">
        ${makeVinylSVG(item.title)}
        <button class="disc-del" onclick="deleteItem('${item.id}',event)" aria-label="Remove">×</button>
      </div>
      <div class="disc-name">${item.title}${item.note ? '<br><span style="color:var(--ink3)">' + item.note + '</span>' : ''}</div>`;
    stage.appendChild(wrapper);
  });
}

// ─── editorial grid ─────────────────────────────────────────────────────────────
function renderEditorial(items, grid, cat) {
  grid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'ed-card';
    card.innerHTML = `
      ${item.poster ? `<img class="ed-card-img" src="${item.poster}" alt="${item.title}" loading="lazy"/>` : ''}
      <div class="ed-card-tag">${cat.label}</div>
      <div class="ed-card-name">${item.title}</div>
      ${item.note ? `<div class="ed-card-note">${item.note}</div>` : ''}
      <button class="ed-card-del" onclick="deleteItem('${item.id}',event)" aria-label="Remove">×</button>`;
    grid.appendChild(card);
  });
}

// ─── delete ────────────────────────────────────────────────────────────────────
async function deleteItem(id, e) {
  e.stopPropagation();
  await DB.remove(id);
  cachedItems[activeCat] = cachedItems[activeCat].filter(item => item.id !== id);
  renderTabs();
  renderContent();
}

// ─── modal ─────────────────────────────────────────────────────────────────────
const modal       = document.getElementById('modalOverlay');
const inputName   = document.getElementById('inputName');
const inputNote   = document.getElementById('inputNote');
const searchRes   = document.getElementById('searchResults');
const catLabel    = document.getElementById('modalCatLabel');
const customField = document.getElementById('customCatField');

let selectedResult = null;

function openModal() {
  selectedResult = null;
  inputName.value = ''; inputNote.value = '';
  searchRes.hidden = true; searchRes.innerHTML = '';
  const cat = CATEGORIES.find(c => c.id === activeCat);
  catLabel.textContent = cat.label;
  customField.hidden = activeCat !== 'custom';
  modal.hidden = false;
  setTimeout(() => inputName.focus(), 50);
}

function closeModal() { modal.hidden = true; searchRes.hidden = true; }

document.getElementById('addFab').addEventListener('click', openModal);
document.getElementById('emptyAdd').addEventListener('click', openModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

inputName.addEventListener('input', () => {
  const cat = CATEGORIES.find(c => c.id === activeCat);
  if (!cat.type) { searchRes.hidden = true; return; }
  const q = inputName.value.trim();
  if (q.length < 2) { searchRes.hidden = true; return; }
  selectedResult = null;
  API.debounceSearch(q, cat.type, results => {
    if (!results.length) { searchRes.hidden = true; return; }
    searchRes.hidden = false;
    searchRes.innerHTML = results.map((r, i) => `
      <div class="search-result-item" onclick="selectResult(${i})">
        ${r.poster ? `<img src="${r.poster}" alt="" loading="lazy"/>` : '<div style="width:32px;height:48px;background:var(--bg2);border-radius:3px;flex-shrink:0"></div>'}
        <div class="res-info">
          <span class="res-title">${r.title}</span>
          <span class="res-year">${r.year || '—'}</span>
        </div>
      </div>`).join('');
    searchRes._results = results;
  });
});

function selectResult(i) {
  const r = searchRes._results[i];
  selectedResult = r;
  inputName.value = r.title;
  searchRes.hidden = true;
}

document.getElementById('btnSave').addEventListener('click', async () => {
  const title = inputName.value.trim();
  if (!title) { inputName.focus(); return; }

  const btn = document.getElementById('btnSave');
  btn.textContent = '...'; btn.disabled = true;

  let item;
  if (selectedResult) {
    item = { title: selectedResult.title, year: selectedResult.year, poster: selectedResult.poster, note: inputNote.value.trim() };
  } else {
    item = { title, note: inputNote.value.trim() };
  }

  const saved = await DB.add(activeCat, item);
  if (saved) {
    if (!cachedItems[activeCat]) cachedItems[activeCat] = [];
    cachedItems[activeCat].push(saved);
  }

  btn.textContent = 'save'; btn.disabled = false;
  closeModal();
  renderTabs();
  renderContent();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && !modal.hidden) document.getElementById('btnSave').click();
});

// ─── sign out ──────────────────────────────────────────────────────────────────
document.querySelector('.vault-wordmark')?.addEventListener('dblclick', () => {
  if (confirm('sign out?')) Auth.signOut();
});

// ─── init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  Auth.init();
  currentUser = await Auth.requireAuth();
  if (!currentUser) return;

  cachedItems = await DB.fetchAll();
  renderTabs();
  renderContent();
});
