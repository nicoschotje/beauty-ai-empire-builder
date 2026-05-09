// Banners module — Surface B (blueprint §9.6, §11.9)

import { getSB } from '../core/supabase.js';
import { toast, toastError, toastWarn } from '../core/toast.js';
import { escapeHTML, formatDate } from '../core/utils.js';
import { uploadBannerImage } from '../core/storage.js';

let mounted = false;
let paneEl = null;
let listEl = null;
let modalBackdrop = null;
let modalBody = null;

const state = { banners: [] };

async function load() {
  const sb = getSB();
  const { data, error } = await sb
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { toastError('Banners load failed: ' + error.message); return; }
  state.banners = data || [];
}

function bannerCardHTML(b) {
  const expired = b.expires_at && new Date(b.expires_at) < new Date();
  return `
    <article class="card" data-id="${escapeHTML(b.id)}" style="margin-bottom:12px">
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">
        ${b.image_url
          ? `<img src="${escapeHTML(b.image_url)}" style="width:140px;height:80px;object-fit:cover;border-radius:8px;background:var(--bg-base)" alt=""/>`
          : `<div style="width:140px;height:80px;border:1px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px">no image</div>`}
        <div style="flex:1;min-width:200px">
          <div style="display:flex;align-items:center;gap:8px">
            <strong>${escapeHTML(b.title || '(untitled)')}</strong>
            <span class="status-badge ${b.is_active && !expired ? 'status-completed' : 'status-cancelled'}">
              ${expired ? 'Expired' : (b.is_active ? 'Active' : 'Inactive')}
            </span>
          </div>
          <div style="color:var(--text-muted);font-size:13px;margin-top:4px">${escapeHTML(b.subtitle || '')}</div>
          <div style="color:var(--text-muted);font-size:11px;margin-top:6px">
            sort ${b.sort_order ?? 0}
            ${b.button_text ? ` · CTA "${escapeHTML(b.button_text)}"` : ''}
            ${b.expires_at ? ` · expires ${escapeHTML(formatDate(b.expires_at))}` : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-direction:column">
          <button class="btn btn-sm btn-ghost" data-action="edit">Edit</button>
          <button class="btn btn-sm btn-ghost" data-action="toggle">${b.is_active ? 'Disable' : 'Enable'}</button>
          <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
        </div>
      </div>
    </article>
  `;
}

function render() {
  if (!state.banners.length) {
    listEl.innerHTML = `<div class="empty">No banners yet.</div>`;
    return;
  }
  listEl.innerHTML = state.banners.map(bannerCardHTML).join('');
}

/* ---------- Mutations ---------- */

async function toggleActive(b) {
  const sb = getSB();
  const { error } = await sb.from('banners').update({ is_active: !b.is_active }).eq('id', b.id);
  if (error) return toastError(error.message);
  await load(); render();
}

async function deleteBanner(b) {
  if (!confirm(`Delete banner "${b.title || 'untitled'}"?`)) return;
  const sb = getSB();
  const { error } = await sb.from('banners').delete().eq('id', b.id);
  if (error) return toastError(error.message);
  toast('Banner deleted');
  await load(); render();
}

/* ---------- Edit modal ---------- */

