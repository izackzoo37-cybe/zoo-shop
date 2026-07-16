const API_BASE = 'http://localhost:4000/api';

// ---------------- state ----------------
let authToken = localStorage.getItem('zoo_token');
let currentUser = JSON.parse(localStorage.getItem('zoo_user') || 'null');
let categories = [];
let notifications = [];
let notifPollTimer = null;
let chatMessages = [];
let chatOpen = false;
let chatSending = false;

const root = document.getElementById('app-root');
const accountLabel = document.getElementById('account-label');
const cartBadge = document.getElementById('cart-badge');
const notifBellBtn = document.getElementById('notif-bell-btn');
const notifPanel = document.getElementById('notif-panel');
const notifBadge = document.getElementById('notif-badge');
const notifList = document.getElementById('notif-list');
const chatPanel = document.getElementById('chat-panel');
const chatBubbleBtn = document.getElementById('chat-bubble-btn');
const chatMessagesEl = document.getElementById('chat-messages');
const chatQuickRepliesEl = document.getElementById('chat-quick-replies');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const bottomNav = document.getElementById('bottom-nav');
const bottomNotifBtn = document.getElementById('bottom-notif-btn');
const bottomNotifBadge = document.getElementById('bottom-notif-badge');
const bottomCartBadge = document.getElementById('bottom-cart-badge');
const bottomAdminLink = document.getElementById('bottom-admin-link');
const bottomAccountLabel = document.getElementById('bottom-account-label');

// ---------------- icons ----------------
const ICONS = {
  headphones: '<path d="M4,13 L4,11 A8,8 0 0 1 20,11 L20,13"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/>',
  battery: '<rect x="2" y="8" width="17" height="10" rx="2"/><path d="M21,11 L21,15"/><path d="M6,11 L6,15 M10,11 L10,15"/>',
  watch: '<rect x="7" y="7" width="10" height="10" rx="3"/><path d="M9,7 L9,3 L15,3 L15,7 M9,17 L9,21 L15,21 L15,17"/>',
  speaker: '<rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="8" r="1.6"/><circle cx="12" cy="15" r="4"/>',
  kettle: '<path d="M5,10 L19,10 L18,20 A2,2 0 0 1 16,22 L8,22 A2,2 0 0 1 6,20 Z"/><path d="M9,10 L9,5 A3,3 0 0 1 15,5 L15,10"/><path d="M19,12 L22,13 L21,16"/>',
  pan: '<circle cx="10" cy="12" r="7"/><path d="M17,10 L23,8"/><circle cx="7" cy="10" r="0.8" fill="currentColor"/><circle cx="10" cy="9" r="0.8" fill="currentColor"/><circle cx="13" cy="10" r="0.8" fill="currentColor"/>',
  purifier: '<rect x="7" y="3" width="10" height="18" rx="3"/><path d="M10,8 L14,8 M10,12 L14,12 M10,16 L14,16"/>',
  jacket: '<path d="M8,4 L4,7 L4,10 L7,9 L7,21 L17,21 L17,9 L20,10 L20,7 L16,4 L14,6 L10,6 Z"/>',
  shoe: '<path d="M3,17 L3,13 C6,13 7,10 9,10 C11,10 11,13 15,13 C18,13 19,11 21,13 L21,17 Z"/>',
  bag: '<rect x="4" y="8" width="16" height="13" rx="2"/><path d="M8,8 L8,5 A4,4 0 0 1 16,5 L16,8"/>',
  droplet: '<path d="M12,2 C12,2 5,11 5,15.5 A7,7 0 0 0 19,15.5 C19,11 12,2 12,2 Z"/>',
  leaf: '<path d="M4,20 C4,10 12,4 21,4 C21,13 15,20 4,20 Z"/><path d="M4,20 L12,12"/>',
  mat: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4,8 L20,8 M4,13 L20,13"/>',
  hammock: '<path d="M3,7 L3,17 M21,7 L21,17"/><path d="M3,10 C8,16 16,16 21,10"/>',
  book: '<path d="M4,4 L11,4 L11,20 L4,20 A2,2 0 0 1 4,4 Z"/><path d="M11,4 L20,4 L20,20 L11,20"/>',
};

function iconSvg(name, extraClass) {
  const paths = ICONS[name] || ICONS.book;
  return `<span class="icon-badge ${extraClass || ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}

// Small chevron glyph echoing the strokes in the Zoo Group Holdings mark —
// used as a recurring, restrained signature accent (hero eyebrow, footer).
function trailGlyph() {
  return `<svg class="trail-glyph" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2,10 L8,4 L14,10"/></svg>`;
}

