/* Admin panel. Edits a working copy of the site content and saves it through SiteData.
   Today that means this browser (localStorage + IndexedDB) and a downloadable data/site.js.
   With Firebase: SiteData writes Firestore/Storage and the passcode gate becomes Firebase Auth. */
(() => {
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const clone = o => JSON.parse(JSON.stringify(o));
  const slug = s => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  const TAGS = [["india", "India"], ["intl", "Abroad"], ["mountains", "Mountains"], ["coast", "Coast"], ["heritage", "Heritage"], ["romantic", "Romantic"], ["visa-easy", "Easy visa"]];
  const I = {
    up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m4 10 4-4 4 4"/></svg>',
    down: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m4 6 4 4 4-4"/></svg>',
    edit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.5 3 13 5.5 6 12.5H3.5V10Z"/></svg>',
    trash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5"/></svg>',
    x: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m4 4 8 8M12 4l-8 8"/></svg>',
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3v10M3 8h10"/></svg>',
    play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5v9l7.5-4.5Z"/></svg>',
    stop: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="4" width="8" height="8" rx="1"/></svg>',
    info: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7.5"/><path d="M10 9v5M10 6.2v.3"/></svg>',
    alert: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 3 18 16.5H2Z"/><path d="M10 8v4M10 14.2v.3"/></svg>',
    down2: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>',
  };

  let site = clone(SiteData.get());
  window.SITE = site;                      // so music previews use the working copy
  let dirty = false, tab = "packages";

  let tT;
  const toast = m => { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("show"), 3200); };
  function markDirty() { dirty = true; $("status").classList.add("dirty"); $("statusText").textContent = "Unsaved changes"; counts(); }
  function save() {
    try { SiteData.saveDraft(site); dirty = false; $("status").classList.remove("dirty"); $("statusText").textContent = "Saved in this browser"; toast("Saved. Reload the website to see your changes."); }
    catch (e) { toast(e.message); }
  }
  addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); } if (e.key === "Escape") closeDrawer(); });

  /* ---------- gate ---------- */
  const unlocked = () => { try { return sessionStorage.getItem("wle-admin") === "1"; } catch (e) { return false; } };
  $("gateForm").addEventListener("submit", e => {
    e.preventDefault();
    if ($("pass").value.trim().toLowerCase() !== "wanderlust") { $("gateErr").textContent = "That passcode isn't right. Check with the site owner."; $("pass").select(); return; }
    try { sessionStorage.setItem("wle-admin", "1"); } catch (err) {}
    open();
  });
  function open() { $("gate").hidden = true; $("admin").hidden = false; if (SiteData.hasDraft()) $("statusText").textContent = "Saved in this browser"; counts(); go(location.hash.slice(1) || "packages"); }

  /* ---------- tabs ---------- */
  const VIEWS = { packages: vPackages, slides: vSlides, sounds: vSounds, partners: vPartners, search: vSearch, enquiries: vEnquiries, publish: vPublish };
  function go(t) { if (!VIEWS[t]) t = "packages"; tab = t; history.replaceState(null, "", "#" + t); document.querySelectorAll(".tab").forEach(b => b.dataset.tab === t ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")); VIEWS[t]($("main")); }
  document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => go(b.dataset.tab)));
  $("saveBtn").addEventListener("click", save);
  function counts() {
    $("cPackages").textContent = site.packages.length; $("cSlides").textContent = site.slides.length; $("cPartners").textContent = site.partners.length;
    const withFile = Object.values(site.sounds).filter(s => s.file).length; $("cSounds").textContent = `${withFile}/${Object.keys(site.sounds).length}`;
    const n = SiteData.listEnquiries().filter(e => e.status === "new").length; const c = $("cEnquiries"); c.textContent = n || SiteData.listEnquiries().length; c.classList.toggle("new", n > 0);
  }
  const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
  function confirmBtn(btn, run) { if (btn.dataset.armed) { run(); return; } btn.dataset.armed = 1; btn.classList.add("confirm"); const old = btn.innerHTML; btn.textContent = "Tap again to confirm"; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.classList.remove("confirm"); btn.innerHTML = old; } }, 3500); }

  /* ---------- images ---------- */
  function compress(file, max = 1600) {
    return new Promise((res, rej) => {
      if (!/^image\//.test(file.type)) return rej(new Error("Choose an image file (JPG, PNG or WebP)."));
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { const k = Math.min(1, max / img.width); const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", .82)); };
      img.onerror = () => rej(new Error("That image couldn't be read. Try a JPG or PNG."));
      img.src = url;
    });
  }
  const imgField = (id, value, label = "Photo") => `
    <div class="field full"><label for="${id}">${label}</label>
      <div class="preview"><img id="${id}Prev" src="${esc(SiteData.img(value, 400))}" alt="">
        <div style="display:grid;gap:8px"><input class="input" id="${id}" value="${esc(value && value.startsWith("data:") ? "" : value)}" placeholder="Unsplash id (photo-…) or image link">
          <label class="btn btn-quiet" style="justify-self:start;cursor:pointer">Upload photo<input type="file" accept="image/*" id="${id}File" hidden></label>
          <span class="hint">${value && value.startsWith("data:") ? "Using an uploaded photo. " : ""}Uploads are resized to 1600px. Links keep the site lighter.</span></div></div></div>`;
  function bindImg(id, set) {
    $(id).addEventListener("input", e => { const v = e.target.value.trim(); set(v); $(id + "Prev").src = SiteData.img(v, 400); });
    $(id + "File").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; try { const d = await compress(f); set(d); $(id + "Prev").src = d; $(id).value = ""; toast("Photo uploaded."); } catch (err) { toast(err.message); } });
  }

  /* ---------- drawer ---------- */
  let drawerReturn;
  function openDrawer(html, onReady) { drawerReturn = document.activeElement; $("drawerPanel").innerHTML = html; $("drawer").classList.add("open"); document.body.style.overflow = "hidden"; onReady && onReady(); setTimeout(() => ($("drawerPanel").querySelector("input,select,textarea") || {}).focus?.(), 60); }
  function closeDrawer() { if (!$("drawer").classList.contains("open")) return; $("drawer").classList.remove("open"); document.body.style.overflow = ""; drawerReturn?.focus?.(); }
  $("drawer").addEventListener("click", e => { if (e.target === $("drawer")) closeDrawer(); });

  /* =================== packages =================== */
  function vPackages(m) {
    m.innerHTML = `
      <div class="head"><div style="display:grid;gap:6px"><h1>Packages</h1><p class="muted">Edit prices right in the table. Open a package to change its photo, route, music and local notes. Hidden packages stay saved but don't show on the site.</p></div>
        <button class="btn btn-primary" id="addPkg">${I.plus} Add package</button></div>
      <div class="card table-wrap"><table>
        <thead><tr><th></th><th>Package</th><th class="hide-sm">Nights</th><th>Price from</th><th class="hide-sm">Music</th><th>On site</th><th></th></tr></thead>
        <tbody>${site.packages.map((p, i) => `
          <tr class="${p.visible === false ? "hidden-row" : ""}">
            <td><img class="thumb" src="${esc(SiteData.img(p.img, 200))}" alt=""></td>
            <td class="cell-main"><b>${esc(p.name)}</b><span>${esc(p.region || p.sub)}</span></td>
            <td class="hide-sm num">${p.nights}</td>
            <td><input class="input price" type="number" min="0" step="500" value="${p.price}" data-price="${i}" aria-label="Price for ${esc(p.name)}"></td>
            <td class="hide-sm">${site.sounds[p.sound] ? `<span class="pill ${site.sounds[p.sound].file ? "ok" : "mute"}">${esc(site.sounds[p.sound].place)}</span>` : `<span class="pill mute">None</span>`}</td>
            <td><input type="checkbox" class="switch" data-vis="${i}" ${p.visible !== false ? "checked" : ""} aria-label="Show ${esc(p.name)} on the site"></td>
            <td><div class="acts"><button class="icon-btn" data-up="${i}" ${i ? "" : "disabled"} aria-label="Move up">${I.up}</button><button class="icon-btn" data-down="${i}" ${i < site.packages.length - 1 ? "" : "disabled"} aria-label="Move down">${I.down}</button><button class="icon-btn" data-edit="${i}" aria-label="Edit ${esc(p.name)}">${I.edit}</button></div></td>
          </tr>`).join("")}</tbody></table></div>`;
    m.querySelectorAll("[data-price]").forEach(inp => inp.addEventListener("input", () => { const v = Math.max(0, Math.round(+inp.value || 0)); site.packages[+inp.dataset.price].price = v; markDirty(); }));
    m.querySelectorAll("[data-vis]").forEach(c => c.addEventListener("change", () => { site.packages[+c.dataset.vis].visible = c.checked; markDirty(); vPackages(m); }));
    m.querySelectorAll("[data-up]").forEach(b => b.addEventListener("click", () => { move(site.packages, +b.dataset.up, -1); markDirty(); vPackages(m); }));
    m.querySelectorAll("[data-down]").forEach(b => b.addEventListener("click", () => { move(site.packages, +b.dataset.down, 1); markDirty(); vPackages(m); }));
    m.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editPackage(+b.dataset.edit)));
    $("addPkg").addEventListener("click", () => editPackage(-1));
  }
  function editPackage(i) {
    const isNew = i < 0;
    const p = isNew ? { id: "", name: "", region: "", sub: "", route: "", nights: 4, price: 0, img: "", tags: ["india"], badge: "", sound: "", say: "", means: "", taste: "", take: "", visible: true } : clone(site.packages[i]);
    const soundOpts = `<option value="">No music</option>` + Object.entries(site.sounds).map(([k, s]) => `<option value="${k}" ${p.sound === k ? "selected" : ""}>${esc(s.place)} · ${esc(s.title)}</option>`).join("");
    openDrawer(`
      <div class="drawer-head"><h2 id="drawerTitle">${isNew ? "New package" : "Edit " + esc(p.name)}</h2><button class="icon-btn" id="dClose" aria-label="Close">${I.x}</button></div>
      <form class="drawer-body" id="pkgForm" novalidate>
        <div class="fields">
          <div class="field"><label for="fName">Name</label><input class="input" id="fName" value="${esc(p.name)}" placeholder="Ladakh"></div>
          <div class="field"><label for="fRegion">Destination</label><input class="input" id="fRegion" value="${esc(p.region)}" placeholder="Ladakh, India"></div>
          <div class="field full"><label for="fSub">Highlights line</label><input class="input" id="fSub" value="${esc(p.sub)}" placeholder="Leh, Nubra and Pangong"></div>
          <div class="field full"><label for="fRoute">Route</label><input class="input" id="fRoute" value="${esc(p.route)}" placeholder="2N Leh · 2N Nubra · 2N Pangong"><span class="hint">Shown on the card under the highlights.</span></div>
          <div class="field"><label for="fNights">Nights</label><input class="input" id="fNights" type="number" min="1" value="${p.nights}"></div>
          <div class="field"><label for="fPrice">Price from (₹ per person)</label><input class="input" id="fPrice" type="number" min="0" step="500" value="${p.price}"></div>
          <div class="field"><label for="fBadge">Badge</label><input class="input" id="fBadge" value="${esc(p.badge)}" placeholder="Most booked, New…"><span class="hint">Optional. Shown on the photo.</span></div>
          <div class="field"><label for="fSound">Music</label><select class="select" id="fSound">${soundOpts}</select></div>
          <div class="field full"><label>Filters it appears under</label><div class="checks">${TAGS.map(([k, l]) => `<label><input type="checkbox" value="${k}" ${p.tags.includes(k) ? "checked" : ""}>${l}</label>`).join("")}</div></div>
          ${imgField("fImg", p.img)}
          <h3 class="full section-title">Local notes</h3>
          <div class="field"><label for="fSay">Say</label><input class="input" id="fSay" value="${esc(p.say)}" placeholder="Julley"></div>
          <div class="field"><label for="fMeans">Meaning</label><input class="input" id="fMeans" value="${esc(p.means)}" placeholder="hello, thank you and goodbye"></div>
          <div class="field full"><label for="fTaste">Taste</label><input class="input" id="fTaste" value="${esc(p.taste)}"></div>
          <div class="field full"><label for="fTake">Bring home</label><input class="input" id="fTake" value="${esc(p.take)}"></div>
        </div>
        <p class="err" id="pkgErr" role="alert"></p>
      </form>
      <div class="drawer-foot">${isNew ? "<span></span>" : `<button class="btn btn-danger" id="dDelete" type="button">${I.trash} Delete package</button>`}<div style="display:flex;gap:8px"><button class="btn btn-quiet" id="dCancel" type="button">Cancel</button><button class="btn btn-primary" id="dApply" type="button">${isNew ? "Add package" : "Done"}</button></div></div>`, () => {
      bindImg("fImg", v => p.img = v);
      $("dClose").onclick = $("dCancel").onclick = closeDrawer;
      if (!isNew) $("dDelete").onclick = e => confirmBtn(e.currentTarget, () => { site.packages.splice(i, 1); markDirty(); closeDrawer(); vPackages($("main")); toast("Package deleted. Save to keep this change."); });
      $("dApply").onclick = () => {
        const name = $("fName").value.trim(), price = Math.round(+$("fPrice").value), nights = Math.round(+$("fNights").value);
        if (!name) return err("Give the package a name.", "fName");
        if (!(nights >= 1)) return err("Nights must be 1 or more.", "fNights");
        if (!(price > 0)) return err("Add a starting price in rupees.", "fPrice");
        if (!p.img) return err("Add a photo: paste an Unsplash id or link, or upload one.", "fImg");
        Object.assign(p, { name, price, nights, region: $("fRegion").value.trim(), sub: $("fSub").value.trim(), route: $("fRoute").value.trim(), badge: $("fBadge").value.trim(), sound: $("fSound").value, say: $("fSay").value.trim(), means: $("fMeans").value.trim(), taste: $("fTaste").value.trim(), take: $("fTake").value.trim(), tags: [...document.querySelectorAll("#pkgForm .checks input:checked")].map(c => c.value) });
        if (!p.tags.length) return err("Pick at least one filter, for example India or Abroad.");
        if (isNew) { let id = slug(name); while (site.packages.some(x => x.id === id)) id += "-2"; p.id = id; site.packages.push(p); } else site.packages[i] = p;
        markDirty(); closeDrawer(); vPackages($("main")); toast(isNew ? "Package added. Save to publish it in this browser." : "Package updated.");
      };
      function err(msg, focus) { $("pkgErr").textContent = msg; if (focus) $(focus).focus(); }
    });
  }

  /* =================== hero slides =================== */
  function vSlides(m) {
    const soundOpts = v => `<option value="">No music</option>` + Object.entries(site.sounds).map(([k, s]) => `<option value="${k}" ${v === k ? "selected" : ""}>${esc(s.place)}</option>`).join("");
    m.innerHTML = `
      <div class="head"><div style="display:grid;gap:6px"><h1>Hero slides</h1><p class="muted">The full-screen photos at the top of the homepage. Use wide, calm landscape photos at least 2000px wide. Up to 6 slides.</p></div>
        <button class="btn btn-primary" id="addSlide" ${site.slides.length >= 6 ? "disabled" : ""}>${I.plus} Add slide</button></div>
      ${site.slides.map((s, i) => `
        <div class="card pad" style="display:grid;gap:14px">
          <div class="head"><h3>Slide ${i + 1}</h3><div class="acts"><button class="icon-btn" data-up="${i}" ${i ? "" : "disabled"} aria-label="Move up">${I.up}</button><button class="icon-btn" data-down="${i}" ${i < site.slides.length - 1 ? "" : "disabled"} aria-label="Move down">${I.down}</button><button class="btn btn-danger" data-del="${i}" ${site.slides.length < 2 ? "disabled" : ""}>${I.trash} Remove</button></div></div>
          <div class="fields">
            ${imgField("sImg" + i, s.img)}
            <div class="field"><label for="sName${i}">Place name</label><input class="input" id="sName${i}" value="${esc(s.name)}" data-k="name" data-i="${i}"></div>
            <div class="field"><label for="sCoord${i}">Coordinates</label><input class="input" id="sCoord${i}" value="${esc(s.coord)}" data-k="coord" data-i="${i}"></div>
            <div class="field"><label for="sAlt${i}">Photo description</label><input class="input" id="sAlt${i}" value="${esc(s.alt)}" data-k="alt" data-i="${i}"><span class="hint">For screen readers and search engines.</span></div>
            <div class="field"><label for="sSound${i}">Music</label><select class="select" id="sSound${i}" data-k="sound" data-i="${i}">${soundOpts(s.sound)}</select></div>
          </div></div>`).join("")}`;
    site.slides.forEach((s, i) => bindImg("sImg" + i, v => { s.img = v; markDirty(); }));
    m.querySelectorAll("[data-k]").forEach(el => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => { site.slides[+el.dataset.i][el.dataset.k] = el.value; markDirty(); }));
    m.querySelectorAll("[data-up]").forEach(b => b.addEventListener("click", () => { move(site.slides, +b.dataset.up, -1); markDirty(); vSlides(m); }));
    m.querySelectorAll("[data-down]").forEach(b => b.addEventListener("click", () => { move(site.slides, +b.dataset.down, 1); markDirty(); vSlides(m); }));
    m.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => confirmBtn(b, () => { site.slides.splice(+b.dataset.del, 1); markDirty(); vSlides(m); })));
    $("addSlide").addEventListener("click", () => { site.slides.push({ name: "New place", coord: "", img: "", alt: "", sound: "" }); markDirty(); vSlides(m); });
  }

  /* =================== music =================== */
  let previewing = null;
  Soundscape.onChange(k => { previewing = k; document.querySelectorAll("[data-play]").forEach(b => { const on = b.dataset.play === k; b.innerHTML = (on ? I.stop : I.play) + (on ? " Stop" : " Play"); }); });
  function vSounds(m) {
    const used = k => site.packages.filter(p => p.sound === k).map(p => p.name).concat(site.slides.filter(s => s.sound === k).map(s => "Hero: " + s.name));
    m.innerHTML = `
      <div class="head"><div style="display:grid;gap:6px"><h1>Music</h1><p class="muted">Each place can play a recording. Without one, the site plays its built-in generated sound for that place.</p></div></div>
      <div class="note warn">${I.alert}<span><b>Only upload music you have the rights to.</b> Commercial songs and studio recordings of folk tunes need a licence from their owner. Royalty-free tracks, licensed tracks, or recordings by local musicians you've paid are safe.</span></div>
      <div class="sound-grid">${Object.entries(site.sounds).map(([k, s]) => {
        const kind = !s.file ? "Built-in sound" : s.file.startsWith("idb:") ? "Uploaded file (this browser)" : "Linked file";
        return `<div class="card pad sound">
          <div class="row"><div><span class="label">${esc(s.place)}</span><h3 style="margin-top:2px">${esc(s.title)}</h3></div><span class="pill ${s.file ? "ok" : "mute"}">${kind}</span></div>
          <div class="field"><label for="t_${k}">Track name</label><input class="input" id="t_${k}" value="${esc(s.title)}" data-title="${k}"></div>
          <div class="field"><label for="f_${k}">Audio link</label><input class="input" id="f_${k}" value="${esc(s.file && !s.file.startsWith("idb:") ? s.file : "")}" placeholder="assets/audio/${k}.mp3" data-file="${k}"><span class="hint">A file in the site's assets/audio folder, or a full link.</span></div>
          <div class="row"><div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn btn-quiet" style="cursor:pointer">Upload audio<input type="file" accept="audio/*" data-upload="${k}" hidden></label><button class="btn btn-quiet" data-play="${k}">${previewing === k ? I.stop + " Stop" : I.play + " Play"}</button>${s.file ? `<button class="btn btn-danger" data-clear="${k}">Remove file</button>` : ""}</div></div>
          <span class="small muted">Used by: ${used(k).map(esc).join(", ") || "nothing yet"}</span>
        </div>`; }).join("")}</div>`;
    m.querySelectorAll("[data-title]").forEach(el => el.addEventListener("input", () => { site.sounds[el.dataset.title].title = el.value; markDirty(); }));
    m.querySelectorAll("[data-file]").forEach(el => el.addEventListener("change", () => { site.sounds[el.dataset.file].file = el.value.trim(); markDirty(); vSounds(m); }));
    m.querySelectorAll("[data-upload]").forEach(el => el.addEventListener("change", async () => {
      const f = el.files[0], k = el.dataset.upload; if (!f) return;
      if (!/^audio\//.test(f.type)) return toast("Choose an audio file (MP3 or M4A).");
      if (f.size > 15 * 1024 * 1024) return toast("That file is over 15 MB. Export a shorter loop or a lower bitrate MP3.");
      site.sounds[k].file = await SiteData.putAudio(k, f); markDirty(); vSounds(m); toast(`Uploaded for ${site.sounds[k].place}. Save to use it on the site.`);
    }));
    m.querySelectorAll("[data-clear]").forEach(b => b.addEventListener("click", async () => { const k = b.dataset.clear; if (site.sounds[k].file.startsWith("idb:")) await SiteData.deleteAudio(k); site.sounds[k].file = ""; if (previewing === k) Soundscape.stop(); markDirty(); vSounds(m); }));
    m.querySelectorAll("[data-play]").forEach(b => b.addEventListener("click", () => { const k = b.dataset.play; if (Soundscape.key === k) Soundscape.stop(); else Soundscape.play(k); }));
  }

  /* =================== partners =================== */
  function vPartners(m) {
    m.innerHTML = `
      <div class="head"><div style="display:grid;gap:6px"><h1>Partners</h1><p class="muted">Two rails on the homepage: airlines (shown with their logo) and hotels (set in elegant type). Only list partners you actually book or work with.</p></div>
        <button class="btn btn-primary" id="addPartner">${I.plus} Add partner</button></div>
      <div class="card table-wrap"><table><thead><tr><th>Logo</th><th>Name</th><th>Type</th><th>Logo link</th><th></th></tr></thead><tbody>
        ${site.partners.map((p, i) => `<tr>
          <td style="width:110px">${p.logo ? `<img src="${esc(p.logo)}" alt="" style="max-height:30px;max-width:90px;object-fit:contain">` : `<span class="small muted">Name only</span>`}</td>
          <td><input class="input" value="${esc(p.name)}" data-pn="${i}" aria-label="Partner name"></td>
          <td><select class="select" data-ptype="${i}" aria-label="Partner type"><option value="airline" ${(p.type || (p.logo ? "airline" : "hotel")) === "airline" ? "selected" : ""}>Airline</option><option value="hotel" ${(p.type || (p.logo ? "airline" : "hotel")) === "hotel" ? "selected" : ""}>Hotel</option></select></td>
          <td><input class="input" value="${esc(p.logo)}" data-pl="${i}" placeholder="${(p.type || (p.logo ? "airline" : "hotel")) === "hotel" ? "Not needed for hotels" : "https://…/logo.svg"}" aria-label="Logo link"></td>
          <td><div class="acts"><button class="icon-btn" data-up="${i}" ${i ? "" : "disabled"} aria-label="Move up">${I.up}</button><button class="icon-btn" data-down="${i}" ${i < site.partners.length - 1 ? "" : "disabled"} aria-label="Move down">${I.down}</button><button class="icon-btn" data-del="${i}" aria-label="Remove">${I.trash}</button></div></td></tr>`).join("")}
      </tbody></table></div>`;
    m.querySelectorAll("[data-pn]").forEach(el => el.addEventListener("input", () => { site.partners[+el.dataset.pn].name = el.value; markDirty(); }));
    m.querySelectorAll("[data-ptype]").forEach(el => el.addEventListener("change", () => { site.partners[+el.dataset.ptype].type = el.value; markDirty(); vPartners(m); }));
    m.querySelectorAll("[data-pl]").forEach(el => el.addEventListener("change", () => { site.partners[+el.dataset.pl].logo = el.value.trim(); markDirty(); vPartners(m); }));
    m.querySelectorAll("[data-up]").forEach(b => b.addEventListener("click", () => { move(site.partners, +b.dataset.up, -1); markDirty(); vPartners(m); }));
    m.querySelectorAll("[data-down]").forEach(b => b.addEventListener("click", () => { move(site.partners, +b.dataset.down, 1); markDirty(); vPartners(m); }));
    m.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { site.partners.splice(+b.dataset.del, 1); markDirty(); vPartners(m); }));
    $("addPartner").addEventListener("click", () => { site.partners.push({ name: "New partner", logo: "", type: "hotel" }); markDirty(); vPartners(m); });
  }

  /* =================== popular searches =================== */
  function vSearch(m) {
    m.innerHTML = `
      <div class="head"><div style="display:grid;gap:6px"><h1>Popular searches</h1><p class="muted">Quick searches shown when someone opens search. Write them the way travellers think: who's going, the mood, or a budget like "under ₹20,000".</p></div></div>
      <div class="card pad" style="display:grid;gap:14px">
        <div class="chips">${site.popular.map((q, i) => `<span class="chip">${esc(q)}<button data-del="${i}" aria-label="Remove ${esc(q)}">${I.x}</button></span>`).join("") || `<span class="muted">No popular searches yet.</span>`}</div>
        <form id="addQ" style="display:flex;gap:8px;flex-wrap:wrap" novalidate><input class="input" id="qNew" placeholder="e.g. Kerala with parents" style="flex:1;min-width:200px"><button class="btn btn-primary" type="submit">${I.plus} Add</button></form>
      </div>`;
    m.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { site.popular.splice(+b.dataset.del, 1); markDirty(); vSearch(m); }));
    $("addQ").addEventListener("submit", e => { e.preventDefault(); const v = $("qNew").value.trim(); if (!v) return; site.popular.push(v); markDirty(); vSearch(m); $("qNew").focus(); });
  }

  /* =================== enquiries =================== */
  let enqFilter = "all";
  function vEnquiries(m) {
    const all = SiteData.listEnquiries(), list = all.filter(e => enqFilter === "all" || e.status === enqFilter);
    const n = s => all.filter(e => e.status === s).length;
    const ST = [["new", "New"], ["contacted", "Contacted"], ["booked", "Booked"], ["closed", "Closed"]];
    const when = iso => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    m.innerHTML = `
      <div class="head"><div style="display:grid;gap:6px"><h1>Enquiries</h1><p class="muted">Every "Enquire now" sent from the site. Today this list only holds enquiries made in this browser; with Firebase it collects them from every visitor.</p></div>
        <div style="display:flex;gap:8px"><button class="btn btn-quiet" id="csv" ${all.length ? "" : "disabled"}>${I.down2} Export CSV</button></div></div>
      <div class="stats">${[["all", "All", all.length], ...ST.map(([k, l]) => [k, l, n(k)])].slice(0, 4).map(([k, l, c]) => `<button class="card stat" data-f="${k}" style="text-align:left;${enqFilter === k ? "box-shadow:inset 0 0 0 2px var(--teal)" : ""}"><span class="label">${l}</span><b>${c}</b></button>`).join("")}</div>
      ${list.length ? `<div class="card table-wrap"><table><thead><tr><th>Received</th><th>Trip</th><th>Traveller</th><th class="hide-sm">When · Who</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(e => `<tr><td class="small num" style="white-space:nowrap">${when(e.at)}</td><td class="cell-main"><b>${esc(e.trip)}</b>${e.message ? `<span>${esc(e.message)}</span>` : ""}</td>
          <td class="cell-main"><b>${esc(e.name)}</b><span><a href="tel:${esc(e.phone.replace(/\s/g, ""))}">${esc(e.phone)}</a></span></td>
          <td class="hide-sm small">${esc(e.month)} · ${esc(e.travellers)}</td>
          <td><select class="select" data-st="${e.id}" style="min-width:130px">${ST.map(([k, l]) => `<option value="${k}" ${e.status === k ? "selected" : ""}>${l}</option>`).join("")}</select></td>
          <td><a class="btn btn-quiet" href="https://wa.me/${esc(e.phone.replace(/\D/g, ""))}?text=${encodeURIComponent(`Hi ${e.name.split(" ")[0]}, thanks for your enquiry about ${e.trip}. `)}" target="_blank" rel="noopener">Reply</a></td></tr>`).join("")}
      </tbody></table></div>` : `<div class="card empty">${all.length ? "No enquiries with this status." : "No enquiries yet. They appear here when someone taps Enquire now on the site."}</div>`}`;
    m.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => { enqFilter = b.dataset.f; vEnquiries(m); }));
    m.querySelectorAll("[data-st]").forEach(s => s.addEventListener("change", () => { SiteData.updateEnquiry(s.dataset.st, { status: s.value }); counts(); toast("Status updated."); }));
    const csv = $("csv"); if (csv) csv.addEventListener("click", () => {
      const rows = [["Received", "Trip", "Name", "Phone", "When", "Travellers", "Message", "Status"], ...all.map(e => [e.at, e.trip, e.name, e.phone, e.month, e.travellers, e.message, e.status])];
      const text = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = `wanderlust-enquiries-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    });
  }

  /* =================== publish =================== */
  function vPublish(m) {
    m.innerHTML = `
      <div class="head"><div style="display:grid;gap:6px"><h1>Publish</h1><p class="muted">How your changes reach the live website.</p></div></div>
      <div class="card pad" style="display:grid;gap:10px"><h3>1. Save changes</h3><p class="muted">Saves your edits in this browser so you can check them on the site here first. Visitors don't see them yet.</p><button class="btn btn-primary" id="pSave" style="justify-self:start">Save changes</button></div>
      <div class="card pad" style="display:grid;gap:10px"><h3>2. Download the site file</h3><p class="muted">Downloads <b>site.js</b> with all your content. Replace <b>data/site.js</b> on the web server with it to publish for everyone. Uploaded photos are included; uploaded music files are not, so put music in <b>assets/audio/</b> and use the link field.</p><button class="btn btn-quiet" id="pDownload" style="justify-self:start">${I.down2} Download site.js</button></div>
      <div class="note info">${I.info}<span>Once Firebase is connected, saving publishes straight to the live site and this download step goes away.</span></div>
      <div class="card pad" style="display:grid;gap:10px"><h3>Discard changes</h3><p class="muted">Throws away everything saved in this browser and goes back to the published content.</p><button class="btn btn-danger" id="pReset" style="justify-self:start">${I.trash} Discard and reload published content</button></div>`;
    $("pSave").onclick = save;
    $("pDownload").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([SiteData.publishedFile(site)], { type: "text/javascript" })); a.download = "site.js"; a.click(); toast("site.js downloaded. Upload it to data/site.js on your server."); };
    $("pReset").onclick = e => confirmBtn(e.currentTarget, () => { SiteData.clearDraft(); site = clone(window.SITE_DEFAULT); window.SITE = site; dirty = false; $("status").classList.remove("dirty"); $("statusText").textContent = "Showing published content"; counts(); toast("Changes discarded."); vPublish(m); });
  }

  unlocked() ? open() : $("pass").focus();
})();
