/* Account screens. All data comes from window.AccountData (see account-data.js). */
(() => {
  const $ = id => document.getElementById(id);
  const D = window.AccountData;
  const WA = "917737930736";
  const U = (id, w = 900) => `https://images.unsplash.com/${id}?w=${w}&q=78&auto=format&fit=crop`;
  const inr = n => "₹" + Number(n).toLocaleString("en-IN");
  const fmt = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const fmtShort = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const daysTo = d => Math.ceil((new Date(d + "T00:00:00") - new Date().setHours(0, 0, 0, 0)) / 864e5);
  const initials = n => n.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wa = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const ICON = {
    flight: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.5 12.5v-1.6L11 7V3.6a1 1 0 0 0-2 0V7l-6.5 3.9v1.6L9 10.5v3.8l-1.8 1.3V17L10 16l2.8 1v-1.4L11 14.3v-3.8Z"/></svg>',
    hotel: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 16V5M2.5 12h15v4M2.5 9.5h6V12M8.5 9.5h6a3 3 0 0 1 3 3"/><circle cx="5.5" cy="8.6" r="1.4"/></svg>',
    transfer: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 13.5V10l1.6-4.2A1.5 1.5 0 0 1 6.5 5h7a1.5 1.5 0 0 1 1.4.8l1.6 4.2v3.5H3.5Z"/><path d="M3.5 10h13M5.5 13.5V15M14.5 13.5V15"/><circle cx="6.5" cy="11.8" r=".6"/><circle cx="13.5" cy="11.8" r=".6"/></svg>',
    train: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="3" width="10" height="11" rx="2.5"/><path d="M5 9h10M7.5 17l1-3M12.5 17l-1-3"/><circle cx="7.6" cy="11.5" r=".6"/><circle cx="12.4" cy="11.5" r=".6"/></svg>',
    alert: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 3 18 16.5H2Z"/><path d="M10 8v4M10 14.2v.3"/></svg>',
    info: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7.5"/><path d="M10 9v5M10 6.2v.3"/></svg>',
    wa: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16.5 5 13.6A6.8 6.8 0 1 1 7.3 15.6Z"/><path d="M7.6 7.4c.2 2.2 2.6 4.6 4.9 4.9l.9-1.2-1.6-.8-.7.7c-.8-.3-1.7-1.2-2-2l.7-.7-.8-1.6Z"/></svg>',
    copy: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="7" width="9.5" height="9.5" rx="2"/><path d="M13 7V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v6.5A1.5 1.5 0 0 0 5 13h2"/></svg>',
    arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    download: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>',
  };

  let toastTimer;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200); }

  /* =================== sign in =================== */
  let resendTimer;
  function showSignIn() {
    $("signin").hidden = false; $("app").hidden = true; $("tabbar").hidden = true; $("topAvatar").hidden = true;
    $("phoneForm").hidden = false; $("otpForm").hidden = true; $("phone").focus({ preventScroll: true });
  }
  $("phone").addEventListener("input", e => { e.target.value = e.target.value.replace(/[^\d ]/g, ""); $("phoneError").textContent = ""; });
  $("phoneForm").addEventListener("submit", async e => {
    e.preventDefault();
    const raw = $("phone").value.replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(raw)) { $("phoneError").textContent = "Enter a 10-digit Indian mobile number, for example 98100 24567."; $("phone").focus(); return; }
    const btn = $("sendBtn"); btn.disabled = true; btn.textContent = "Sending…";
    try {
      await D.sendCode("+91" + raw);
      $("sentTo").textContent = "+91 " + raw.slice(0, 5) + " " + raw.slice(5);
      $("phoneForm").hidden = true; $("otpForm").hidden = false;
      const boxes = [...$("otp").children]; boxes.forEach(b => b.value = ""); boxes[0].focus();
      startResend();
    } catch (err) { $("phoneError").textContent = err.message; }
    finally { btn.disabled = false; btn.textContent = "Send code"; }
  });
  function startResend() {
    let s = 30; const el = $("resend"); clearInterval(resendTimer);
    const tick = () => { if (s <= 0) { clearInterval(resendTimer); el.innerHTML = '<button type="button" class="btn-text" id="resendBtn">Resend code</button>'; $("resendBtn").onclick = () => { toast("A new code is on its way."); startResend(); }; return; } el.textContent = `Resend code in ${s--}s`; };
    tick(); resendTimer = setInterval(tick, 1000);
  }
  const boxes = [...$("otp").children];
  boxes.forEach((b, i) => {
    b.addEventListener("input", () => {
      $("otpError").textContent = "";
      const digits = b.value.replace(/\D/g, "");
      if (digits.length > 1) {            // SMS autofill or fast typing drops the whole code into one box
        digits.slice(0, 6 - i).split("").forEach((d, k) => boxes[i + k].value = d);
        (boxes[Math.min(i + digits.length, 5)]).focus();
      } else { b.value = digits; if (digits && boxes[i + 1]) boxes[i + 1].focus(); }
      if (boxes.every(x => x.value)) $("otpForm").requestSubmit();
    });
    b.addEventListener("keydown", e => { if (e.key === "Backspace" && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
    b.addEventListener("paste", e => { const d = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6); if (!d) return; e.preventDefault(); boxes.forEach((x, k) => x.value = d[k] || ""); (boxes[d.length] || boxes[5]).focus(); if (d.length === 6) $("otpForm").requestSubmit(); });
  });
  $("otpForm").addEventListener("submit", async e => {
    e.preventDefault();
    const code = boxes.map(b => b.value).join("");
    const btn = $("verifyBtn"); btn.disabled = true; btn.textContent = "Checking…";
    try { await D.verifyCode(null, code); clearInterval(resendTimer); startApp(); }
    catch (err) { $("otpError").textContent = err.message; }
    finally { btn.disabled = false; btn.textContent = "Verify and sign in"; }
  });
  $("changeNumber").addEventListener("click", () => { clearInterval(resendTimer); $("otpForm").hidden = true; $("phoneForm").hidden = false; $("phone").focus(); });
  $("googleBtn").addEventListener("click", async () => { await D.signInWithGoogle(); startApp(); });

  /* =================== app shell =================== */
  const VIEWS = { overview: renderOverview, trips: renderTrips, wallet: renderWallet, visas: renderVisas, profile: renderProfile };
  let current = "overview";
  async function startApp() {
    $("signin").hidden = true; $("app").hidden = false; $("tabbar").hidden = false;
    const p = await D.getProfile();
    [$("sideAvatar"), $("topAvatar")].forEach(a => a.textContent = initials(p.name)); $("topAvatar").hidden = false;
    $("sideName").textContent = p.name; $("sidePhone").textContent = p.phone;
    const visas = await D.listVisas(); const attention = visas.filter(v => /please/i.test(v.note)).length;
    [$("visaBadge"), $("visaBadgeM")].forEach(b => { b.hidden = !attention; b.textContent = attention; });
    const start = (location.hash || "").slice(1);
    go(VIEWS[start] ? start : "overview", false);
  }
  async function go(view, push = true) {
    current = view;
    document.querySelectorAll(".tab[data-view]").forEach(t => { if (t.dataset.view === view) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
    if (push) history.replaceState(null, "", "#" + view);
    const v = $("view"); v.classList.remove("enter"); v.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
    await VIEWS[view](v);
    void v.offsetWidth; v.classList.add("enter");
    if (push) window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll(".tab[data-view]").forEach(t => t.addEventListener("click", () => go(t.dataset.view)));
  $("view").addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) { e.preventDefault(); go(g.dataset.go); } });
  $("signOutSide").addEventListener("click", async () => { await D.signOut(); history.replaceState(null, "", location.pathname); showSignIn(); toast("You're signed out."); });
  $("resetDemo").addEventListener("click", async () => { await D.resetDemo(); if (D.isSignedIn()) startApp(); toast("Demo data reset."); });

  /* =================== overview =================== */
  async function renderOverview(v) {
    const [p, trips, w, visas] = await Promise.all([D.getProfile(), D.listTrips(), D.getWallet(), D.listVisas()]);
    const up = trips.filter(t => daysTo(t.end) >= 0).sort((a, b) => a.start.localeCompare(b.start));
    const next = up[0], due = up.find(t => t.status === "payment-due");
    const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    const attention = visas.filter(x => /please/i.test(x.note));
    const soon = w.expiringSoon.reduce((s, e) => s + e.amount, 0);
    v.innerHTML = `
      <div class="view-head"><h1>${greet}, <em>${esc(p.name.split(" ")[0])}.</em></h1>
        <p class="muted">${next ? `Your next trip starts in ${daysTo(next.start)} days.` : "No trips booked yet. Your next one is a WhatsApp message away."}</p></div>
      ${next ? `<article class="next"><img src="${U(next.img, 1600)}" alt="">
        <div class="inner"><div style="display:grid;gap:8px"><span class="label">Up next · ${esc(next.id)}</span><h2>${esc(next.title)}</h2>
          <span class="meta">${fmtShort(next.start)} – ${fmt(next.end)} · ${next.travellers} travellers</span>
          <button class="btn" data-go="trips">View itinerary ${ICON.arrow}</button></div>
          <div class="count"><span class="num">${daysTo(next.start)}</span><span>days to go</span></div></div></article>` : ""}
      <div class="grid-3">
        <div class="panel pad stat"><span class="label">Wallet balance</span><span class="num">${inr(w.balance)}</span>
          ${soon ? `<span class="small" style="color:var(--warn);font-weight:600">${inr(soon)} expires in ${Math.min(...w.expiringSoon.map(e => daysTo(e.expires)))} days</span>` : `<span class="small muted">Use up to ${w.rules.maxPerBookingPercent}% on any booking</span>`}
          <a href="#wallet" class="btn-text" data-go="wallet">Open wallet</a></div>
        <div class="panel pad stat"><span class="label">Visa applications</span><span class="num">${visas.length}</span>
          ${attention.length ? `<span class="small" style="color:var(--warn);font-weight:600">${attention.length} needs your attention</span>` : `<span class="small muted">All on track</span>`}
          <a href="#visas" class="btn-text" data-go="visas">See status</a></div>
        <div class="panel pad stat">${due ? `<span class="label">Payment due · ${esc(due.title)}</span><span class="num">${inr(due.total - due.paid)}</span>
          <div class="progress" aria-label="${Math.round(due.paid / due.total * 100)}% paid"><b style="width:${due.paid / due.total * 100}%"></b></div>
          <a class="btn-text" href="${wa(`Hi, I'd like to pay the balance for booking ${due.id} (${due.title}).`)}" target="_blank" rel="noopener">Pay on WhatsApp</a>`
          : `<span class="label">Trips taken</span><span class="num">${trips.filter(t => daysTo(t.end) < 0).length}</span><a href="#trips" class="btn-text" data-go="trips">See past trips</a>`}</div>
      </div>
      <div class="panel pad row"><div style="display:grid;gap:6px;max-width:52ch"><h3>Give ₹500, get ₹500</h3><p class="muted small">Share your code <b style="color:var(--teal-ink)">${esc(w.referralCode)}</b>. When a friend books their first trip, you both get ₹500 in your wallets.</p></div>
        <a class="btn btn-primary" href="https://wa.me/?text=${encodeURIComponent(`Plan your next trip with The Wanderlust Explorers. Use my code ${w.referralCode} and we both get ₹500 off: https://thewanderlustexplorers.com`)}" target="_blank" rel="noopener">${ICON.wa} Share on WhatsApp</a></div>`;
  }

  /* =================== trips =================== */
  let tripTab = "upcoming";
  async function renderTrips(v) {
    const trips = await D.listTrips();
    const list = trips.filter(t => tripTab === "upcoming" ? daysTo(t.end) >= 0 : daysTo(t.end) < 0).sort((a, b) => tripTab === "upcoming" ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start));
    const STATUS = { confirmed: "Confirmed", "payment-due": "Balance due", completed: "Completed" };
    v.innerHTML = `
      <div class="view-head row"><div style="display:grid;gap:8px"><h1>My <em>trips</em></h1><p class="muted">Tickets, hotels and transfers for every booking.</p></div>
        <div class="seg" role="group" aria-label="Show trips"><button type="button" data-tab="upcoming" aria-pressed="${tripTab === "upcoming"}">Upcoming</button><button type="button" data-tab="past" aria-pressed="${tripTab === "past"}">Past</button></div></div>
      ${list.length ? list.map(t => `
        <article class="panel trip">
          <div class="trip-img"><img src="${U(t.img, 800)}" alt="${esc(t.title)}" loading="lazy"></div>
          <div class="trip-body">
            <div class="row"><span class="pill ${t.status}">${STATUS[t.status]}</span><span class="small muted">Booking ${esc(t.id)}</span></div>
            <div style="display:grid;gap:6px"><h2>${esc(t.title)}</h2><div class="facts"><span><b>${fmtShort(t.start)} – ${fmt(t.end)}</b></span><span>${esc(t.place)}</span><span>${t.travellers} travellers</span></div></div>
            <ul class="items">${t.items.map(i => `<li>${ICON[i.type] || ICON.info}<span>${esc(i.label)}</span><span class="when">${esc(i.when)}</span></li>`).join("")}</ul>
            ${t.status === "payment-due" ? `<div style="display:grid;gap:8px"><div class="row small"><span>Paid ${inr(t.paid)} of ${inr(t.total)}</span><b>${inr(t.total - t.paid)} due</b></div><div class="progress"><b style="width:${t.paid / t.total * 100}%"></b></div></div>` : ""}
            <div class="row" style="justify-content:flex-start">
              <button type="button" class="btn btn-quiet" data-demo="Vouchers and e-tickets will download here once bookings are connected.">${ICON.download} ${t.status === "completed" ? "Invoice" : "Vouchers & tickets"}</button>
              <a class="btn btn-quiet" href="${wa(`Hi, I have a question about booking ${t.id} (${t.title}).`)}" target="_blank" rel="noopener">${ICON.wa} Get help</a>
            </div>
          </div>
        </article>`).join("") : `<div class="panel empty"><h3>${tripTab === "upcoming" ? "No upcoming trips" : "No past trips yet"}</h3><p class="muted">Tell us where you'd like to wake up and we'll send a plan within a working day.</p><a class="btn btn-primary" href="${wa("Hi, I'd like to plan a trip.")}" target="_blank" rel="noopener">Plan on WhatsApp</a></div>`}`;
    v.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => { tripTab = b.dataset.tab; go("trips", false); }));
  }

  /* =================== wallet =================== */
  async function renderWallet(v) {
    const w = await D.getWallet();
    const soonTotal = w.expiringSoon.reduce((s, e) => s + e.amount, 0);
    v.innerHTML = `
      <div class="view-head"><h1>Your <em>wallet</em></h1><p class="muted">Credits you can spend on any journey, flight, hotel or visa with us.</p></div>
      <div class="wallet-top">
        <div class="balance"><span class="label">Available credits</span><span class="num"><small>₹</small>${w.balance.toLocaleString("en-IN")}</span>
          <p>Use up to ${w.rules.maxPerBookingPercent}% of any booking. Mention your wallet when you book and we'll apply it to your invoice.</p></div>
        <div class="panel pad refer"><span class="label">Refer a friend</span><h3>Give ₹500, get ₹500</h3>
          <div class="code"><span class="num">${esc(w.referralCode)}</span><button type="button" class="btn btn-quiet" id="copyCode">${ICON.copy} Copy</button></div>
          <p class="small muted">Credited to both wallets when your friend's first trip is confirmed.</p></div>
      </div>
      ${soonTotal ? `<div class="note warn">${ICON.alert}<span><b>${inr(soonTotal)} expires on ${fmt(w.expiringSoon[0].expires)}.</b> Use it on your next booking before then.</span></div>` : ""}
      <div class="panel pad"><div class="row" style="margin-bottom:14px"><h3>History</h3><span class="small muted">${w.entries.length} entries</span></div>
        <table class="ledger"><thead><tr><th>Date</th><th>Details</th><th style="text-align:right">Amount</th></tr></thead><tbody>
        ${w.entries.map(e => { const d = e.expires ? daysTo(e.expires) : null; return `<tr><td>${fmt(e.date)}</td><td>${esc(e.source)}${e.kind === "credit" && e.expires ? `<span class="exp ${d <= 30 ? "soon" : ""}">${d < 0 ? "Expired" : `Expires ${fmt(e.expires)}`}</span>` : `<span class="exp">${fmt(e.date)}</span>`}</td><td class="amt ${e.kind === "credit" ? "plus" : "minus"}">${e.kind === "credit" ? "+" : "−"}${inr(e.amount)}</td></tr>`; }).join("")}
        </tbody></table></div>
      <div class="panel pad"><h3 style="margin-bottom:6px">Ways to earn</h3><ul class="earn">
        <li><span>Cashback on every holiday package</span><b>2% back</b></li>
        <li><span>A friend books with your code</span><b>₹500 each</b></li>
        <li><span>Signing up</span><b>₹250</b></li>
        <li><span>Refunds for cancellations, if you choose wallet credit</span><b>Instant</b></li></ul></div>
      <p class="rules">Credits can only be used on bookings with The Wanderlust Explorers. They cannot be withdrawn as cash or transferred, and each credit expires ${w.rules.expiryMonths} months after it is added. Cashback rates shown are examples until confirmed.</p>`;
    $("copyCode").addEventListener("click", async () => { try { await navigator.clipboard.writeText(w.referralCode); toast("Code copied."); } catch (e) { toast("Your code is " + w.referralCode); } });
  }

  /* =================== visas =================== */
  async function renderVisas(v) {
    const visas = await D.listVisas();
    v.innerHTML = `
      <div class="view-head"><h1>Visa <em>applications</em></h1><p class="muted">Our visa desk updates these as your application moves forward.</p></div>
      ${visas.length ? visas.map(x => { const need = /please/i.test(x.note); return `
        <article class="panel pad visa">
          <div class="row"><div style="display:grid;gap:4px"><span class="label">${esc(x.id)} · Updated ${fmt(x.updated)}</span><h2>${esc(x.country)}</h2><span class="muted">${esc(x.type)} · ${esc(x.applicant)}</span></div>
            <span class="pill ${x.step >= x.steps.length ? "confirmed" : need ? "payment-due" : "completed"}">${x.step >= x.steps.length ? "Approved" : need ? "Action needed" : "In progress"}</span></div>
          <ol class="steps">${x.steps.map((s, i) => `<li class="${i < x.step - 1 ? "done" : i === x.step - 1 ? "now" : ""}">${esc(s)}</li>`).join("")}</ol>
          <div class="note ${need ? "warn" : "info"}">${need ? ICON.alert : ICON.info}<span>${esc(x.note)}</span></div>
          ${need ? `<a class="btn btn-primary" style="justify-self:start" href="${wa(`Hi, sending documents for visa application ${x.id} (${x.applicant}).`)}" target="_blank" rel="noopener">${ICON.wa} Send documents on WhatsApp</a>` : ""}
        </article>`; }).join("") : `<div class="panel empty"><h3>No visa applications</h3><p class="muted">Dubai, Singapore, Schengen, UK, US: our visa desk checks every document before the embassy sees it.</p><a class="btn btn-primary" href="${wa("Hi, I need help with a visa.")}" target="_blank" rel="noopener">Start a visa on WhatsApp</a></div>`}`;
  }

  /* =================== profile & travellers =================== */
  async function renderProfile(v) {
    const [p, people] = await Promise.all([D.getProfile(), D.listTravellers()]);
    v.innerHTML = `
      <div class="view-head"><h1>Profile &amp; <em>travellers</em></h1><p class="muted">Saved details fill in your bookings so you never type a passport number twice.</p></div>
      <form class="panel pad" id="profileForm" novalidate style="display:grid;gap:20px">
        <h3>Your details</h3>
        <div class="form">
          <div class="field full"><label for="pName">Full name, as on your passport</label><input class="input" id="pName" value="${esc(p.name)}" autocomplete="name" required></div>
          <div class="field"><label for="pPhone">Mobile number</label><input class="input" id="pPhone" value="${esc(p.phone)}" disabled title="Your sign-in number can't be changed here"></div>
          <div class="field"><label for="pEmail">Email</label><input class="input" id="pEmail" type="email" value="${esc(p.email)}" autocomplete="email"></div>
          <div class="field"><label for="pDob">Date of birth</label><input class="input" id="pDob" type="date" value="${esc(p.dob)}"></div>
          <div class="field"><label for="pCity">Home city</label><input class="input" id="pCity" value="${esc(p.city)}" autocomplete="address-level2"></div>
          <label class="switch full"><span><b style="font-weight:600">Trip updates on WhatsApp</b><br><span class="small muted">Booking confirmations, gate changes and visa updates.</span></span><input type="checkbox" id="pWa" ${p.whatsappUpdates ? "checked" : ""}></label>
        </div>
        <p class="error" id="profileError" role="alert"></p>
        <button class="btn btn-primary" type="submit" style="justify-self:start">Save details</button>
      </form>
      <section class="panel pad" style="display:grid;gap:12px">
        <div class="row"><h3>Saved travellers</h3><button type="button" class="btn btn-quiet" id="addPerson">+ Add traveller</button></div>
        <div id="sheetHost"></div>
        <ul class="people">${people.length ? people.map(t => `
          <li><span class="avatar">${esc(initials(t.name))}</span><div><b>${esc(t.name)}</b><span>${esc(t.relation || "Traveller")}${t.dob ? " · Born " + fmt(t.dob) : ""}${t.passport ? " · Passport ending " + esc(t.passport.slice(-4)) : " · No passport saved"}</span></div>
            <div class="acts"><button type="button" class="btn-text" data-edit="${t.id}">Edit</button><button type="button" class="btn-text" style="color:var(--ink-3)" data-remove="${t.id}">Remove</button></div></li>`).join("") : `<li style="display:block;color:var(--ink-3)">No saved travellers yet. Add family and friends you travel with.</li>`}</ul>
      </section>
      <div class="row"><button type="button" class="btn btn-quiet" id="signOutMain">Sign out</button><span class="small muted">Need to delete your account? Message us on WhatsApp.</span></div>`;

    $("profileForm").addEventListener("submit", async e => {
      e.preventDefault();
      const name = $("pName").value.trim(), email = $("pEmail").value.trim();
      if (name.length < 3) { $("profileError").textContent = "Add your full name as it appears on your passport."; $("pName").focus(); return; }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { $("profileError").textContent = "That email address looks incomplete. Check it and try again."; $("pEmail").focus(); return; }
      $("profileError").textContent = "";
      await D.updateProfile({ name, email, dob: $("pDob").value, city: $("pCity").value.trim(), whatsappUpdates: $("pWa").checked });
      $("sideName").textContent = name; [$("sideAvatar"), $("topAvatar")].forEach(a => a.textContent = initials(name));
      toast("Details saved.");
    });
    $("signOutMain").addEventListener("click", () => $("signOutSide").click());
    const openSheet = t => {
      $("sheetHost").innerHTML = `<form class="sheet" id="personForm" novalidate>
        <h3>${t ? "Edit traveller" : "Add a traveller"}</h3>
        <div class="form">
          <div class="field full"><label for="tName">Full name, as on passport</label><input class="input" id="tName" value="${esc(t?.name)}"></div>
          <div class="field"><label for="tRel">Relation</label><input class="input" id="tRel" value="${esc(t?.relation)}" placeholder="Spouse, child, parent…"></div>
          <div class="field"><label for="tDob">Date of birth</label><input class="input" id="tDob" type="date" value="${esc(t?.dob)}"></div>
          <div class="field"><label for="tPass">Passport number</label><input class="input" id="tPass" value="${esc(t?.passport)}" autocapitalize="characters" placeholder="Optional"></div>
          <div class="field"><label for="tExp">Passport expiry</label><input class="input" id="tExp" type="date" value="${esc(t?.passportExpiry)}"></div>
        </div>
        <p class="error" id="personError" role="alert"></p>
        <div class="row" style="justify-content:flex-start"><button class="btn btn-primary" type="submit">Save traveller</button><button class="btn btn-quiet" type="button" id="cancelPerson">Cancel</button></div>
      </form>`;
      $("tName").focus();
      $("cancelPerson").onclick = () => $("sheetHost").innerHTML = "";
      $("personForm").addEventListener("submit", async e => {
        e.preventDefault();
        const exp = $("tExp").value;
        if (exp && daysTo(exp) < 180) { $("personError").textContent = "This passport expires within 6 months. Most countries won't issue a visa. You can still save it."; if (!$("personForm").dataset.warned) { $("personForm").dataset.warned = 1; return; } }
        try { await D.saveTraveller({ id: t?.id, name: $("tName").value.trim(), relation: $("tRel").value.trim(), dob: $("tDob").value, passport: $("tPass").value.trim().toUpperCase(), passportExpiry: exp }); toast(t ? "Traveller updated." : "Traveller added."); go("profile", false); }
        catch (err) { $("personError").textContent = err.message; }
      });
    };
    $("addPerson").addEventListener("click", () => openSheet(null));
    v.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openSheet(people.find(x => x.id === b.dataset.edit))));
    v.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", async () => {
      if (b.dataset.confirm) { await D.removeTraveller(b.dataset.remove); toast("Traveller removed."); go("profile", false); return; }
      b.dataset.confirm = 1; b.textContent = "Tap again to remove"; b.style.color = "var(--bad)";
      setTimeout(() => { if (b.isConnected) { delete b.dataset.confirm; b.textContent = "Remove"; b.style.color = "var(--ink-3)"; } }, 3500);
    }));
  }

  document.addEventListener("click", e => { const d = e.target.closest("[data-demo]"); if (d) toast(d.dataset.demo); });

  D.isSignedIn() ? startApp() : showSignIn();
})();