// The hero's signature graphic: a diagonal trail of chevrons — the same
// angular strokes as the logo mark — receding and fading like footprints or
// a migration line, tying the brand's animal mark to the "everything moves
// through one store" idea without resorting to a generic gradient blob.
function heroTrailSvg() {
  const steps = [
    { x: 30, y: 250, w: 82, h: 62, sw: 10, color: 'var(--teal)', op: 1 },
    { x: 104, y: 198, w: 68, h: 52, sw: 9, color: 'var(--coral)', op: 0.88 },
    { x: 166, y: 152, w: 56, h: 42, sw: 8, color: 'var(--teal)', op: 0.72 },
    { x: 216, y: 112, w: 46, h: 34, sw: 7, color: 'var(--coral)', op: 0.56 },
    { x: 256, y: 80, w: 38, h: 28, sw: 6, color: 'var(--teal)', op: 0.4 },
    { x: 288, y: 54, w: 30, h: 22, sw: 5, color: 'var(--coral)', op: 0.26 },
    { x: 312, y: 34, w: 24, h: 18, sw: 4, color: 'var(--teal)', op: 0.14 },
  ];
  const paths = steps
    .map((s) => `<path d="M${s.x},${s.y + s.h} L${s.x + s.w / 2},${s.y} L${s.x + s.w},${s.y + s.h}" stroke="${s.color}" stroke-width="${s.sw}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${s.op}" />`)
    .join('');
  return `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;
}

// Builds the inner content + style attribute for a product "media" box.
// If the product has a real photo, it fills the box and the color gradient
// is dropped. Otherwise we fall back to the original color-block + icon.
function mediaContent(p) {
  if (p.image_url) {
    return {
      style: '',
      inner: `<img class="product-photo" src="${resolveImageUrl(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" />`,
    };
  }
  return {
    style: `background: linear-gradient(150deg, ${p.color_a}, ${p.color_b})`,
    inner: iconSvg(p.icon),
  };
}

function starRow(rating) {
  const full = Math.round(rating);
  let out = '<span class="stars">';
  for (let i = 0; i < 5; i++) {
    out += `<svg viewBox="0 0 20 20" fill="${i < full ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1"><path d="M10,1.5 L12.6,7 L18.5,7.8 L14.2,11.8 L15.4,17.8 L10,14.8 L4.6,17.8 L5.8,11.8 L1.5,7.8 L7.4,7 Z"/></svg>`;
  }
  return out + '</span>';
}

function money(n) {
  return `KES ${Number(n).toLocaleString('en-KE')}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------- toast ----------------
let toastTimer = null;
function showToast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------------- API helper ----------------
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// Like api(), but for multipart file uploads — deliberately does NOT set a
// Content-Type header, so the browser can add the correct multipart boundary.
async function apiUpload(path, file) {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Image upload failed');
  return data;
}

// Turns a possibly-relative image URL from the API into an absolute one the
// browser can load (uploaded images are served from the backend, not wherever
// the frontend happens to be hosted).
function resolveImageUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE.replace(/\/api\/?$/, '')}${url}`;
}

// ---------------- auth helpers ----------------
function setSession(token, user) {
  authToken = token;
  currentUser = user;
  localStorage.setItem('zoo_token', token);
  localStorage.setItem('zoo_user', JSON.stringify(user));
  updateHeaderAuth();
  refreshNotifications();
  startNotifPolling();
}
function clearSession() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('zoo_token');
  localStorage.removeItem('zoo_user');
  updateHeaderAuth();
  refreshCartBadge();
  notifications = [];
  notifPanel.classList.add('hidden');
  stopNotifPolling();
  updateNotifBadge();
}
function updateHeaderAuth() {
  const firstName = currentUser ? currentUser.name.split(' ')[0] : 'Sign in';
  accountLabel.textContent = firstName;
  bottomAccountLabel.textContent = currentUser ? firstName : 'Account';
  const adminLink = document.getElementById('admin-link');
  const isAdmin = !!(currentUser && currentUser.isAdmin);
  adminLink.classList.toggle('hidden', !isAdmin);
  bottomAdminLink.classList.toggle('hidden', !isAdmin);
  notifBellBtn.classList.toggle('hidden', !currentUser);
  bottomNotifBtn.classList.toggle('hidden', !currentUser);
}

// ---------------- notifications ----------------
function startNotifPolling() {
  stopNotifPolling();
  if (!authToken) return;
  notifPollTimer = setInterval(refreshNotifications, 45000);
}
function stopNotifPolling() {
  if (notifPollTimer) clearInterval(notifPollTimer);
  notifPollTimer = null;
}

function updateNotifBadge() {
  const unread = notifications.filter((n) => !n.read).length;
  const label = unread > 9 ? '9+' : String(unread);
  if (unread > 0) {
    notifBadge.textContent = label;
    notifBadge.classList.remove('hidden');
    bottomNotifBadge.textContent = label;
    bottomNotifBadge.classList.remove('hidden');
  } else {
    notifBadge.classList.add('hidden');
    bottomNotifBadge.classList.add('hidden');
  }
}

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

function renderNotifList() {
  if (notifications.length === 0) {
    notifList.innerHTML = `<div class="notif-empty">No notifications yet.</div>`;
    return;
  }
  notifList.innerHTML = notifications.map((n) => `
    <button type="button" class="notif-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}" data-order-id="${n.order_id || ''}">
      <div class="notif-message">${escapeHtml(n.message)}</div>
      <div class="notif-time">${relativeTime(n.created_at)}</div>
    </button>
  `).join('');

  notifList.querySelectorAll('[data-notif-id]').forEach((el) => {
    el.addEventListener('click', async () => {
      const id = Number(el.dataset.notifId);
      const notif = notifications.find((n) => n.id === id);
      notifPanel.classList.add('hidden');
      if (notif && !notif.read) {
        notif.read = true;
        updateNotifBadge();
        try { await api(`/notifications/${id}/read`, { method: 'PATCH' }); } catch (_e) { /* non-fatal */ }
      }
      if (authToken) location.hash = '#/orders';
    });
  });
}

async function refreshNotifications() {
  if (!authToken) return;
  try {
    const data = await api('/notifications');
    notifications = data.notifications;
    updateNotifBadge();
    if (!notifPanel.classList.contains('hidden')) renderNotifList();
  } catch (_e) {
    // non-fatal — badge just won't update this cycle
  }
}

function toggleNotifPanel() {
  const opening = notifPanel.classList.contains('hidden');
  notifPanel.classList.toggle('hidden');
  if (opening) {
    renderNotifList();
    refreshNotifications();
  }
}

notifBellBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleNotifPanel();
});
bottomNotifBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleNotifPanel();
});

document.getElementById('notif-mark-all').addEventListener('click', async (e) => {
  e.stopPropagation();
  if (notifications.every((n) => n.read)) return;
  notifications.forEach((n) => { n.read = true; });
  updateNotifBadge();
  renderNotifList();
  try { await api('/notifications/read-all', { method: 'PATCH' }); } catch (_e) { /* non-fatal */ }
});

document.addEventListener('click', (e) => {
  const clickedTrigger = e.target === notifBellBtn || notifBellBtn.contains(e.target) || e.target === bottomNotifBtn || bottomNotifBtn.contains(e.target);
  if (!notifPanel.classList.contains('hidden') && !notifPanel.contains(e.target) && !clickedTrigger) {
    notifPanel.classList.add('hidden');
  }
});

// ---------------- chat widget ----------------
const CHAT_GREETING = {
  role: 'bot',
  content: "Hi! I'm the Zoo Assistant. I can help you track an order, check shipping, or find a product. What do you need?",
  quickReplies: ['Track my order', 'Shipping & returns', 'Find a product'],
};

function setChatOpen(open) {
  chatOpen = open;
  chatPanel.classList.toggle('hidden', !open);
  document.querySelector('.chat-bubble-icon-open').classList.toggle('hidden', open);
  document.querySelector('.chat-bubble-icon-close').classList.toggle('hidden', !open);
  chatBubbleBtn.setAttribute('aria-label', open ? 'Close chat' : 'Open chat with the Zoo Assistant');

  if (open) {
    if (chatMessages.length === 0) addChatMessage(CHAT_GREETING.role, CHAT_GREETING.content, CHAT_GREETING.quickReplies);
    setTimeout(() => chatInput.focus(), 50);
  }
}

function renderChatMessages() {
  chatMessagesEl.innerHTML = chatMessages
    .map((m) => `<div class="chat-msg ${m.role}">${escapeHtml(m.content)}</div>`)
    .join('');
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

const CHAT_NAV_REPLIES = {
  'Go to Account': '#/account',
  'Sign in': '#/account',
  'Shop all products': '#/?category=All',
  'View order history': '#/orders',
};

function renderChatQuickReplies(replies) {
  if (!replies || replies.length === 0) {
    chatQuickRepliesEl.classList.add('hidden');
    chatQuickRepliesEl.innerHTML = '';
    return;
  }
  chatQuickRepliesEl.classList.remove('hidden');
  chatQuickRepliesEl.innerHTML = replies.map((r) => `<button type="button" data-quick-reply="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join('');
  chatQuickRepliesEl.querySelectorAll('[data-quick-reply]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const label = btn.dataset.quickReply;
      if (CHAT_NAV_REPLIES[label]) {
        renderChatQuickReplies(null);
        location.hash = CHAT_NAV_REPLIES[label];
        setChatOpen(false);
      } else {
        sendChatMessage(label);
      }
    });
  });
}

function addChatMessage(role, content, quickReplies) {
  chatMessages.push({ role, content });
  renderChatMessages();
  renderChatQuickReplies(role === 'bot' ? quickReplies : null);
}

function showChatTyping() {
  const el = document.createElement('div');
  el.className = 'chat-typing';
  el.id = 'chat-typing-indicator';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatMessagesEl.appendChild(el);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}
function hideChatTyping() {
  const el = document.getElementById('chat-typing-indicator');
  if (el) el.remove();
}

