
// Vowora live supplier directory
(() => {
  const CORE_CATEGORIES = [
    "Venue","Hotel","Caterer","Florist","Cake","Photo & Video","Photographer","Videographer",
    "Coordinator","Planner","HMUA","DJ / Entertainment","Band / Live Music","Lights & Sounds",
    "Dress / Gown","Suit / Barong","Rings / Jewelry","Beverage / Mobile Bar","Invitations",
    "Souvenirs","Transport","Styling / Decor","Church / Ceremony Suppliers","Event Rentals",
    "Bridal Car / Wedding Car","Accommodation","Hair / Beauty","Music / Extras"
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
    if (s.includes('photo') && s.includes('video')) return 'Photo & Video';
    if (s.includes('photo')) return 'Photographer';
    if (s.includes('video')) return 'Videographer';
    if (s.includes('planner')) return 'Planner';
    if (s.includes('coordinator') || s.includes('event management')) return 'Coordinator';
    if (s.includes('make-up') || s.includes('makeup') || s.includes('beauty')) return 'HMUA';
    if (s.includes('audio') || s.includes('light') || s.includes('sound')) return 'Lights & Sounds';
    if (s.includes('bridal') || s.includes('gown') || s.includes('dress')) return 'Dress / Gown';
    if (s.includes('barong') || s.includes('suit')) return 'Suit / Barong';
    if (s.includes('ring') || s.includes('jewel')) return 'Rings / Jewelry';
    if (s.includes('beverage') || s.includes('mobile bar') || s.includes('bar service')) return 'Beverage / Mobile Bar';
    if (s.includes('invitation')) return 'Invitations';
    if (s.includes('souvenir')) return 'Souvenirs';
    if (s.includes('transport') || s.includes('car rental')) return 'Transport';
    if (s.includes('decor') || s.includes('styling')) return 'Styling / Decor';
    if (s.includes('rental')) return 'Event Rentals';
    return c || 'Other';
  }

  function setupCloudFilters() {
    const cats = [...new Set([...CORE_CATEGORIES, ...cloudSuppliers.map(v => v.cat)])];
    const fcat = document.getElementById('fcat');
    if (fcat) {
      const current = fcat.value || 'All categories';
      fcat.innerHTML = '<option>All categories</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
      if ([...fcat.options].some(o => o.value === current)) fcat.value = current;
    }
  }

  window.render = function renderCloudSuppliers() {
    const catalog = document.getElementById('catalog');
    const fcity = document.getElementById('fcity');
    const fprice = document.getElementById('fprice');
    const fcat = document.getElementById('fcat');
    const fsort = document.getElementById('fsort');
    if (!catalog || !fcity || !fcat) return;

    let list = cloudSuppliers.filter(v =>
      (fcity.value === 'All cities' || v.city === fcity.value) &&
      (!fprice || fprice.value === 'Any price range' || v.price === fprice.value) &&
      (fcat.value === 'All categories' || !fcat.value || v.cat === fcat.value) &&
      (!window.active || window.active === 'All' || v.cat === window.active)
    );

    if (fsort && fsort.value === 'Name A–Z') {
      list.sort((a,b)=>a.name.localeCompare(b.name));
    }

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
          ${esc(v.price || 'Rate on request')}
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
        <h3>No live supplier listing here yet — but the category is available.</h3>
        <p>Vowora keeps this category open so couples can plan completely. We will connect and onboard local suppliers as couples request them. You can still shortlist the category, record a supplier name manually, and request Vowora sourcing support.</p>
        <div class="actions">
          <button class="quote" onclick="alert('Vowora sourcing request noted. This feature will connect the couple with suitable suppliers when supplier outreach is enabled.')">Find suppliers for me</button>
        </div>
      </div>`;
  };

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
        note: r.description || r.category,
        phone: r.phone || '',
        status: r.verified_status || 'public_listing',
        address: r.address || '',
        rating: r.rating || '',
        review_count: r.review_count || 0
      }));

      cloudLoaded = true;
      setupCloudFilters();
      window.render();
    } catch (err) {
      console.error(err);
      cloudLoaded = true;
      const catalog = document.getElementById('catalog');
      if (catalog) {
        catalog.innerHTML = `<div class="card"><h3>Supplier directory connection needs attention.</h3><p>${esc(err.message)}</p></div>`;
      }
    }
  }

  window.addEventListener('DOMContentLoaded', loadCloudSuppliers);
  if (document.readyState !== 'loading') loadCloudSuppliers();
})();
