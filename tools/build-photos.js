/* Self-hosted photos: every photo the site uses is saved once in assets/photos as WebP at a few widths, so pages
   load them from this site's own CDN. Three kinds of photo are handled:
     photo-…      an Unsplash photo id (downloaded from Unsplash)
     https://…    an image link pasted in the admin (downloaded from that address)
     up-…         a photo uploaded in the admin (written to tools/.photo-cache by tools/sync-content.js)
   including the gallery and day photos in the itineraries (data/itineraries) of the packages shown on the site.
   Run after photos change (the GitHub sync runs it for you):

     node tools/build-photos.js

   Needs curl and cwebp, plus sips (macOS) or ImageMagick (Linux). Writes assets/photos/<name>-<width>.webp,
   assets/photos/og-<photo-id>.jpg (1200 x 630, for link previews) and data/photos.js, the list the site reads
   (SiteData.img uses the original address for anything not listed). */
const fs = require("fs"), path = require("path"), crypto = require("crypto"), { execFileSync, execFile } = require("child_process");
const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "assets/photos"), CACHE = path.join(__dirname, ".photo-cache");
const WIDTHS = [640, 1080, 1600];
const OG = "photo-1609601546193-f558f1ebb385";             // the link-preview photo (index.html og:image)
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true });

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const has = cmd => { try { run("which", [cmd]); return true; } catch (e) { return false; } };
const SIPS = has("sips");
const dims = file => {
  if (SIPS) { const d = run("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file]); return [+d.match(/pixelWidth: (\d+)/)[1], +d.match(/pixelHeight: (\d+)/)[1]]; }
  return run("identify", ["-format", "%w %h", file + "[0]"]).trim().split(" ").map(Number);
};
const ogCrop = (src, out) => {
  if (SIPS) { const tmp = path.join(CACHE, "og-tmp.jpg"); run("sips", ["--resampleWidth", "1200", src, "--out", tmp]); run("sips", ["--cropToHeightWidth", "630", "1200", tmp, "--out", out]); }
  else run("convert", [src, "-resize", "1200x630^", "-gravity", "center", "-extent", "1200x630", "-quality", "85", out]);
};

/* which photos: ids in the content and pages, plus links and uploads used as package or slide photos */
global.window = {}; require(path.join(ROOT, "data/site.js"));
const S = window.SITE_DEFAULT;
const refs = new Map();                                    // ref (as written in the content) -> { name, source, widths }
for (const f of ["data/site.js", "index.html", "account.html", "account.js"]) {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  (s.match(/photo-\d+-[0-9a-f]+/g) || []).forEach(id => refs.set(id, { name: id, source: `https://images.unsplash.com/${id}?w=2000&q=90&fm=jpg&fit=max` }));
}
const addRef = (r, widths) => {
  if (refs.has(r)) return;
  if (/^https:\/\//.test(r || "")) refs.set(r, { name: "ext-" + crypto.createHash("sha1").update(r).digest("hex").slice(0, 16), source: r, widths });
  if (/^up-[0-9a-f]{16}$/.test(r || "")) refs.set(r, { name: r, source: null, widths });
};
const shown = (S.packages || []).filter(p => p.visible !== false);   // hidden packages aren't shown
for (const x of [...shown, ...(S.slides || [])]) addRef(x && x.img);
// itinerary galleries and day photos: shown smaller (gallery strip, inside each day), so two widths
for (const p of shown) {
  let d; try { d = JSON.parse(fs.readFileSync(path.join(ROOT, "data/itineraries", p.id + ".json"), "utf8")); } catch (e) { continue; }
  [...(d.gallery || []), ...(d.days || []).map(x => x && x.img)].filter(Boolean).forEach(r => addRef(r, [640, 1080]));
}
const masterOf = name => ["jpg", "jpeg", "png", "webp"].map(e => path.join(CACHE, `${name}.${e}`)).find(f => fs.existsSync(f)) || path.join(CACHE, name + ".jpg");

/* downloads: one high-quality original per photo, kept in tools/.photo-cache (not published), six at a time */
const fetchMaster = (ref, { name, source }, attempt = 1) => new Promise(resolve => {
  const master = path.join(CACHE, name + ".jpg"), part = master + ".part";
  execFile("curl", ["-sSfL", "--max-time", "240", "-o", part, source], err => {
    if (!err) { fs.renameSync(part, master); return resolve(true); }
    fs.rmSync(part, { force: true });                      // never keep a half-finished file
    if (attempt < 2) return fetchMaster(ref, { name, source }, attempt + 1).then(resolve);
    console.warn(`skipped (download failed): ${ref.slice(0, 80)}`); resolve(false);
  });
});

// photos already built (listed in data/photos.js with all their files present) are reused as they are, so the
// GitHub sync, which has no originals cached, only downloads what's new
const before = (() => { try { const w = {}; require("vm").runInNewContext(fs.readFileSync(path.join(ROOT, "data/photos.js"), "utf8"), { window: w }); return w.PHOTOS || {}; } catch (e) { return {}; } })();
const built = ref => { const p = before[ref]; return p && p.w.every(w => fs.existsSync(path.join(OUT, `${p.f || ref}-${w}.webp`))) && (ref !== OG || fs.existsSync(path.join(OUT, `og-${ref}.jpg`))); };

(async () => {
  const missing = [...refs].filter(([r, p]) => p.source && !built(r) && !fs.existsSync(masterOf(p.name)));
  for (let i = 0; i < missing.length; i += 6) await Promise.all(missing.slice(i, i + 6).map(([r, p]) => fetchMaster(r, p)));

  const list = {};
  for (const [ref, { name, widths: only }] of [...refs].sort()) {
    if (built(ref)) { list[ref] = before[ref]; continue; }
    const master = masterOf(name);
    if (!fs.existsSync(master)) { if (name.startsWith("up-")) console.warn(`skipped (upload not in the cache): ${ref}`); continue; }
    let W, H;
    try { [W, H] = dims(master); } catch (e) { console.warn(`skipped (not an image): ${ref.slice(0, 80)}`); continue; }
    const widths = (only || WIDTHS).filter(w => w <= W);
    if (!widths.length) widths.push(W);
    for (const w of widths) {
      const out = path.join(OUT, `${name}-${w}.webp`);
      if (!fs.existsSync(out)) run("cwebp", ["-quiet", "-mt", "-m", "6", "-q", w <= 640 ? "80" : "76", "-resize", String(w), "0", master, "-o", out]);
    }
    // a ~300-byte blurred preview, inlined in data/photos.js so it needs no request of its own
    const tiny = path.join(CACHE, name + "-tiny.webp");
    if (!fs.existsSync(tiny)) run("cwebp", ["-quiet", "-q", "40", "-resize", "24", "0", master, "-o", tiny]);
    list[ref] = { ...(name !== ref ? { f: name } : {}), w: widths, r: +(H / W).toFixed(4), blur: "data:image/webp;base64," + fs.readFileSync(tiny).toString("base64") };
    if (ref === OG) { const og = path.join(OUT, `og-${ref}.jpg`); if (!fs.existsSync(og)) ogCrop(master, og); }
  }

  // drop files for photos no longer used
  const keep = new Set(Object.entries(list).flatMap(([ref, p]) => p.w.map(w => `${p.f || ref}-${w}.webp`)).concat(`og-${OG}.jpg`));
  for (const f of fs.readdirSync(OUT)) if (!keep.has(f)) fs.unlinkSync(path.join(OUT, f));

  fs.writeFileSync(path.join(ROOT, "data/photos.js"), "/* Generated by tools/build-photos.js: photos served from assets/photos (file name if not the id, widths, height/width ratio, blurred preview). */\nwindow.PHOTOS = " + JSON.stringify(list) + ";\n");
  const bytes = fs.readdirSync(OUT).reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`${Object.keys(list).length} photos, ${fs.readdirSync(OUT).length} files, ${(bytes / 1048576).toFixed(1)} MB in assets/photos`);
})().catch(e => { console.error(e.message); process.exit(1); });