function openForm(b) {
  const isNew = !b;
  const data = b || {
    title: '', subtitle: '', image_url: '', link_url: '', button_text: '',
    is_active: true, sort_order: state.banners.length,
    bg_color: '#0F1614', text_color: '#E8F5F0', expires_at: null,
  };
  modalBody.innerHTML = `
    <h2>${isNew ? 'New banner' : 'Edit banner'}</h2>

    <label class="field-label">Title</label>
    <input class="input" id="f-title" value="${escapeHTML(data.title || '')}"/>

    <label class="field-label" style="margin-top:10px">Subtitle</label>
    <input class="input" id="f-sub" value="${escapeHTML(data.subtitle || '')}"/>

    <label class="field-label" style="margin-top:10px">Image *</label>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <img id="f-img-prev" src="${escapeHTML(data.image_url || '')}" style="width:100px;height:60px;object-fit:cover;border-radius:6px;background:var(--bg-base);${data.image_url ? '' : 'display:none'}" alt=""/>
      <input type="file" id="f-img" accept="image/jpeg,image/png,image/webp,image/gif"/>
      <span id="f-img-status" style="color:var(--text-muted);font-size:12px"></span>
    </div>
    <input type="hidden" id="f-img-url" value="${escapeHTML(data.image_url || '')}"/>

    <div class="field-row" style="margin-top:10px">
      <div style="flex:1 1 200px">
        <label class="field-label">Link URL</label>
        <input class="input" id="f-link" value="${escapeHTML(data.link_url || '')}" placeholder="https://…"/>
      </div>
      <div style="flex:1 1 140px">
        <label class="field-label">Button text</label>
        <input class="input" id="f-btn" value="${escapeHTML(data.button_text || '')}"/>
      </div>
    </div>

    <div class="field-row">
      <div style="flex:1 1 120px">
        <label class="field-label">BG color</label>
        <input class="input" id="f-bg" type="color" value="${escapeHTML(data.bg_color || '#0F1614')}"/>
      </div>
      <div style="flex:1 1 120px">
        <label class="field-label">Text color</label>
        <input class="input" id="f-text" type="color" value="${escapeHTML(data.text_color || '#E8F5F0')}"/>
      </div>
      <div style="flex:1 1 100px">
        <label class="field-label">Sort</label>
        <input class="input" id="f-sort" type="number" value="${data.sort_order ?? 0}"/>
      </div>
    </div>

    <label class="field-label" style="margin-top:10px">Expires at (optional)</label>
    <input class="input" id="f-exp" type="datetime-local" value="${data.expires_at ? new Date(data.expires_at).toISOString().slice(0,16) : ''}"/>

    <label style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:13px">
      <input type="checkbox" id="f-active" ${data.is_active ? 'checked' : ''}/> Active
    </label>

    <div class="card" style="margin-top:14px;padding:0;overflow:hidden">
      <div style="font-size:11px;color:var(--text-muted);padding:6px 10px;border-bottom:1px solid var(--border)">PREVIEW</div>
      <div id="f-preview" style="padding:18px;background:${escapeHTML(data.bg_color || '#0F1614')};color:${escapeHTML(data.text_color || '#E8F5F0')}">
        <div style="font-weight:700;font-size:18px">${escapeHTML(data.title || 'Title')}</div>
        <div style="font-size:13px;margin-top:4px;opacity:0.85">${escapeHTML(data.subtitle || 'Subtitle')}</div>
        ${data.button_text ? `<button class="btn btn-sm" style="margin-top:8px">${escapeHTML(data.button_text)}</button>` : ''}
      </div>
    </div>

    <div class="close-row">
      <button class="btn btn-sm btn-ghost" data-act="close">Cancel</button>
      <button class="btn btn-sm" data-act="save">${isNew ? 'Create' : 'Save'}</button>
    </div>
  `;
  modalBackdrop.classList.add('show');

  // Live preview wiring
  const preview = modalBody.querySelector('#f-preview');
  const refreshPreview = () => {
    const t = modalBody.querySelector('#f-title').value;
    const s = modalBody.querySelector('#f-sub').value;
    const bg = modalBody.querySelector('#f-bg').value;
    const tx = modalBody.querySelector('#f-text').value;
    const btn = modalBody.querySelector('#f-btn').value;
    preview.style.background = bg; preview.style.color = tx;
    preview.innerHTML = `
      <div style="font-weight:700;font-size:18px">${escapeHTML(t || 'Title')}</div>
      <div style="font-size:13px;margin-top:4px;opacity:0.85">${escapeHTML(s || 'Subtitle')}</div>
      ${btn ? `<button class="btn btn-sm" style="margin-top:8px">${escapeHTML(btn)}</button>` : ''}
    `;
  };
  ['f-title','f-sub','f-bg','f-text','f-btn'].forEach(id =>
    modalBody.querySelector('#' + id).addEventListener('input', refreshPreview));

  // Image upload
  modalBody.querySelector('#f-img').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const status = modalBody.querySelector('#f-img-status');
    status.textContent = 'Uploading…';
    try {
      const url = await uploadBannerImage(file);
      modalBody.querySelector('#f-img-url').value = url;
      const img = modalBody.querySelector('#f-img-prev');
      img.src = url; img.style.display = '';
      status.textContent = 'Uploaded ✓'; status.style.color = 'var(--green)';
    } catch (err) {
      status.textContent = err.message || 'Upload failed';
      status.style.color = 'var(--red)';
    }
  });

  modalBody.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.act === 'close') return modalBackdrop.classList.remove('show');
      if (btn.dataset.act === 'save')  await save(b);
    });
  });
}

async function save(existing) {
  const sb = getSB();
  const url = modalBody.querySelector('#f-img-url').value.trim();
  if (!url) return toastWarn('Image is required.');
  const expRaw = modalBody.querySelector('#f-exp').value;
  const payload = {
    title: modalBody.querySelector('#f-title').value.trim() || null,
    subtitle: modalBody.querySelector('#f-sub').value.trim() || null,
    image_url: url,
    link_url: modalBody.querySelector('#f-link').value.trim() || null,
    button_text: modalBody.querySelector('#f-btn').value.trim() || null,
    bg_color: modalBody.querySelector('#f-bg').value || null,
    text_color: modalBody.querySelector('#f-text').value || null,
    sort_order: parseInt(modalBody.querySelector('#f-sort').value, 10) || 0,
    is_active: modalBody.querySelector('#f-active').checked,
    expires_at: expRaw ? new Date(expRaw).toISOString() : null,
  };
  let error;
  if (existing) ({ error } = await sb.from('banners').update(payload).eq('id', existing.id));
  else          ({ error } = await sb.from('banners').insert([payload]));
  if (error) return toastError(error.message);
  toast(existing ? 'Banner updated' : 'Banner created');
  modalBackdrop.classList.remove('show');
  await load(); render();
}

/* ---------- Mount ---------- */

function buildPane() {
  paneEl.innerHTML = `
    <div class="filter-row">
      <button class="btn btn-sm" id="b-new">+ New banner</button>
      <button class="btn btn-ghost btn-sm" id="b-refresh">Refresh</button>
    </div>
    <div id="b-list"></div>
  `;
  listEl = paneEl.querySelector('#b-list');
  paneEl.querySelector('#b-new').addEventListener('click', () => openForm(null));
  paneEl.querySelector('#b-refresh').addEventListener('click', async () => { await load(); render(); });

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('article');
    const b = state.banners.find(x => x.id === card?.dataset.id);
    if (!b) return;
    if (btn.dataset.action === 'edit')   openForm(b);
    if (btn.dataset.action === 'toggle') await toggleActive(b);
    if (btn.dataset.action === 'delete') await deleteBanner(b);
  });
}

export async function mount(rootPaneEl, ctxIn) {
  paneEl = rootPaneEl;
  modalBackdrop = ctxIn.modalBackdrop;
  modalBody = ctxIn.modalBody;
  if (!mounted) { buildPane(); mounted = true; }
  await load(); render();
}