async function sendChatMessage(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || chatSending) return;

  chatSending = true;
  renderChatQuickReplies(null);

  // Snapshot history BEFORE appending the new message, so the server doesn't
  // see the current message twice (once in history, once as `message`).
  const recent = chatMessages.slice(-8);
  const firstUserIdx = recent.findIndex((m) => m.role === 'user');
  const history = firstUserIdx === -1 ? [] : recent.slice(firstUserIdx).map((m) => ({ role: m.role, content: m.content }));

  addChatMessage('user', trimmed);
  chatInput.value = '';
  showChatTyping();

  try {
    const data = await api('/chat', { method: 'POST', body: JSON.stringify({ message: trimmed, history }) });
    hideChatTyping();
    addChatMessage('bot', data.reply, data.quickReplies);
  } catch (_err) {
    hideChatTyping();
    addChatMessage('bot', "Sorry, I'm having trouble connecting right now — please try again in a moment.");
  } finally {
    chatSending = false;
  }
}

chatBubbleBtn.addEventListener('click', () => setChatOpen(!chatOpen));
document.getElementById('chat-close-btn').addEventListener('click', () => setChatOpen(false));
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendChatMessage(chatInput.value);
});

async function refreshCartBadge() {
  if (!authToken) {
    cartBadge.classList.add('hidden');
    bottomCartBadge.classList.add('hidden');
    return;
  }
  try {
    const cart = await api('/cart');
    if (cart.itemCount > 0) {
      cartBadge.textContent = cart.itemCount;
      cartBadge.classList.remove('hidden');
      bottomCartBadge.textContent = cart.itemCount;
      bottomCartBadge.classList.remove('hidden');
    } else {
      cartBadge.classList.add('hidden');
      bottomCartBadge.classList.add('hidden');
    }
  } catch (_e) {
    cartBadge.classList.add('hidden');
    bottomCartBadge.classList.add('hidden');
  }
}

// ---------------- category nav ----------------
async function loadCategories() {
  try {
    const data = await api('/products/categories');
    categories = data.categories;
    const nav = document.getElementById('category-nav-inner');
    nav.innerHTML = '<a href="#/" data-category="All" class="cat-link">All</a>' +
      categories.map((c) => `<a href="#/?category=${encodeURIComponent(c)}" data-category="${escapeHtml(c)}" class="cat-link">${escapeHtml(c)}</a>`).join('');
    highlightActiveCategory();
  } catch (_e) {
    // non-fatal — grid will still work without the nav populated
  }
}
function highlightActiveCategory() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const active = params.get('category') || 'All';
  document.querySelectorAll('.cat-link').forEach((a) => {
    a.classList.toggle('active', a.dataset.category === active);
  });
}

function updateBottomNavActive(segments) {
  let current = 'home';
  if (segments[0] === 'cart') current = 'cart';
  else if (segments[0] === 'account' || segments[0] === 'orders') current = 'account';
  else if (segments[0] === 'admin') current = 'admin';
  else if (segments.length > 0) current = null; // product/checkout — no matching tab

  document.querySelectorAll('.bottom-nav-link[data-bottom-nav]').forEach((el) => {
    el.classList.toggle('active', el.dataset.bottomNav === current);
  });
}

// ---------------- router ----------------
function parseHash() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = hash.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const params = new URLSearchParams(queryPart || '');
  return { segments, params };
}

async function router() {
  const { segments, params } = parseHash();
  highlightActiveCategory();
  updateBottomNavActive(segments);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  if (segments.length === 0) return renderHome(params);
  if (segments[0] === 'product' && segments[1]) return renderProductDetail(segments[1]);
  if (segments[0] === 'cart') return renderCart();
  if (segments[0] === 'checkout') return renderCheckout();
  if (segments[0] === 'orders') return renderOrders();
  if (segments[0] === 'account') return renderAccount();
  if (segments[0] === 'admin' && segments[1] === 'invoice' && segments[2]) return renderAdminInvoice(segments[2]);
  if (segments[0] === 'admin') return renderAdmin(segments, params);

  root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Page not found</h3><p><a href="#/">Go back home</a></p></div></div>`;
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', async () => {
  updateHeaderAuth();
  await loadCategories();
  await refreshCartBadge();
  await refreshNotifications();
  startNotifPolling();
  router();

  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    location.hash = q ? `#/?q=${encodeURIComponent(q)}` : '#/';
  });
});

