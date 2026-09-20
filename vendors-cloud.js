
// Vowora live supplier directory
(() => {
  const CORE_CATEGORIES = [
    "Venue","Hotel","Caterer","Florist","Cake","Photo & Video","Photographer","Videographer",
    "Coordinator","Planner","HMUA","DJ / Entertainment","Band / Live Music","Lights & Sounds",
    "Dress / Gown","Suit / Barong","Rings / Jewelry","Beverage / Mobile Bar","Invitations",
    "Souvenirs","Transport","Styling / Decor","Church / Ceremony Suppliers","Event Rentals",
    "Bridal Car / Wedding Car","Accommodation","Hair / Beauty","Music / Extras"
  ];

  // Phase-one nationwide directory. These are public discovery listings, not
  // endorsements. Contact details remain hidden until a business is approved.
  const PUBLIC_DIRECTORY = [
    ['Manila','Hotel','The Manila Hotel'],['Manila','Hotel','Sheraton Manila Bay'],['Manila','Venue','Casa Ibarra'],
    ['Makati','Hotel','Makati Shangri-La, Manila'],['Makati','Hotel','Fairmont Makati'],['Makati','Hotel','New World Makati Hotel'],['Makati','Venue','The Blue Leaf Filipinas'],
    ['Taguig','Hotel','Shangri-La The Fort, Manila'],['Taguig','Hotel','Grand Hyatt Manila'],['Taguig','Hotel','F1 Hotel Manila'],['Taguig','Venue','The Blue Leaf Events Pavilion'],
    ['Pasay','Hotel','Conrad Manila'],['Pasay','Hotel','Manila Marriott Hotel'],['Pasay','Hotel','Hilton Manila'],['Pasay','Venue','Okada Manila'],
    ['Quezon City','Hotel','Seda Vertis North'],['Quezon City','Hotel','Novotel Manila Araneta City'],['Quezon City','Venue','Fernwood Gardens'],['Quezon City','Venue','Gazebo Royale'],
    ['Muntinlupa','Hotel','Acacia Hotel Manila'],['Muntinlupa','Hotel','Crimson Hotel Filinvest City'],['Muntinlupa','Venue','The Bellevue Manila'],
    ['Antipolo','Venue','Jardin de Miramar'],['Antipolo','Venue','The Mango Farm Events Place'],['Antipolo','Venue','Luljetta’s Place Garden Suites'],
    ['Tagaytay','Venue','Antonio’s'],['Tagaytay','Hotel','Taal Vista Hotel'],['Tagaytay','Venue','Hillcreek Gardens Tagaytay'],['Tagaytay','Venue','The Lake Hotel Tagaytay'],
    ['Silang','Venue','Narra Hill'],['Silang','Venue','Angelfields Nature Sanctuary'],['Silang','Venue','The Forest Barn'],
    ['Batangas City','Hotel','Lima Park Hotel'],['Nasugbu','Venue','Pico Sands Hotel'],['Lian','Venue','Matabungkay Beach Hotel'],
    ['Baguio','Hotel','The Manor at Camp John Hay'],['Baguio','Hotel','Baguio Country Club'],['Baguio','Hotel','The Forest Lodge at Camp John Hay'],['Baguio','Venue','Frangeli House'],
    ['Clark','Hotel','Clark Marriott Hotel'],['Clark','Hotel','Swissôtel Clark Philippines'],['Clark','Hotel','Quest Plus Conference Center Clark'],
    ['Subic','Hotel','The Lighthouse Marina Resort'],['Subic','Hotel','ACEA Subic Beach Resort'],['Olongapo','Hotel','Central Park Reef Resort'],
    ['Cebu City','Hotel','Radisson Blu Cebu'],['Cebu City','Hotel','Seda Central Bloc Cebu'],['Cebu City','Hotel','Waterfront Cebu City Hotel & Casino'],['Cebu City','Venue','Oakridge Pavilion'],
    ['Mandaue','Hotel','bai Hotel Cebu'],['Mandaue','Venue','City Sports Club Cebu'],
    ['Lapu-Lapu','Hotel','Shangri-La Mactan, Cebu'],['Lapu-Lapu','Hotel','Crimson Resort and Spa Mactan'],['Lapu-Lapu','Hotel','Jpark Island Resort & Waterpark Cebu'],['Lapu-Lapu','Hotel','Dusit Thani Mactan Cebu Resort'],
    ['Dumaguete','Hotel','Sierra Hotel'],['Dumaguete','Hotel','Hotel Essencia'],['Dumaguete','Venue','Bethel Guest House'],['Dumaguete','Venue','Southview Hotel'],
    ['Bacolod','Hotel','Seda Capitol Central'],['Bacolod','Hotel','L’Fisher Hotel'],['Bacolod','Hotel','Park Inn by Radisson Bacolod'],['Bacolod','Venue','Acacia Hotel Bacolod'],
    ['Iloilo City','Hotel','Courtyard by Marriott Iloilo'],['Iloilo City','Hotel','Richmonde Hotel Iloilo'],['Iloilo City','Hotel','Seda Atria'],['Iloilo City','Hotel','Park Inn by Radisson Iloilo'],
    ['Boracay','Hotel','Shangri-La Boracay'],['Boracay','Hotel','Discovery Boracay'],['Boracay','Hotel','Mövenpick Resort & Spa Boracay'],['Boracay','Hotel','Crimson Resort and Spa Boracay'],
    ['Puerto Princesa','Hotel','Princesa Garden Island Resort and Spa'],['Puerto Princesa','Hotel','Hue Hotels and Resorts Puerto Princesa'],['Puerto Princesa','Hotel','Best Western Plus The Ivywall Hotel'],
    ['Panglao','Hotel','Henann Resort Alona Beach'],['Panglao','Hotel','South Palms Resort Panglao'],['Panglao','Hotel','The Bellevue Resort'],['Panglao','Hotel','Amorita Resort'],
    ['Davao City','Hotel','DusitD2 Davao'],['Davao City','Hotel','Seda Abreeza'],['Davao City','Hotel','Park Inn by Radisson Davao'],['Davao City','Venue','Waterfront Insular Hotel Davao'],
    ['Cagayan de Oro','Hotel','Seda Centrio'],['Cagayan de Oro','Hotel','Limketkai Luxe Hotel'],['Cagayan de Oro','Venue','Pearlmont Hotel'],
    ['General Santos','Hotel','Greenleaf Hotel Gensan'],['General Santos','Hotel','Grand Summit Hotel General Santos'],['General Santos','Venue','Venue 88'],
    ['Legazpi','Hotel','The Marison Hotel'],['Legazpi','Hotel','Hotel St. Ellis'],['Legazpi','Hotel','PROXY by The Oriental Albay'],
    ['Naga City','Hotel','The Avenue Plaza Hotel'],['Naga City','Hotel','Villa Caceres Hotel'],['Naga City','Hotel','Summit Hotel Naga'],
    ['Tacloban','Hotel','Summit Hotel Tacloban'],['Tacloban','Hotel','Ironwood Hotel'],['Tacloban','Venue','Hotel XYZ'],
    ['Butuan','Hotel','Watergate Boutique Hotel'],['Butuan','Hotel','Almont Inland Resort'],['Butuan','Hotel','Butuan Grand Palace Hotel'],
    ['Zamboanga City','Hotel','Marcian Garden Hotel'],['Zamboanga City','Hotel','Garden Orchid Hotel'],['Zamboanga City','Hotel','Ever O Business Hotel']
  ].map(([city,cat,name],index) => ({
    id: `public-ph-${index+1}`,
    city, cat, name,
    note: 'Public discovery listing. Confirm packages, availability and terms directly with the business.',
    price: 'Rate on request', status: 'public_listing', address: '', phone: '', rating: '', review_count: 0,
    publicUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name+' '+city+' Philippines')}`
  }));

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
    const fcity = document.getElementById('fcity');
    const vendorCity = document.getElementById('vendorCity');
    const cities = [...new Set(cloudSuppliers.map(v => v.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    [fcity,vendorCity].forEach(select => {
      if (!select) return;
      const current = select.value;
      const first = select === fcity ? '<option value="All cities">All cities</option>' : '<option value="">Choose city</option>';
      select.innerHTML = first + cities.map(city => `<option>${esc(city)}</option>`).join('');
      if ([...select.options].some(o => o.value === current)) select.value = current;
    });
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
          ${v.status === 'vowora_verified' ? `<button class="quote" onclick="alert('Quote request workflow will send this supplier your wedding date, guest count and requirements after your approval.')">Request Quote</button>` : `<a class="quote" style="text-decoration:none;text-align:center;padding:9px;border-radius:8px;font-size:11px;font-weight:800" href="${esc(v.publicUrl || '#')}" target="_blank" rel="noopener">View public profile</a>`}
          <button class="callback" onclick="alert('${v.phone ? 'Contact: '+esc(v.phone) : 'Direct callback becomes available after this business claims and confirms its Vowora listing.'}')">${v.phone ? 'Contact supplier' : 'Claim pending'}</button>
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
      const approved = rows.map(r => ({
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

      const approvedKeys = new Set(approved.map(v => `${v.name}|${v.city}`.toLowerCase()));
      cloudSuppliers = [...approved, ...PUBLIC_DIRECTORY.filter(v => !approvedKeys.has(`${v.name}|${v.city}`.toLowerCase()))];

      cloudLoaded = true;
      setupCloudFilters();
      window.render();
    } catch (err) {
      console.error(err);
      cloudLoaded = true;
      cloudSuppliers = [...PUBLIC_DIRECTORY];
      setupCloudFilters();
      window.render();
    }
  }

  window.addEventListener('DOMContentLoaded', loadCloudSuppliers);
  if (document.readyState !== 'loading') loadCloudSuppliers();
})();
