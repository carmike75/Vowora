
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

  function setCloudUiSignedIn(user) {
    const signedIn = !!user;
    const verified = !!user?.email_confirmed_at;
    const resendBtn = $("cloudResendBtn");
    if (resendBtn) {
      resendBtn.style.display = (signedIn && verified) ? "none" : "";
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend confirmation email";
      resendBtn.style.pointerEvents = "auto";
      resendBtn.style.opacity = "1";
    }
    ["cloudSaveBtn","cloudLoadBtn","invitePartnerBtn","publishWeddingBtn","copyShareBtn"].forEach(id => {
      const el = $(id);
      if (!el) return;
      // Keep actions clickable at all times. Their handlers explain when sign-in is required.
      el.disabled = false;
      el.style.pointerEvents = "auto";
      el.style.opacity = "1";
      el.style.cursor = "pointer";
      el.setAttribute("aria-disabled","false");
    });
    if ($("cloudSignInBtn")) {
      $("cloudSignInBtn").disabled = false;
      $("cloudSignInBtn").style.pointerEvents = "auto";
      $("cloudSignInBtn").style.opacity = "1";
      $("cloudSignInBtn").style.cursor = "pointer";
      $("cloudSignInBtn").textContent = signedIn ? "Signed in" : "Sign in";
    }
    if ($("cloudSignUpBtn")) {
      $("cloudSignUpBtn").disabled = false;
      $("cloudSignUpBtn").style.pointerEvents = "auto";
      $("cloudSignUpBtn").style.opacity = "1";
      $("cloudSignUpBtn").style.cursor = "pointer";
    }
  }

  async function signUp() {
    const email = $("cloudEmail")?.value.trim();
    const password = $("cloudPassword")?.value;
    if (!email || !password) return status("Enter an email and password first.");
    status("Creating your secure Vowora account...");
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: location.origin + location.pathname }
    });
    if (error) {
      const msg = String(error.message || error);
      if (/rate limit/i.test(msg)) {
        return status("Account email request limit reached. Please wait a few minutes, then try Create account again. If this email already has an account, use Sign in instead.");
      }
      return status("Sign-up error: " + msg);
    }
    if (data.user?.identities?.length === 0) {
      return status("This email already appears to have a Vowora account. Use Sign in instead.");
    }
    if (data.session) {
      setCloudUiSignedIn(data.user);
      status("Account created and signed in. Your wedding can now be saved to the cloud.");
      return;
    }
    status("Account created. We sent a confirmation email to " + email + ". Open that email and click the confirmation link. Then return to Vowora and click Sign in. Check Spam/Junk if you do not see it.");
  }

  let resendCooldownTimer = null;
  async function resendConfirmation() {
    const email = $("cloudEmail")?.value.trim();
    if (!email) return status("Enter the email address first.");

    const user = await getUser();
    if (user?.email_confirmed_at) {
      setCloudUiSignedIn(user);
      return status("Email verified. You are already signed in as " + (user.email || email) + ". No confirmation email is needed.");
    }

    const btn = $("cloudResendBtn");
    if (btn?.disabled) return;
    if (btn) {
      btn.disabled = true;
      btn.style.pointerEvents = "none";
      btn.style.opacity = ".65";
      btn.textContent = "Sending...";
    }

    const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) {
      const msg = String(error.message || error);
      if (btn) {
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
        btn.textContent = "Resend confirmation email";
      }
      if (/rate limit|too many|security purposes/i.test(msg)) {
        return status("A confirmation email was already requested recently. Please wait before requesting another one, and check Inbox or Spam/Junk.");
      }
      return status("Confirmation email error: " + msg);
    }

    status("Confirmation email requested for " + email + ". Check Inbox and Spam/Junk. Please wait before requesting another.");
    let remaining = 60;
    clearInterval(resendCooldownTimer);
    resendCooldownTimer = setInterval(() => {
      remaining -= 1;
      if (!btn) return clearInterval(resendCooldownTimer);
      if (remaining <= 0) {
        clearInterval(resendCooldownTimer);
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
        btn.textContent = "Resend confirmation email";
      } else {
        btn.textContent = "Resend available in " + remaining + "s";
      }
    }, 1000);
  }

  async function signIn() {
    const email = $("cloudEmail")?.value.trim();
    const password = $("cloudPassword")?.value;
    if (!email || !password) return status("Enter your email and password.");
    status("Signing in...");
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = String(error.message || error);
      if (/email not confirmed/i.test(msg)) return status("Email not confirmed yet. Open the Vowora confirmation email sent to " + email + ", click the confirmation link, then return here and click Sign in again. Check Spam/Junk if needed.");
      if (/invalid login credentials/i.test(msg)) return status("Sign-in failed. Check the email/password. If this is a new email, create the account first.");
      return status("Sign-in error: " + msg);
    }
    setCloudUiSignedIn(data.user);
    status("Email verified. Signed in securely as " + data.user.email + ". Looking for your saved wedding...");
    await acceptInviteForUser(data.user);
    await loadWedding();
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

    status("Saving wedding to the cloud...");

    // Resolve the wedding row from the database instead of trusting a stale
    // browser-stored wedding ID. This also prevents accidental duplicate weddings.
    let wedding = null;

    if (currentWeddingId) {
      const { data, error } = await sb
        .from("weddings")
        .select("*")
        .eq("id", currentWeddingId)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (error) console.warn("Stored wedding lookup failed:", error);
      wedding = data || null;
      if (!wedding) {
        currentWeddingId = null;
        localStorage.removeItem("voworaCloudWeddingId");
      }
    }

    if (!wedding) {
      const { data, error } = await sb
        .from("weddings")
        .select("*")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) return status("Cloud lookup error: " + error.message);
      wedding = data?.[0] || null;
      if (wedding) {
        currentWeddingId = wedding.id;
        localStorage.setItem("voworaCloudWeddingId", currentWeddingId);
      }
    }

    if (wedding) {
      const { error } = await sb
        .from("weddings")
        .update(payload)
        .eq("id", wedding.id)
        .eq("owner_id", user.id);
      if (error) return status("Cloud save error: " + error.message);
      currentWeddingId = wedding.id;
    } else {
      const { data, error } = await sb
        .from("weddings")
        .insert(payload)
        .select("id");
      if (error) return status("Cloud save error: " + error.message);
      const created = data?.[0];
      if (!created?.id) return status("Cloud save error: wedding was not created. Please check the wedding database permissions.");
      currentWeddingId = created.id;
    }

    localStorage.setItem("voworaCloudWeddingId", currentWeddingId);

    const taskRows = Object.entries(t).map(([task_key, completed], i) => ({
      wedding_id: currentWeddingId,
      task_key,
      completed: !!completed,
      sort_order: i
    }));

    if (taskRows.length) {
      const { error: taskErr } = await sb.from("wedding_tasks").upsert(taskRows, { onConflict: "wedding_id,task_key" });
      if (taskErr) return status("Wedding details saved, but task sync failed: " + taskErr.message);
    }

    // Sync up to three couple background photos to the existing wedding_photos table.
    // Data URLs are already resized/compressed by the profile uploader.
    const slides = Array.isArray(p.slides) ? p.slides.slice(0,3) : [];
    const { error: photoDeleteErr } = await sb.from("wedding_photos").delete().eq("wedding_id", currentWeddingId);
    if (photoDeleteErr) return status("Wedding details saved, but background photo sync failed: " + photoDeleteErr.message);
    if (slides.length) {
      const photoRows = slides.map((url, i) => ({
        wedding_id: currentWeddingId,
        photo_url: url,
        sort_order: i
      }));
      const { error: photoInsertErr } = await sb.from("wedding_photos").insert(photoRows);
      if (photoInsertErr) return status("Wedding details saved, but background photo sync failed: " + photoInsertErr.message);
    }

    status("Wedding and background photos saved to the cloud successfully.");
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

    // Load the couple background photos from Supabase so they follow the couple
    // across browsers/devices. If none exist yet, preserve same-device local photos.
    const { data: cloudPhotos, error: photoLoadErr } = await sb
      .from("wedding_photos")
      .select("photo_url,sort_order")
      .eq("wedding_id", currentWeddingId)
      .order("sort_order", { ascending: true })
      .limit(3);
    if (photoLoadErr) return status("Wedding found, but background photo load failed: " + photoLoadErr.message);

    const localProfile = profile();
    const sameCouple = (!localProfile.p1 || localProfile.p1 === (wedding.partner1 || "")) &&
                       (!localProfile.p2 || localProfile.p2 === (wedding.partner2 || ""));
    const cloudSlides = (cloudPhotos || []).map(r => r.photo_url).filter(Boolean).slice(0,3);
    const p = {
      p1: wedding.partner1 || "",
      p2: wedding.partner2 || "",
      date: wedding.wedding_date || "",
      city: wedding.city || "",
      guests: wedding.guest_count || 0,
      budget: Number(wedding.budget_php || 0),
      profile: wedding.profile_photo_url || (sameCouple ? localProfile.profile : null) || null,
      slides: cloudSlides.length ? cloudSlides : (sameCouple && Array.isArray(localProfile.slides) ? localProfile.slides.slice(0,3) : []),
      email: (sameCouple && localProfile.email) ? localProfile.email : (user.email || ""),
      phone: (sameCouple && localProfile.phone) ? localProfile.phone : ""
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

  async function newWedding() {
    const ok = confirm("Start a completely fresh wedding? This clears this couple from the screen and signs out the current Vowora account on this device. The existing cloud wedding remains saved.");
    if (!ok) return;

    currentWeddingId = null;
    localStorage.removeItem("voworaCloudWeddingId");

    // Sign out first so init/auth cannot immediately repopulate the previous email.
    try { await sb.auth.signOut(); } catch (e) { console.warn("Vowora sign-out during fresh wedding:", e); }

    // startNewCouple has its own confirmation, so clear directly here to avoid a second prompt.
    [
      "voworaProfile","voworaTasks","voworaBudget","voworaBudgetItems","voworaGuests",
      "voworaGuestList","voworaVendorShortlist","voworaDocuments","voworaCeremony",
      "voworaAttire","voworaWeddingWeek","voworaQuoteContact"
    ].forEach(k => localStorage.removeItem(k));
    localStorage.setItem("voworaTasks", JSON.stringify({setup:false}));

    ["p1","p2","wdate","wcity","guestCount","workingBudget","coupleEmail","couplePhone",
     "cloudEmail","cloudPassword","partnerEmail","publicShareLink","quoteEmail","quotePhone"]
      .forEach(id => { const el=$(id); if(el) el.value=""; });
    ["profileUpload","slideUpload"].forEach(id => { const el=$(id); if(el) el.value=""; });

    document.querySelectorAll(".profile-photo,.mini-avatar").forEach(el => {
      el.classList.add("no-photo");
      el.style.setProperty("background-image","none","important");
    });
    const hero=document.querySelector(".personal-hero");
    if(hero) hero.querySelectorAll(".slide").forEach(el=>el.remove());

    if ($("sideNames")) $("sideNames").textContent="Your Wedding";
    if ($("heroNames")) $("heroNames").textContent="Your Names Here";
    if ($("heroLocation")) $("heroLocation").textContent="Choose your wedding city · Your wedding, fully connected.";
    if ($("sideDate")) $("sideDate").innerHTML="Wedding date not set<br>Choose your city";

    if (typeof window.renderTodo === "function") window.renderTodo();
    if (typeof window.countdown === "function") window.countdown();
    setCloudUiSignedIn(null);
    status("Fresh wedding ready. No couple is signed in. Enter the new couple details or create/sign in to their Vowora account.");

    // A full reload is intentional: it proves the old auth session and old form state are gone.
    location.replace(location.origin + location.pathname + "?fresh=" + Date.now());
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

  window.VOWORA_CLOUD = {
    signUp, signIn, resendConfirmation, saveWedding, loadWedding, invitePartner,
    publishWedding, copyShare, newWedding
  };

  function bindCloudButton(id, handler) {
    const el = $(id);
    if (!el || el.dataset.voworaBound === "1") return;
    el.dataset.voworaBound = "1";
    el.disabled = false;
    el.style.pointerEvents = "auto";
    if (el.getAttribute("onclick")) return;
    el.addEventListener("click", async (ev) => {
      ev.preventDefault();
      try {
        await handler();
      } catch (err) {
        console.error(err);
        status("Cloud action error: " + (err?.message || err));
      }
    });
  }

  async function initCloudControls() {
    bindCloudButton("cloudSignUpBtn", signUp);
    bindCloudButton("cloudSignInBtn", signIn);
    bindCloudButton("cloudSaveBtn", saveWedding);
    bindCloudButton("cloudLoadBtn", loadWedding);
    bindCloudButton("invitePartnerBtn", invitePartner);
    bindCloudButton("publishWeddingBtn", publishWedding);
    bindCloudButton("copyShareBtn", copyShare);
    bindCloudButton("newWeddingBtn", newWedding);

    const freshStart = new URLSearchParams(location.search).has("fresh");
    if (freshStart) {
      try { await sb.auth.signOut(); } catch (_) {}
      ["cloudEmail","cloudPassword","partnerEmail","publicShareLink"].forEach(id => { const el=$(id); if(el) el.value=""; });
      history.replaceState({}, "", location.pathname);
    }
    const { data: { user } } = await sb.auth.getUser();
    setCloudUiSignedIn(user);
    if (user) {
      if ($("cloudEmail")) $("cloudEmail").value = user.email || "";
      const localWeddingProfile = profile();
      if (!localWeddingProfile.email && user.email) {
        localWeddingProfile.email = user.email;
        localStorage.setItem("voworaProfile", JSON.stringify(localWeddingProfile));
        if ($("coupleEmail")) $("coupleEmail").value = user.email;
      }
      if (user.email_confirmed_at) {
        status("Email verified. Signed in securely as " + (user.email || "user") + ". Cloud save and load are ready.");
      } else {
        status("Signed in, but email verification is still pending. Check your Inbox or Spam/Junk.");
      }
      await acceptInviteForUser(user);
    } else {
      status("Not signed in. Create an account once, or sign in with an existing account.");
    }
    await renderPublicWeddingIfNeeded();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initCloudControls, { once: true });
  } else {
    initCloudControls();
  }
})();