// ---------------- HOME ----------------
async function renderHome(params) {
  const q = params.get('q') || '';
  const category = params.get('category') || 'All';
  const sort = params.get('sort') || 'relevance';

  root.innerHTML = `
    <div class="hero-banner">
      <div class="wrap hero-inner">
        <div class="hero-copy">
          <div class="hero-eyebrow">${trailGlyph()}<span>One store, one account</span></div>
          <h1>Everything you need, from Zoo Group Holdings.</h1>
          <p>Electronics, home essentials, fashion, beauty, sport, and books — sourced and shipped from the Kenyan coast to your door.</p>
          <div class="hero-actions">
            <a href="#/?category=All" class="btn btn-accent">Shop all products</a>
            <button type="button" class="hero-link-secondary" id="hero-browse-categories">Browse categories<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6,9 L12,15 L18,9"/></svg></button>
          </div>
        </div>
        <div class="hero-trail" aria-hidden="true">${heroTrailSvg()}</div>
      </div>
    </div>
    <div class="wrap section-pad">
      <div class="grid-head">
        <div>
          <h2>${q ? `Results for "${escapeHtml(q)}"` : category !== 'All' ? escapeHtml(category) : 'All products'}</h2>
          <div class="result-count" id="result-count"></div>
        </div>
        <select class="sort-select" id="sort-select">
          <option value="relevance" ${sort === 'relevance' ? 'selected' : ''}>Sort: Featured</option>
          <option value="price_asc" ${sort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
          <option value="price_desc" ${sort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
          <option value="rating" ${sort === 'rating' ? 'selected' : ''}>Avg. Customer Rating</option>
        </select>
      </div>
      <div class="product-grid" id="product-grid"><p>Loading products…</p></div>
    </div>
  `;

  document.getElementById('sort-select').addEventListener('change', (e) => {
    const p = new URLSearchParams(location.hash.split('?')[1] || '');
    p.set('sort', e.target.value);
    location.hash = `#/?${p.toString()}`;
  });

  document.getElementById('hero-browse-categories').addEventListener('click', () => {
    document.getElementById('category-nav-inner').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  try {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (category !== 'All') qs.set('category', category);
    if (sort) qs.set('sort', sort);

    const data = await api(`/products?${qs.toString()}`);
    const grid = document.getElementById('product-grid');
    document.getElementById('result-count').textContent = `${data.products.length} product${data.products.length === 1 ? '' : 's'}`;

    if (data.products.length === 0) {
      grid.outerHTML = `<div class="empty-state"><h3>No products found</h3><p>Try a different search or category.</p></div>`;
      return;
    }

    grid.innerHTML = data.products.map(productCardHtml).join('');
    attachAddToCartHandlers(grid);
  } catch (err) {
    document.getElementById('product-grid').innerHTML = `<div class="empty-state"><h3>Couldn't load products</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function productCardHtml(p) {
  const media = mediaContent(p);
  return `
    <a href="#/product/${p.id}" class="product-card">
      <div class="product-media" style="${media.style}">
        ${media.inner}
      </div>
      <div class="product-info">
        <div class="product-cat">${escapeHtml(p.category)}</div>
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-rating-row">${starRow(p.rating)}<span class="rating-count">(${p.review_count})</span></div>
        <div class="product-price-row">
          <span class="product-price price">${money(p.price)}</span>
          <button class="add-btn" data-add-id="${p.id}" aria-label="Add to cart" onclick="event.preventDefault()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12,5 L12,19 M5,12 L19,12"/></svg>
          </button>
        </div>
      </div>
    </a>
  `;
}

function attachAddToCartHandlers(container) {
  container.querySelectorAll('[data-add-id]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await quickAddToCart(btn.dataset.addId);
    });
  });
}

async function quickAddToCart(productId) {
  if (!authToken) {
    showToast('Sign in to add items to your cart');
    location.hash = '#/account';
    return;
  }
  try {
    await api('/cart', { method: 'POST', body: JSON.stringify({ productId: Number(productId), quantity: 1 }) });
    showToast('Added to cart');
    refreshCartBadge();
  } catch (err) {
    showToast(err.message);
  }
}

// ---------------- PRODUCT DETAIL ----------------
async function renderProductDetail(id) {
  root.innerHTML = `<div class="wrap section-pad"><p>Loading…</p></div>`;
  try {
    const { product: p } = await api(`/products/${id}`);
    const inStock = p.stock > 0;
    const lowStock = p.stock > 0 && p.stock <= 5;
    const media = mediaContent(p);

    root.innerHTML = `
      <div class="wrap section-pad">
        <div class="crumb">
          <a href="#/">Home</a> / <a href="#/?category=${encodeURIComponent(p.category)}">${escapeHtml(p.category)}</a> / <span>${escapeHtml(p.name)}</span>
        </div>
        <div class="detail-grid">
          <div class="detail-media" style="${media.style}">
            ${media.inner}
          </div>
          <div>
            <div class="detail-cat">${escapeHtml(p.category)}</div>
            <h1 class="detail-title">${escapeHtml(p.name)}</h1>
            <div class="detail-rating-row">${starRow(p.rating)} <span class="rating-count">${p.rating} · ${p.review_count} reviews</span></div>

            <div class="detail-price-row">
              <span class="detail-price price">${money(p.price)}</span>
              <span class="stock-note ${inStock ? (lowStock ? 'stock-low' : 'stock-ok') : ''}">
                ${inStock ? (lowStock ? `Only ${p.stock} left in stock` : 'In stock') : 'Out of stock'}
              </span>
            </div>

            <div class="qty-row">
              <span>Quantity</span>
              <div class="qty-stepper">
                <button type="button" id="qty-minus">−</button>
                <span id="qty-value">1</span>
                <button type="button" id="qty-plus">+</button>
              </div>
            </div>

            <div class="detail-actions">
              <button class="btn btn-accent" id="add-to-cart-btn" ${inStock ? '' : 'disabled'}>Add to Cart</button>
              <button class="btn btn-ghost" id="buy-now-btn" ${inStock ? '' : 'disabled'}>Buy Now</button>
            </div>

            <div class="detail-description">
              <h3>About this item</h3>
              <p>${escapeHtml(p.description)}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    let qty = 1;
    const qtyValue = document.getElementById('qty-value');
    document.getElementById('qty-minus').addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      qtyValue.textContent = qty;
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      qty = Math.min(p.stock, qty + 1);
      qtyValue.textContent = qty;
    });

    document.getElementById('add-to-cart-btn').addEventListener('click', async () => {
      if (!authToken) { showToast('Sign in to add items to your cart'); location.hash = '#/account'; return; }
      try {
        await api('/cart', { method: 'POST', body: JSON.stringify({ productId: p.id, quantity: qty }) });
        showToast('Added to cart');
        refreshCartBadge();
      } catch (err) { showToast(err.message); }
    });

    document.getElementById('buy-now-btn').addEventListener('click', async () => {
      if (!authToken) { showToast('Sign in to continue'); location.hash = '#/account'; return; }
      try {
        await api('/cart', { method: 'POST', body: JSON.stringify({ productId: p.id, quantity: qty }) });
        refreshCartBadge();
        location.hash = '#/checkout';
      } catch (err) { showToast(err.message); }
    });
  } catch (err) {
    root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Product not found</h3><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

// ---------------- CART ----------------
async function renderCart() {
  if (!authToken) {
    root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Sign in to view your cart</h3><p><a href="#/account" class="btn" style="margin-top:16px;display:inline-flex;">Sign in</a></p></div></div>`;
    return;
  }

  root.innerHTML = `<div class="wrap section-pad"><p>Loading cart…</p></div>`;

  try {
    const cart = await api('/cart');

    if (cart.items.length === 0) {
      root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Your cart is empty</h3><p><a href="#/" class="btn" style="margin-top:16px;display:inline-flex;">Continue shopping</a></p></div></div>`;
      return;
    }

    root.innerHTML = `
      <div class="wrap section-pad">
        <h1 style="font-size:24px;margin-bottom:24px;">Your Cart</h1>
        <div class="cart-grid">
          <div id="cart-items">
            ${cart.items.map(cartItemHtml).join('')}
          </div>
          <div class="summary-panel">
            <div class="summary-row"><span>Subtotal (${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'})</span><span class="price">${money(cart.subtotal)}</span></div>
            <div class="summary-row"><span>Delivery</span><span>Free</span></div>
            <div class="summary-row total"><span>Total</span><span class="price">${money(cart.subtotal)}</span></div>
            <a href="#/checkout" class="btn btn-accent btn-block" style="margin-top:16px;">Proceed to Checkout</a>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('[data-qty-change]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const pid = btn.dataset.qtyChange;
        const delta = Number(btn.dataset.delta);
        const row = document.querySelector(`[data-item-id="${pid}"]`);
        const current = Number(row.dataset.quantity);
        const next = Math.max(0, current + delta);
        try {
          await api(`/cart/${pid}`, { method: 'PATCH', body: JSON.stringify({ quantity: next }) });
          refreshCartBadge();
          renderCart();
        } catch (err) { showToast(err.message); }
      });
    });

    document.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api(`/cart/${btn.dataset.remove}`, { method: 'DELETE' });
          refreshCartBadge();
          renderCart();
        } catch (err) { showToast(err.message); }
      });
    });
  } catch (err) {
    root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Couldn't load your cart</h3><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

function cartItemHtml(item) {
  const mediaInner = item.image_url
    ? `<img class="product-photo" src="${resolveImageUrl(item.image_url)}" alt="${escapeHtml(item.name)}" loading="lazy" />`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[item.icon] || ICONS.book}</svg>`;
  const mediaStyle = item.image_url ? '' : `background: linear-gradient(150deg, ${item.color_a}, ${item.color_b})`;
  return `
    <div class="cart-item" data-item-id="${item.productId}" data-quantity="${item.quantity}">
      <div class="cart-item-media" style="${mediaStyle}">
        ${mediaInner}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-unit price">${money(item.price)} each</div>
      </div>
      <div class="qty-stepper">
        <button type="button" data-qty-change="${item.productId}" data-delta="-1">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-qty-change="${item.productId}" data-delta="1">+</button>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-total price">${money(item.price * item.quantity)}</span>
        <button class="remove-link" data-remove="${item.productId}">Remove</button>
      </div>
    </div>
  `;
}

// ---------------- CHECKOUT ----------------
async function renderCheckout() {
  if (!authToken) { location.hash = '#/account'; return; }

  root.innerHTML = `<div class="wrap section-pad"><p>Loading…</p></div>`;

  try {
    const cart = await api('/cart');
    if (cart.items.length === 0) {
      root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Your cart is empty</h3><p><a href="#/" class="btn" style="margin-top:16px;display:inline-flex;">Continue shopping</a></p></div></div>`;
      return;
    }

    root.innerHTML = `
      <div class="wrap section-pad">
        <h1 style="font-size:24px;margin-bottom:24px;">Checkout</h1>
        <div class="checkout-grid">
          <div class="form-panel">
            <h3 style="font-size:16px;margin-bottom:18px;">Delivery details</h3>
            <p class="form-error" id="checkout-error"></p>
            <form id="checkout-form">
              <div class="form-row">
                <label for="ck-name">Full name</label>
                <input id="ck-name" type="text" value="${escapeHtml(currentUser?.name || '')}" required />
              </div>
              <div class="form-row">
                <label for="ck-phone">Phone number</label>
                <input id="ck-phone" type="tel" required />
              </div>
              <div class="form-row">
                <label for="ck-address">Delivery address</label>
                <textarea id="ck-address" required placeholder="Street, estate/building, town, county"></textarea>
              </div>
              <button type="submit" class="btn btn-accent btn-block" id="place-order-btn">Place order — ${money(cart.subtotal)}</button>
            </form>
          </div>
          <div class="summary-panel">
            <h3 style="font-size:15px;margin-bottom:14px;">Order summary</h3>
            ${cart.items.map((i) => `<div class="summary-row"><span>${escapeHtml(i.name)} × ${i.quantity}</span><span class="price">${money(i.price * i.quantity)}</span></div>`).join('')}
            <div class="summary-row total"><span>Total</span><span class="price">${money(cart.subtotal)}</span></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('checkout-error');
      errorEl.textContent = '';
      const btn = document.getElementById('place-order-btn');

      const name = document.getElementById('ck-name').value.trim();
      const phone = document.getElementById('ck-phone').value.trim();
      const addressText = document.getElementById('ck-address').value.trim();
      const fullAddress = `${name}, ${phone} — ${addressText}`;

      btn.disabled = true;
      btn.textContent = 'Placing order…';

      try {
        const result = await api('/orders', { method: 'POST', body: JSON.stringify({ address: fullAddress }) });
        refreshCartBadge();
        refreshNotifications();
        renderOrderConfirmation(result.order, result.items);
      } catch (err) {
        errorEl.textContent = err.message;
        btn.disabled = false;
        btn.textContent = `Place order — ${money(cart.subtotal)}`;
      }
    });
  } catch (err) {
    root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Something went wrong</h3><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

function renderOrderConfirmation(order, items) {
  root.innerHTML = `
    <div class="wrap section-pad">
      <div class="confirm-panel">
        <div class="confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4,13 L9,18 L20,6"/></svg>
        </div>
        <h1 style="font-size:24px;margin-bottom:10px;">Order placed</h1>
        <p style="color:var(--ink-soft);margin-bottom:28px;">Order #${order.id} · ${money(order.total)} · ${items.length} item${items.length === 1 ? '' : 's'}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="#/orders" class="btn btn-accent">View my orders</a>
          <a href="#/" class="btn btn-ghost">Continue shopping</a>
        </div>
      </div>
    </div>
  `;
}

// ---------------- ORDERS ----------------
async function renderOrders() {
  if (!authToken) { location.hash = '#/account'; return; }

  root.innerHTML = `<div class="wrap section-pad"><p>Loading orders…</p></div>`;

  try {
    const { orders } = await api('/orders');

    if (orders.length === 0) {
      root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>No orders yet</h3><p><a href="#/" class="btn" style="margin-top:16px;display:inline-flex;">Start shopping</a></p></div></div>`;
      return;
    }

    root.innerHTML = `
      <div class="wrap section-pad">
        <h1 style="font-size:24px;margin-bottom:24px;">Your Orders</h1>
        ${orders.map(orderCardHtml).join('')}
      </div>
    `;
  } catch (err) {
    root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Couldn't load orders</h3><p>${escapeHtml(err.message)}</p></div></div>`;
  }
}

function orderCardHtml(order) {
  const date = new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  return `
    <div class="order-card">
      <div class="order-head">
        <div>
          <div class="order-id">Order #${order.id} · ${date}</div>
        </div>
        <span class="order-status">${escapeHtml(order.status)}</span>
      </div>
      ${order.items.map((i) => `<div class="order-line"><span>${escapeHtml(i.name)} × ${i.quantity}</span><span class="price">${money(i.price * i.quantity)}</span></div>`).join('')}
      <div class="order-total-row"><span>Total</span><span class="price">${money(order.total)}</span></div>
    </div>
  `;
}

// ---------------- ACCOUNT ----------------
function renderAccount() {
  if (currentUser) {
    root.innerHTML = `
      <div class="wrap section-pad">
        <div class="account-panel">
          <div class="account-card">
            <div class="account-name">${escapeHtml(currentUser.name)}</div>
            <div class="account-email">${escapeHtml(currentUser.email)}</div>
            ${currentUser.isAdmin ? `<a href="#/admin" class="btn btn-accent btn-block" style="margin-bottom:10px;">Go to Admin Dashboard</a>` : ''}
            <a href="#/orders" class="btn btn-ghost btn-block" style="margin-bottom:10px;">View order history</a>
            <button class="btn btn-block" id="logout-btn">Sign out</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('logout-btn').addEventListener('click', () => {
      clearSession();
      showToast('Signed out');
      location.hash = '#/';
    });
    return;
  }

  root.innerHTML = `
    <div class="wrap section-pad">
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="auth-toggle">
            <button type="button" id="tab-login" class="active">Sign in</button>
            <button type="button" id="tab-register">Create account</button>
          </div>

          <form id="login-form">
            <div class="form-row"><label for="li-email">Email</label><input id="li-email" type="email" required /></div>
            <div class="form-row"><label for="li-password">Password</label><input id="li-password" type="password" required /></div>
            <p class="form-error" id="login-error"></p>
            <button type="submit" class="btn btn-accent btn-block">Sign in</button>
          </form>

          <form id="register-form" class="hidden">
            <div class="form-row"><label for="rg-name">Full name</label><input id="rg-name" type="text" required /></div>
            <div class="form-row"><label for="rg-email">Email</label><input id="rg-email" type="email" required /></div>
            <div class="form-row"><label for="rg-password">Password</label><input id="rg-password" type="password" minlength="6" required /></div>
            <p class="form-error" id="register-error"></p>
            <button type="submit" class="btn btn-accent btn-block">Create account</button>
          </form>
        </div>
      </div>
    </div>
  `;

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden'); registerForm.classList.add('hidden');
  });
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden'); loginForm.classList.add('hidden');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    try {
      const email = document.getElementById('li-email').value;
      const password = document.getElementById('li-password').value;
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setSession(data.token, data.user);
      refreshCartBadge();
      showToast(`Welcome back, ${data.user.name.split(' ')[0]}`);
      location.hash = '#/';
    } catch (err) { errorEl.textContent = err.message; }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('register-error');
    errorEl.textContent = '';
    try {
      const name = document.getElementById('rg-name').value;
      const email = document.getElementById('rg-email').value;
      const password = document.getElementById('rg-password').value;
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setSession(data.token, data.user);
      refreshCartBadge();
      showToast(`Welcome, ${data.user.name.split(' ')[0]}`);
      location.hash = '#/';
    } catch (err) { errorEl.textContent = err.message; }
  });
}

// ==================================================================
// ADMIN DASHBOARD — monitor customer orders, manage the catalog
// ==================================================================

const ADMIN_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'products', label: 'Products' },
  { key: 'customers', label: 'Customers' },
];

function adminShellHtml(activeTab) {
  return `
    <div class="wrap section-pad">
      <h1 style="font-size:24px;margin-bottom:6px;">Admin Dashboard</h1>
      <p style="color:var(--ink-faint);font-size:13.5px;margin-bottom:24px;">Zoo Group Holdings — internal use only</p>
      <div class="admin-tabs">
        ${ADMIN_TABS.map((t) => `<a href="#/admin?tab=${t.key}" class="admin-tab ${t.key === activeTab ? 'active' : ''}">${t.label}</a>`).join('')}
      </div>
      <div id="admin-content"><p>Loading…</p></div>
    </div>
  `;
}

async function renderAdmin(_segments, params) {
  if (!authToken || !currentUser) { location.hash = '#/account'; return; }

  if (!currentUser.isAdmin) {
    root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Admins only</h3><p>This area is restricted to Zoo Group Holdings staff accounts.</p></div></div>`;
    return;
  }

  const tab = params.get('tab') || 'overview';
  root.innerHTML = adminShellHtml(tab);
  const content = document.getElementById('admin-content');

  try {
    if (tab === 'orders') return renderAdminOrders(content, params);
    if (tab === 'products') return renderAdminProducts(content);
    if (tab === 'customers') return renderAdminCustomers(content);
    return renderAdminOverview(content);
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><h3>Something went wrong</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

// ---------------- Overview ----------------
async function renderAdminOverview(content) {
  const data = await api('/admin/overview');

  content.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value price">${money(data.totalRevenue)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Orders</div>
        <div class="stat-value">${data.totalOrders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Customers</div>
        <div class="stat-value">${data.totalCustomers}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Orders Today</div>
        <div class="stat-value">${data.todayOrders}</div>
      </div>
    </div>

    ${data.lowStockCount > 0 ? `
      <div class="admin-panel">
        <h3>Low stock — ${data.lowStockCount} product${data.lowStockCount === 1 ? '' : 's'} at 10 units or fewer</h3>
        ${data.lowStockProducts.map((p) => `<div class="admin-row"><span>${escapeHtml(p.name)}</span><span class="stock-low">${p.stock} left</span></div>`).join('')}
      </div>
    ` : ''}

    <div class="admin-panel">
      <div class="admin-panel-head">
        <h3>Recent orders</h3>
        <a href="#/admin?tab=orders" class="admin-link-small">View all →</a>
      </div>
      ${data.recentOrders.length === 0 ? '<p style="color:var(--ink-faint);font-size:14px;">No orders yet.</p>' :
        data.recentOrders.map((o) => `
          <div class="admin-row">
            <span>#${o.id} · ${escapeHtml(o.customerName)}</span>
            <span class="price">${money(o.total)}</span>
            <span class="order-status">${escapeHtml(o.status)}</span>
          </div>
        `).join('')
      }
    </div>
  `;
}

// ---------------- Orders (monitor customer shopping) ----------------
async function renderAdminOrders(content, params) {
  const statusFilter = params.get('status') || 'All';
  const { orders } = await api(`/admin/orders${statusFilter !== 'All' ? `?status=${encodeURIComponent(statusFilter)}` : ''}`);

  const statuses = ['All', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'];

  content.innerHTML = `
    <div class="admin-filter-row">
      ${statuses.map((s) => `<a href="#/admin?tab=orders${s !== 'All' ? `&status=${s}` : ''}" class="filter-pill ${s === statusFilter ? 'active' : ''}">${s}</a>`).join('')}
    </div>

    ${orders.length === 0 ? '<div class="empty-state"><h3>No orders found</h3></div>' :
      orders.map((o) => `
        <div class="admin-order-card">
          <div class="admin-order-head">
            <div>
              <div class="admin-order-id">Order #${o.id} · ${new Date(o.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              <div class="admin-order-customer">${escapeHtml(o.customerName)} · ${escapeHtml(o.customerEmail)}</div>
            </div>
            <select class="status-select" data-order-id="${o.id}">
              ${statuses.filter((s) => s !== 'All').map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          ${o.items.map((i) => `<div class="order-line"><span>${escapeHtml(i.name)} × ${i.quantity}</span><span class="price">${money(i.price * i.quantity)}</span></div>`).join('')}
          <div class="order-total-row"><span>Total</span><span class="price">${money(o.total)}</span></div>
          <div class="admin-order-address">Delivery: ${escapeHtml(o.address)}</div>
          <div class="admin-order-actions">
            <a href="#/admin/invoice/${o.id}" class="btn-ghost btn-small">View / print invoice</a>
            <button type="button" class="btn btn-small" data-download-invoice-id="${o.id}">Download invoice</button>
          </div>
        </div>
      `).join('')
    }
  `;

  content.querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const orderId = sel.dataset.orderId;
      const newStatus = sel.value;
      try {
        await api(`/admin/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
        showToast(`Order #${orderId} marked as ${newStatus}`);
      } catch (err) {
        showToast(err.message);
      }
    });
  });

  content.querySelectorAll('[data-download-invoice-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const order = orders.find((o) => o.id === Number(btn.dataset.downloadInvoiceId));
      if (order) downloadInvoicePdf(order, btn);
    });
  });
}

