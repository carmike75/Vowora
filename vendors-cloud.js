
// Vowora live supplier directory
// Loads public supplier listings from Supabase and replaces the demo supplier list.
(() => {
  const CORE_CATEGORIES = [
    'Venue','Hotel','Caterer','Florist','Cake','Photo & Video','Coordinator','HMUA',
    'Lights & Sounds','Dress / Gown','DJ / Entertainment','Suit / Barong','Beverage',
    'Invitations','Rings / Jewelry','Transport','Souvenirs'
  ];

  let cloudSuppliers = [];
  let cloudLoaded = false;

  const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));

  function normalizeCategory(c='') {
    const s = String(c).toLowerCase();
    if (s.includes('venue')) return 'Venue';
    if (s.includes('hotel')) return 'Hotel';
    if (s.includes('cater')) return 'Caterer';
    if (s.includes('flor')) return 'Florist';
    if (s.includes('cake') || s.includes('bakery') || s.includes('pastry')) return 'Cake';
    if (s.includes('photo')) return 'Photo & Video';
    if (s.includes('planner') || s.includes('coordinator') || s.includes('event management')) return 'Coordinator';
    if (s.includes('make-up') || s.includes('makeup') || s.includes('beauty')) return 'HMUA';
    if (s.includes('audio') || s.includes('light') || s.includes('sound')) return 'Lights & Sounds';
    if (s.includes('bridal') || s.includes('gown') || s.includes('dress')) return 'Dress / Gown';
    return c || 'Other';
  }

  function priceLabel(v) {
    return v.price_range || 'Rate on request';
  }

  function setupCloudFilters() {
    const cats = [...new Set([...CORE_CATEGORIES, ...cloudSuppliers.map(v => v.cat)])];
    if (window.fcat) {
      const current = fcat.value || 'All categories';
      fcat.innerHTML = '<option>All categories</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
      if ([...fcat.options].some(o => o.value === current)) fcat.value = current;
    }
    if (window.tabs) {
      const tabCats = ['All','Venue','Hotel','Caterer','Florist','Cake','Photo & Video','Coordinator','HMUA','Lights & Sounds','Dress / Gown'];
      tabs.innerHTML = tabCats.map(c => `<button class="${window.active===c?'active':''}" onclick="active='${esc(c)}';setupCloudFilters();render()">${esc(c)}</button>`).join('');
    }
  }

  window.render = function renderCloudSuppliers() {
    if (!window.catalog || !window.fcity || !window.fprice || !window.fcat || !window.fsort) return;
    let list = cloudSuppliers.filter(v =>
      (fcity.value === 'All cities' || v.city === fcity.value) &&
      (fprice.value === 'Any price range' || v.price === fprice.value) &&
      ((fcat.value === 'All categories' || !fcat.value) || v.cat === fcat.value) &&
      (window.active === 'All' || v.cat === window.active)
    );
    if (fsort.value === 'Name A–Z') list.sort((a,b)=>a.name.localeCompare(b.name));

    if (!cloudLoaded) {
      catalog.innerHTML = '<div class="card"><h3>Loading live suppliers…</h3><p>Connecting to the Vowora supplier directory.</p></div>';
      return;
    }

    catalog.innerHTML = list.map(v => `
      <article class="vendor">
        <h4>${esc(v.name)}</h4>
        <div class="meta">
          ${esc(v.city)} · ${esc(v.cat)}<br>
          ${esc(v.note || '')}${v.rating ? ` · ★ ${esc(v.rating)}` : ''}<br>
          ${esc(priceLabel(v))}
        </div>
        <span class="tag">${v.status === 'vowora_verified' ? 'Vowora Verified' : 'Public listing'}</span>
        ${v.address ? `<div class="meta" style="margin-top:8px">${esc(v.address)}</div>` : ''}
        <div class="actions">
          <button class="quote" onclick="alert('Quote request workflow will send this supplier your wedding date, guest count and requirements after your approval.')">Request Quote</button>
          <button class="callback" onclick="alert('${v.phone ? 'Contact: '+esc(v.phone) : 'Callback request will be enabled when this supplier confirms contact details with Vowora.'}')">Request Callback</button>
        </div>
      </article>
    `).join('') || `
      <div class="card">
        <h3>No supplier matches these filters yet.</h3>
        <p>Try another price range or category. Vowora is continuously expanding this city.</p>
      </div>`;
  };

  window.setupFilters = setupCloudFilters;

  async function loadCloudSuppliers() {
    try {
      if (!window.VOWORA_CONFIG?.supabaseUrl || !window.VOWORA_CONFIG?.supabaseAnonKey) {
        throw new Error('Vowora Supabase config is missing.');
      }
      const url = `${VOWORA_CONFIG.supabaseUrl}/rest/v1/vendor_profiles?select=id,business_name,city,category,description,phone,verified_status,address,rating,review_count,price_range&order=city.asc,business_name.asc`;
      const res = await fetch(url, {
        headers: {
          apikey: VOWORA_CONFIG.supabaseAnonKey,
          Authorization: `Bearer ${VOWORA_CONFIG.supabaseAnonKey}`
        }
      });
      if (!res.ok) throw new Error(`Supplier API error ${res.status}: ${await res.text()}`);
      const rows = await res.json();
      cloudSuppliers = rows.map(r => ({
        id: r.id,
        city: r.city,
        cat: normalizeCategory(r.category),
        name: r.business_name,
        price: r.price_range || 'Rate on request',
        price_range: r.price_range || 'Rate on request',
        note: r.description || r.category,
        phone: r.phone || '',
        status: r.verified_status || 'public_listing',
        address: r.address || '',
        rating: r.rating || '',
        review_count: r.review_count || 0
      }));
      cloudLoaded = true;
      setupCloudFilters();
      render();
    } catch (err) {
      console.error(err);
      cloudLoaded = true;
      if (window.catalog) {
        catalog.innerHTML = `<div class="card"><h3>Supplier directory connection needs attention.</h3><p>${esc(err.message)}</p></div>`;
      }
    }
  }

  // Ensure current "Standard/Premium/etc." filter doesn't hide newly loaded records by default.
  window.addEventListener('DOMContentLoaded', () => {
    if (window.fprice) fprice.value = 'Any price range';
    loadCloudSuppliers();
  });
  if (document.readyState !== 'loading') {
    if (window.fprice) fprice.value = 'Any price range';
    loadCloudSuppliers();
  }
})();
