// Store — fetches products from the same Supabase the dashboard writes to
// and renders them as a browseable product grid.

const SUPA_URL = 'https://ckmnhgattkiziuykhczo.supabase.co';
const SUPA_KEY = window.__MBG_SUPA_KEY__ || '';

const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: false },
});

const state = {
  products: [],
  categories: [],
  storeSettings: null,
  heroBanner: null,
  activeCategory: 'all',
  search: '',
};

// ---- Helpers ----

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function formatPrice(n) {
  if (n == null) return '';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

const PLACEHOLDER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;

// ---- Data Loading ----

async function loadData() {
  const [prodRes, catRes, settingsRes, bannerRes] = await Promise.all([
    sb.from('products')
      .select('*, categories(name, color, icon)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    sb.from('categories')
      .select('id, name, color, icon, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    sb.from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle(),
    sb.from('banners')
      .select('*')
      .eq('is_active', true)
      .is('category_name', null)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  state.products = prodRes.data || [];
  state.categories = catRes.data || [];
  state.storeSettings = settingsRes.data;

  const banner = bannerRes.data;
  if (banner && (!banner.expires_at || new Date(banner.expires_at) > new Date())) {
    state.heroBanner = banner;
  }
}

// ---- Filtering ----

function filtered() {
  let rows = state.products;
  if (state.activeCategory !== 'all') {
    rows = rows.filter(p => p.category_id === state.activeCategory);
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    rows = rows.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    );
  }
  return rows;
}

// ---- Rendering ----

function renderHeader() {
  const s = state.storeSettings;
  if (!s) return;

  if (s.store_name) {
    document.getElementById('brand-name').textContent = s.store_name;
    document.title = s.store_name;
  }
  if (s.store_logo_url) {
    const logo = document.getElementById('brand-logo');
    logo.src = s.store_logo_url;
    logo.alt = s.store_name || 'Store';
    logo.classList.remove('hidden');
  }

  document.getElementById('footer-name').textContent =
    s.store_name ? `© ${new Date().getFullYear()} ${s.store_name}` : '';
  const contactParts = [s.store_phone, s.store_email].filter(Boolean);
  document.getElementById('footer-contact').textContent = contactParts.join(' · ');
}

function renderHero() {
  const b = state.heroBanner;
  const section = document.getElementById('hero');
  if (!b) { section.classList.add('hidden'); return; }

  section.classList.remove('hidden');
  document.getElementById('hero-title').textContent = b.title || '';
  document.getElementById('hero-subtitle').textContent = b.subtitle || '';

  if (b.image_url) {
    document.getElementById('hero-img').src = b.image_url;
    document.getElementById('hero-img').alt = b.title || '';
  }

  const cta = document.getElementById('hero-cta');
  if (b.button_text) {
    cta.textContent = b.button_text;
    cta.classList.remove('hidden');
  }
}

function renderCategories() {
  const inner = document.querySelector('.categories-inner');
  inner.innerHTML =
    `<button class="cat-pill ${state.activeCategory === 'all' ? 'active' : ''}" data-cat="all">All</button>` +
    state.categories.map(c =>
      `<button class="cat-pill ${state.activeCategory === c.id ? 'active' : ''}" data-cat="${esc(c.id)}">
        ${c.icon ? esc(c.icon) + ' ' : ''}${esc(c.name)}
      </button>`
    ).join('');
}

function productCardHTML(p) {
  const catName = p.categories?.name || '';
  return `
    <article class="product-card" data-id="${esc(p.id)}">
      <div class="product-card-img">
        ${p.image_url
          ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" />`
          : `<div class="no-img">${PLACEHOLDER_SVG}</div>`
        }
        ${p.is_featured ? '<span class="badge-featured">Featured</span>' : ''}
      </div>
      <div class="product-card-body">
        ${catName ? `<div class="product-card-cat">${esc(catName)}</div>` : ''}
        <div class="product-card-name">${esc(p.name)}</div>
        <div class="product-card-price">${formatPrice(p.price)}</div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  const rows = filtered();

  if (!rows.length) {
    grid.innerHTML = `
      <div class="empty-state">
        ${PLACEHOLDER_SVG}
        <p>${state.search || state.activeCategory !== 'all' ? 'No products match your search.' : 'No products available yet.'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = rows.map(productCardHTML).join('');
}

function showSkeletons() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = Array.from({ length: 8 }, () => `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');
}

// ---- Modal ----

function openProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  const catName = p.categories?.name || '';
  const tags = Array.isArray(p.tags) ? p.tags : [];

  let stockLabel = 'In stock';
  let stockClass = 'in-stock';
  if (p.stock_qty <= 0) {
    stockLabel = 'Out of stock';
    stockClass = 'out-of-stock';
  } else if (p.stock_qty <= (p.low_stock_threshold || 0)) {
    stockLabel = `Only ${p.stock_qty} left`;
    stockClass = 'low-stock';
  }

  const body = document.getElementById('modal-body');
  body.innerHTML = `
    ${p.image_url
      ? `<img class="modal-img" src="${esc(p.image_url)}" alt="${esc(p.name)}" />`
      : ''
    }
    <div class="modal-content">
      ${catName ? `<div class="modal-cat">${esc(catName)}</div>` : ''}
      <h2 class="modal-name">${esc(p.name)}</h2>
      <div class="modal-price">${formatPrice(p.price)}</div>
      ${p.description ? `<p class="modal-desc">${esc(p.description)}</p>` : ''}
      ${tags.length ? `<div class="modal-tags">${tags.map(t => `<span class="modal-tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="modal-stock ${stockClass}">${stockLabel}</div>
    </div>
  `;

  document.getElementById('modal-backdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
  document.body.style.overflow = '';
}

// ---- Events ----

function bindEvents() {
  // Category filter
  document.querySelector('.categories-inner').addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    state.activeCategory = pill.dataset.cat === 'all' ? 'all' : pill.dataset.cat;
    renderCategories();
    renderProducts();
  });

  // Search
  let searchTimer;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = e.target.value.trim();
      renderProducts();
    }, 250);
  });

  // Product card click → modal
  document.getElementById('product-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    openProduct(card.dataset.id);
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ---- Init ----

async function init() {
  showSkeletons();
  bindEvents();

  try {
    await loadData();
  } catch (err) {
    console.error('Store load error:', err);
    document.getElementById('product-grid').innerHTML =
      '<div class="empty-state"><p>Could not load products. Please try again later.</p></div>';
    return;
  }

  renderHeader();
  renderHero();
  renderCategories();
  renderProducts();
}

init();