// Builds the invoice content markup (letterhead, bill-to, item table, total)
// shared by the in-app invoice page. Uses the site logo so it matches the
// storefront branding.
function invoiceBodyHtml(order) {
  const dateStr = new Date(order.created_at).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const rows = order.items.map((i) => `
    <tr>
      <td>${escapeHtml(i.name)}</td>
      <td class="num">${i.quantity}</td>
      <td class="num">${money(i.price)}</td>
      <td class="num">${money(i.price * i.quantity)}</td>
    </tr>`).join('');

  return `
    <div class="invoice-header">
      <div class="brand">
        <img src="images/logo-icon.png" alt="Zoo Group Holdings" class="invoice-logo" />
        <div>Zoo Group Holdings<small>Online Store · Kenya</small></div>
      </div>
      <div>
        <h1>INVOICE</h1>
        <div class="meta">
          Order #${order.id}<br />
          ${dateStr}<br />
          <span class="status-badge">${escapeHtml(order.status)}</span>
        </div>
      </div>
    </div>
    <div class="bill-to">
      <strong>Billed to</strong>
      ${escapeHtml(order.customerName)}<br />
      ${escapeHtml(order.customerEmail)}<br />
      ${escapeHtml(order.address)}
    </div>
    <table class="invoice-table">
      <thead>
        <tr><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Line total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="total-row"><td colspan="3">Total</td><td class="num">${money(order.total)}</td></tr>
      </tfoot>
    </table>
    <p class="footer-note">Thank you for shopping with Zoo Group Holdings. This is a system-generated invoice for order #${order.id}.</p>
  `;
}

