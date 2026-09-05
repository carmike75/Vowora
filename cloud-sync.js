
(() => {
  const cfg = window.VOWORA_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    console.warn("Vowora cloud sync unavailable: missing config or Supabase library.");
    return;
  }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  window.VOWORA_SUPABASE = sb;
  let currentWeddingId = localStorage.getItem("voworaCloudWeddingId") || null;

  const $ = id => document.getElementById(id);
  const status = msg => { if ($("cloudStatus")) $("cloudStatus").textContent = msg; };
  const profile = () => JSON.parse(localStorage.getItem("voworaProfile") || "{}");
  const tasks = () => JSON.parse(localStorage.getItem("voworaTasks") || "{}");

  function setProfile(p, t) {
    localStorage.setItem("voworaProfile", JSON.stringify(p || {}));
    localStorage.setItem("voworaTasks", JSON.stringify(t || {}));
    if (typeof window.applyProfile === "function") window.applyProfile();
    if (typeof window.renderTodo === "function") window.renderTodo();
    if (typeof window.countdown === "function") window.countdown();
  }

  async function getUser() {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  }

  async function signUp() {
    const email = $("cloudEmail")?.value.trim();
    const password = $("cloudPassword")?.value;
    if (!email || !password) return status("Enter an email and password first.");
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return status("Sign-up error: " + error.message);
    status(data.user?.identities?.length === 0
      ? "This email may already have an account. Try Sign in."
      : "Account created. If email confirmation is enabled, confirm your email, then sign in.");
  }

  async function signIn() {
    const email = $("cloudEmail")?.value.trim();
    const password = $("cloudPassword")?.value;
    if (!email || !password) return status("Enter your email and password.");
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return status("Sign-in error: " + error.message);
    status("Signed in as " + data.user.email + ". You can now save or load your wedding.");
  }

  async function saveWedding() {
    const user = await getUser();
    if (!user) return status("Please sign in first.");

    const p = profile();
    const t = tasks();
    if (!p.p1 && !p.p2) return status("Enter the couple names before saving.");

    const payload = {
      partner1: p.p1 || "",
      partner2: p.p2 || "",
      wedding_date: p.date || null,
      city: p.city || null,
      guest_count: Number(p.guests || 0),
      budget_php: Number(p.budget || 0),
      profile_photo_url: p.profile || null,
      owner_id: user.id,
      updated_at: new Date().toISOString()
    };

    let wedding;
    if (currentWeddingId) {
      const { data, error } = await sb
        .from("weddings")
        .update(payload)
        .eq("id", currentWeddingId)
        .select()
        .single();
      if (error) return status("Cloud save error: " + error.message);
      wedding = data;
    } else {
      const { data, error } = await sb
        .from("weddings")
        .insert(payload)
        .select()
        .single();
      if (error) return status("Cloud save error: " + error.message);
      wedding = data;
      currentWeddingId = wedding.id;
      localStorage.setItem("voworaCloudWeddingId", currentWeddingId);
    }

    const taskRows = Object.entries(t).map(([task_key, completed], i) => ({
      wedding_id: currentWeddingId,
      task_key,
      completed: !!completed,
      sort_order: i
    }));

    if (taskRows.length) {
      const { error: taskErr } = await sb.from("wedding_tasks").upsert(taskRows, { onConflict: "wedding_id,task_key" });
      if (taskErr) return status("Wedding saved, but task sync failed: " + taskErr.message);
    }

    status("Wedding saved to the cloud. Your partner can now load the same wedding after joining it.");
  }

  async function loadWedding() {
    const user = await getUser();
    if (!user) return status("Please sign in first.");

    let wedding = null;

    if (currentWeddingId) {
      const { data } = await sb.from("weddings").select("*").eq("id", currentWeddingId).maybeSingle();
      wedding = data;
    }

    if (!wedding) {
      const { data, error } = await sb
        .from("wedding_members")
        .select("wedding_id, weddings(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);
      if (error) return status("Load error: " + error.message);
      if (data?.length) {
        wedding = data[0].weddings;
        currentWeddingId = data[0].wedding_id;
      }
    }

    if (!wedding) {
      const { data, error } = await sb.from("weddings").select("*").eq("owner_id", user.id).order("updated_at", { ascending: false }).limit(1);
      if (error) return status("Load error: " + error.message);
      wedding = data?.[0];
      if (wedding) currentWeddingId = wedding.id;
    }

    if (!wedding) return status("No saved wedding found for this account.");

    localStorage.setItem("voworaCloudWeddingId", currentWeddingId);

    const { data: taskRows, error: taskErr } = await sb
      .from("wedding_tasks")
      .select("task_key,completed")
      .eq("wedding_id", currentWeddingId);
    if (taskErr) return status("Wedding found, but task load failed: " + taskErr.message);

    const t = {};
    (taskRows || []).forEach(r => t[r.task_key] = !!r.completed);

    const p = {
      p1: wedding.partner1 || "",
      p2: wedding.partner2 || "",
      date: wedding.wedding_date || "",
      city: wedding.city || "",
      guests: wedding.guest_count || 0,
      budget: Number(wedding.budget_php || 0),
      profile: wedding.profile_photo_url || null,
      slides: []
    };

    setProfile(p, t);
    status("Saved wedding loaded. You are now continuing from the latest cloud progress.");
  }

  async function invitePartner() {
    const user = await getUser();
    if (!user) return status("Please sign in first.");
    if (!currentWeddingId) return status("Save the wedding to the cloud first.");
    const email = $("partnerEmail")?.value.trim().toLowerCase();
    if (!email) return status("Enter your partner's email.");

    const { error } = await sb.from("wedding_invites").insert({
      wedding_id: currentWeddingId,
      invited_email: email,
      invited_by: user.id
    });
    if (error) return status("Invite error: " + error.message);

    status("Partner invite created for " + email + ". After they create/sign in with that email, they can accept and load this wedding.");
  }

  async function publishWedding() {
    const user = await getUser();
    if (!user) return status("Please sign in first.");
    if (!currentWeddingId) return status("Save the wedding to the cloud first.");

    const token = crypto.randomUUID().replaceAll("-", "");
    const { error } = await sb.from("weddings").update({
      is_public: true,
      public_token: token
    }).eq("id", currentWeddingId);

    if (error) return status("Publish error: " + error.message);

    const link = `${location.origin}${location.pathname}?view=${token}`;
    if ($("publicShareLink")) $("publicShareLink").value = link;
    status("Read-only wedding link created. Friends can view it without changing your data.");
  }

  async function copyShare() {
    const v = $("publicShareLink")?.value;
    if (!v) return status("Create a share link first.");
    await navigator.clipboard.writeText(v);
    status("Share link copied.");
  }

  function newWedding() {
    const ok = confirm("Start a fresh wedding on this device? Your existing cloud wedding will remain saved and can be loaded again after sign-in.");
    if (!ok) return;
    currentWeddingId = null;
    localStorage.removeItem("voworaCloudWeddingId");
    if (typeof window.startNewCouple === "function") {
      window.startNewCouple();
    } else {
      localStorage.removeItem("voworaProfile");
      localStorage.removeItem("voworaTasks");
      location.reload();
    }
    status("Fresh wedding ready. Your previous cloud wedding remains safely saved.");
  }

  async function acceptInviteForUser(user) {
    if (!user?.email) return;
    const { data: invites } = await sb.from("wedding_invites")
      .select("id,wedding_id")
      .eq("invited_email", user.email.toLowerCase())
      .eq("status", "pending");
    if (!invites?.length) return;

    for (const inv of invites) {
      await sb.from("wedding_members").upsert({
        wedding_id: inv.wedding_id,
        user_id: user.id,
        role: "partner",
        status: "active"
      }, { onConflict: "wedding_id,user_id" });

      await sb.from("wedding_invites").update({
        status: "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString()
      }).eq("id", inv.id);

      currentWeddingId = inv.wedding_id;
      localStorage.setItem("voworaCloudWeddingId", currentWeddingId);
    }
    status("Partner invitation accepted. Click 'Load my saved wedding'.");
  }

  async function renderPublicWeddingIfNeeded() {
    const token = new URLSearchParams(location.search).get("view");
    if (!token) return;

    const { data, error } = await sb.rpc("get_public_wedding", { p_token: token });
    if (error || !data?.length) return;

    const w = data[0];
    const p = {
      p1: w.partner1 || "",
      p2: w.partner2 || "",
      date: w.wedding_date || "",
      city: w.city || "",
      guests: w.guest_count || 0,
      budget: 0,
      profile: w.profile_photo_url || null,
      slides: []
    };
    setProfile(p, {});
    document.body.classList.add("public-wedding-view");
    document.querySelectorAll("input,select,button").forEach(el => {
      if (!el.closest(".nav") && !el.closest(".bottomnav")) el.disabled = true;
    });
    status("Read-only wedding view. This shared page cannot change the couple's saved data.");
  }

  window.addEventListener("DOMContentLoaded", async () => {
    $("cloudSignUpBtn")?.addEventListener("click", signUp);
    $("cloudSignInBtn")?.addEventListener("click", signIn);
    $("cloudSaveBtn")?.addEventListener("click", saveWedding);
    $("cloudLoadBtn")?.addEventListener("click", loadWedding);
    $("invitePartnerBtn")?.addEventListener("click", invitePartner);
    $("publishWeddingBtn")?.addEventListener("click", publishWedding);
    $("copyShareBtn")?.addEventListener("click", copyShare);
    $("newWeddingBtn")?.addEventListener("click", newWedding);

    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      if ($("cloudEmail")) $("cloudEmail").value = user.email || "";
      status("Signed in as " + (user.email || "user") + ".");
      await acceptInviteForUser(user);
    }
    await renderPublicWeddingIfNeeded();
  });
})();