// ---------------- Admin: standalone invoice page (#/admin/invoice/:id) ----------------
async function renderAdminInvoice(orderId) {
  if (!authToken || !currentUser) { location.hash = '#/account'; return; }
  if (!currentUser.isAdmin) {
    root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Admins only</h3><p>This area is restricted to Zoo Group Holdings staff accounts.</p></div></div>`;
    return;
  }

  root.innerHTML = `<div class="wrap section-pad"><p style="color:var(--ink-faint);">Loading invoice…</p></div>`;

  let order;
  try {
    const data = await api(`/admin/orders/${orderId}`);
    order = data.order;
  } catch (err) {
    root.innerHTML = `<div class="wrap section-pad"><div class="empty-state"><h3>Couldn't load this invoice</h3><p>${escapeHtml(err.message)}</p><a href="#/admin?tab=orders" class="btn btn-ghost" style="margin-top:12px;display:inline-block;">Back to orders</a></div></div>`;
    return;
  }

  root.innerHTML = `
    <div class="wrap section-pad invoice-page">
      <div class="invoice-page-actions no-print">
        <a href="#/admin?tab=orders" class="btn-ghost btn-small">← Back to orders</a>
        <div>
          <button type="button" class="btn-ghost btn-small" id="invoice-print-btn">Print</button>
          <button type="button" class="btn btn-small" id="invoice-download-btn">Download invoice</button>
        </div>
      </div>
      <div class="invoice-sheet">
        ${invoiceBodyHtml(order)}
      </div>
    </div>
  `;

  document.getElementById('invoice-print-btn').addEventListener('click', () => window.print());
  document.getElementById('invoice-download-btn').addEventListener('click', (e) => downloadInvoicePdf(order, e.currentTarget));
}

// ---- real, downloadable PDF invoice (via jsPDF, loaded on first use) ----
let jsPDFLoadPromise = null;
function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPDFLoadPromise) return jsPDFLoadPromise;
  jsPDFLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
      else reject(new Error('Could not load the PDF generator'));
    };
    script.onerror = () => {
      jsPDFLoadPromise = null;
      reject(new Error('Could not load the PDF generator — check your connection'));
    };
    document.head.appendChild(script);
  });
  return jsPDFLoadPromise;
}

// Fetches the site logo once and caches it as a base64 data URI so it can be
// embedded directly into the generated PDF via doc.addImage().
let logoDataUriPromise = null;
function loadLogoDataUri() {
  if (logoDataUriPromise) return logoDataUriPromise;
  logoDataUriPromise = fetch('images/logo-icon.png')
    .then((res) => {
      if (!res.ok) throw new Error('Logo not found');
      return res.blob();
    })
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read logo image'));
      reader.readAsDataURL(blob);
    }))
    .catch(() => null); // logo is a nice-to-have — invoice still generates without it
  return logoDataUriPromise;
}

async function downloadInvoicePdf(order, triggerBtn) {
  const originalLabel = triggerBtn ? triggerBtn.textContent : null;
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.textContent = 'Preparing…';
  }

  try {
    const [JsPDF, logoDataUri] = await Promise.all([loadJsPDF(), loadLogoDataUri()]);
    const doc = new JsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    let y = 56;

    const ink = [27, 42, 52];
    const faint = [138, 151, 160];
    const teal = [14, 165, 168];

    // ---- logo + brand + invoice title ----
    let brandX = marginX;
    if (logoDataUri) {
      const logoSize = 34;
      doc.addImage(logoDataUri, 'PNG', marginX, y - 22, logoSize, logoSize);
      brandX = marginX + logoSize + 10;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...ink);
    doc.text('Zoo Group Holdings', brandX, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...faint);
    doc.text('Online Store · Kenya', brandX, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...ink);
    doc.text('INVOICE', pageWidth - marginX, y, { align: 'right' });

    const dateStr = new Date(order.created_at).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(90, 100, 108);
    doc.text(`Order #${order.id}`, pageWidth - marginX, y + 16, { align: 'right' });
    doc.text(dateStr, pageWidth - marginX, y + 28, { align: 'right' });
    doc.text(`Status: ${order.status}`, pageWidth - marginX, y + 40, { align: 'right' });

    y += 60;
    doc.setDrawColor(...teal);
    doc.setLineWidth(2);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 30;

    // ---- billed to ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...faint);
    doc.text('BILLED TO', marginX, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...ink);
    doc.text(order.customerName, marginX, y); y += 14;
    doc.text(order.customerEmail, marginX, y); y += 14;
    const addressLines = doc.splitTextToSize(order.address, pageWidth - marginX * 2);
    doc.text(addressLines, marginX, y);
    y += addressLines.length * 13 + 20;

    // ---- item table ----
    const colItem = marginX;
    const colQty = pageWidth - marginX - 180;
    const colPrice = pageWidth - marginX - 100;
    const colTotal = pageWidth - marginX;

    function drawTableHeader() {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...faint);
      doc.text('ITEM', colItem, y);
      doc.text('QTY', colQty, y, { align: 'right' });
      doc.text('UNIT PRICE', colPrice, y, { align: 'right' });
      doc.text('LINE TOTAL', colTotal, y, { align: 'right' });
      y += 8;
      doc.setDrawColor(220, 225, 228);
      doc.setLineWidth(1);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 16;
    }
    drawTableHeader();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...ink);
    order.items.forEach((item) => {
      const nameLines = doc.splitTextToSize(item.name, colQty - colItem - 20);
      const rowHeight = Math.max(16, nameLines.length * 14);

      if (y + rowHeight > pageHeight - 90) {
        doc.addPage();
        y = 56;
        drawTableHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(...ink);
      }

      doc.text(nameLines, colItem, y);
      doc.text(String(item.quantity), colQty, y, { align: 'right' });
      doc.text(money(item.price), colPrice, y, { align: 'right' });
      doc.text(money(item.price * item.quantity), colTotal, y, { align: 'right' });
      y += rowHeight + 6;
      doc.setDrawColor(240, 242, 244);
      doc.setLineWidth(0.75);
      doc.line(marginX, y - 6, pageWidth - marginX, y - 6);
    });

    // ---- total ----
    y += 12;
    if (y > pageHeight - 90) { doc.addPage(); y = 56; }
    doc.setDrawColor(...ink);
    doc.setLineWidth(1.4);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...ink);
    doc.text('Total', colPrice, y, { align: 'right' });
    doc.text(money(order.total), colTotal, y, { align: 'right' });

    // ---- footer note ----
    y += 50;
    if (y > pageHeight - 40) { doc.addPage(); y = 56; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...faint);
    doc.text(
      `Thank you for shopping with Zoo Group Holdings. This is a system-generated invoice for order #${order.id}.`,
      pageWidth / 2, y, { align: 'center', maxWidth: pageWidth - marginX * 2 }
    );

    doc.save(`invoice-order-${order.id}.pdf`);
  } catch (err) {
    showToast(err.message || 'Could not generate the invoice PDF');
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.textContent = originalLabel;
    }
  }
}

// ---------------- Products (add goods to the market + manage catalog) ----------------
const ADMIN_ICON_OPTIONS = Object.keys(ICONS);
const ADMIN_COLOR_PRESETS = [
  { label: 'Teal', a: '#0EA5A8', b: '#4FD9DC' },
  { label: 'Amber', a: '#C9862F', b: '#F0B45C' },
  { label: 'Violet', a: '#6E4FD9', b: '#9C86ED' },
  { label: 'Rose', a: '#D94F72', b: '#F08BA5' },
  { label: 'Green', a: '#2E9E5B', b: '#63CC8A' },
  { label: 'Coral', a: '#E14A5A', b: '#F5828D' },
];

async function renderAdminProducts(content) {
  const { products } = await api('/admin/products');

  content.innerHTML = `
    <div class="admin-panel">
      <h3>Add a new product</h3>
      <p class="form-error" id="add-product-error"></p>
      <form id="add-product-form" class="admin-product-form">
        <div class="form-grid-2">
          <div class="form-row"><label for="ap-name">Product name</label><input id="ap-name" required /></div>
          <div class="form-row"><label for="ap-category">Category</label><input id="ap-category" required placeholder="e.g. Electronics" /></div>
        </div>
        <div class="form-row"><label for="ap-description">Description</label><textarea id="ap-description" required></textarea></div>
        <div class="form-grid-2">
          <div class="form-row"><label for="ap-price">Price (KES)</label><input id="ap-price" type="number" min="1" required /></div>
          <div class="form-row"><label for="ap-stock">Stock</label><input id="ap-stock" type="number" min="0" value="20" required /></div>
        </div>
        <div class="form-grid-2">
          <div class="form-row">
            <label for="ap-icon">Icon</label>
            <select id="ap-icon">${ADMIN_ICON_OPTIONS.map((k) => `<option value="${k}">${k}</option>`).join('')}</select>
          </div>
          <div class="form-row">
            <label for="ap-color">Color theme</label>
            <select id="ap-color">${ADMIN_COLOR_PRESETS.map((c, i) => `<option value="${i}">${c.label}</option>`).join('')}</select>
          </div>
        </div>
        <div class="form-row">
          <label for="ap-photo">Photo (optional — overrides the color block above)</label>
          <div class="photo-picker">
            <div class="photo-preview" id="ap-photo-preview"><span class="photo-preview-empty">No photo</span></div>
            <div class="photo-picker-actions">
              <input type="file" id="ap-photo" accept="image/jpeg,image/png,image/webp,image/gif" />
              <button type="button" class="btn-ghost btn-small" id="ap-photo-clear" hidden>Remove photo</button>
            </div>
          </div>
        </div>
        <button type="submit" class="btn btn-accent" id="ap-submit">Add product</button>
      </form>
    </div>

    <div class="admin-panel">
      <h3>Catalog (${products.length})</h3>
      <div class="admin-product-list">
        ${products.map(adminProductRowHtml).join('')}
      </div>
    </div>
  `;

  // ---- photo picker for the add-product form ----
  let selectedPhotoFile = null;
  const photoInput = document.getElementById('ap-photo');
  const photoPreview = document.getElementById('ap-photo-preview');
  const photoClearBtn = document.getElementById('ap-photo-clear');

  function updatePhotoPreview() {
    if (selectedPhotoFile) {
      const url = URL.createObjectURL(selectedPhotoFile);
      photoPreview.innerHTML = `<img src="${url}" alt="Selected product photo" />`;
      photoClearBtn.hidden = false;
    } else {
      photoPreview.innerHTML = `<span class="photo-preview-empty">No photo</span>`;
      photoClearBtn.hidden = true;
    }
  }

  photoInput.addEventListener('change', () => {
    selectedPhotoFile = photoInput.files[0] || null;
    updatePhotoPreview();
  });

  photoClearBtn.addEventListener('click', () => {
    selectedPhotoFile = null;
    photoInput.value = '';
    updatePhotoPreview();
  });

  document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('add-product-error');
    const submitBtn = document.getElementById('ap-submit');
    errorEl.textContent = '';

    const colorPreset = ADMIN_COLOR_PRESETS[Number(document.getElementById('ap-color').value)];

    const payload = {
      name: document.getElementById('ap-name').value.trim(),
      category: document.getElementById('ap-category').value.trim(),
      description: document.getElementById('ap-description').value.trim(),
      price: document.getElementById('ap-price').value,
      stock: document.getElementById('ap-stock').value,
      icon: document.getElementById('ap-icon').value,
      color_a: colorPreset.a,
      color_b: colorPreset.b,
    };

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;

    try {
      if (selectedPhotoFile) {
        submitBtn.textContent = 'Uploading photo…';
        const { url } = await apiUpload('/admin/products/upload', selectedPhotoFile);
        payload.image_url = url;
      }

      submitBtn.textContent = 'Adding product…';
      await api('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Product added to the market');
      renderAdminProducts(content);
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

  content.querySelectorAll('[data-toggle-active]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.toggleActive;
      const nextActive = btn.dataset.currentlyActive !== 'true';
      try {
        await api(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify({ active: nextActive }) });
        showToast(nextActive ? 'Product restored to the market' : 'Product removed from the market');
        renderAdminProducts(content);
      } catch (err) {
        showToast(err.message);
      }
    });
  });

  content.querySelectorAll('[data-stock-save]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.stockSave;
      const input = document.querySelector(`[data-stock-input="${id}"]`);
      try {
        await api(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify({ stock: input.value }) });
        showToast('Stock updated');
      } catch (err) {
        showToast(err.message);
      }
    });
  });

  // ---- click an existing product's thumbnail in the catalog to replace its photo ----
  content.querySelectorAll('[data-photo-input]').forEach((input) => {
    input.addEventListener('change', async () => {
      const id = input.dataset.photoInput;
      const file = input.files[0];
      if (!file) return;
      try {
        const { url } = await apiUpload('/admin/products/upload', file);
        await api(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify({ image_url: url }) });
        showToast('Photo updated');
        renderAdminProducts(content);
      } catch (err) {
        showToast(err.message);
      }
    });
  });
}

function adminProductRowHtml(p) {
  const media = mediaContent(p);
  return `
    <div class="admin-product-row ${p.active ? '' : 'inactive'}">
      <label class="admin-product-media" style="${media.style}" title="Click to change photo">
        ${media.inner}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-photo-input="${p.id}" hidden />
      </label>
      <div class="admin-product-info">
        <div class="admin-product-name">${escapeHtml(p.name)} ${p.active ? '' : '<span class="tag">removed</span>'}</div>
        <div class="admin-product-meta">${escapeHtml(p.category)} · <span class="price">${money(p.price)}</span></div>
      </div>
      <div class="admin-product-stock">
        <label>Stock</label>
        <input type="number" min="0" value="${p.stock}" data-stock-input="${p.id}" />
        <button class="btn-ghost btn-small" data-stock-save="${p.id}">Save</button>
      </div>
      <button class="btn-ghost btn-small" data-toggle-active="${p.id}" data-currently-active="${!!p.active}">
        ${p.active ? 'Remove from market' : 'Restore'}
      </button>
    </div>
  `;
}

// ---------------- Customers ----------------
async function renderAdminCustomers(content) {
  const { customers } = await api('/admin/customers');

  content.innerHTML = `
    <div class="admin-panel">
      <h3>Customers (${customers.length})</h3>
      ${customers.length === 0 ? '<p style="color:var(--ink-faint);font-size:14px;">No customers yet.</p>' :
        customers.map((c) => `
          <div class="admin-row">
            <span>${escapeHtml(c.name)} <span style="color:var(--ink-faint);">· ${escapeHtml(c.email)}</span></span>
            <span>${c.orderCount} order${c.orderCount === 1 ? '' : 's'}</span>
            <span class="price">${money(c.totalSpent)}</span>
          </div>
        `).join('')
      }
    </div>
  `;
}
