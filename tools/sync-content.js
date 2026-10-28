/* Content sync: copies what the client published in the admin (Firestore) into this repository, so the rest of the
   build (photos, journey pages, sitemap, Markdown) can run on it. Run by .github/workflows/sync.yml every 15 minutes,
   or by hand:

     node tools/sync-content.js

   Reads only public documents (site/live and itineraries/*), no credentials. Uploaded photos, which the admin stores
   inside the content as data: URLs, are written to tools/.photo-cache as up-<hash>.jpg and referred to by that id, so
   tools/build-photos.js serves them from assets/photos. Prints "changed" or "unchanged" as its last line. */
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, ".."), CACHE = path.join(__dirname, ".photo-cache");
const CFG = { apiKey: fs.readFileSync(path.join(ROOT, "firebase-config.js"), "utf8").match(/apiKey: *"([^"]+)"/)[1], project: "wanderlust-e4b8b" };
const REST = `https://firestore.googleapis.com/v1/projects/${CFG.project}/databases/(default)/documents`;

global.window = {}; require(path.join(ROOT, "data/site.js"));
const current = window.SITE_DEFAULT;

const getJSON = async url => { const r = await fetch(url); if (r.status === 404) return null; if (!r.ok) throw new Error(`${r.status} for ${url.replace(/key=[^&]+/, "key=…")}`); return r.json(); };

// uploaded photos: data: URLs become files in the photo cache, referred to as up-<hash>
function hoistUploads(node) {
  if (typeof node === "string") {
    const m = node.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
    if (!m) return node;
    const buf = Buffer.from(m[2], "base64"), id = "up-" + crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16);
    fs.mkdirSync(CACHE, { recursive: true });
    const file = path.join(CACHE, `${id}.${m[1] === "jpg" ? "jpeg" : m[1]}`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, buf);
    return id;
  }
  if (Array.isArray(node)) return node.map(hoistUploads);
  if (node && typeof node === "object") { const out = {}; for (const k in node) out[k] = hoistUploads(node[k]); return out; }
  return node;
}

(async () => {
  let changed = false;

  /* site content */
  const doc = await getJSON(`${REST}/site/live?key=${CFG.apiKey}`);
  const json = doc && doc.fields && doc.fields.json && doc.fields.json.stringValue;
  const updatedAt = doc && doc.fields && doc.fields.updatedAt && doc.fields.updatedAt.stringValue;
  if (!json) console.log("site: nothing published yet");
  else {
    const live = JSON.parse(json);
    if (live.version !== current.version) console.log(`site: published copy is content version ${live.version}, this site uses ${current.version}; left alone until the admin publishes again`);
    else if (current.syncedAt && updatedAt <= current.syncedAt) console.log(`site: up to date (${current.syncedAt})`);
    else {
      const next = hoistUploads(live);
      delete next.updatedAt;
      next.syncedAt = updatedAt;                         // the site skips downloading the published copy while this matches
      fs.writeFileSync(path.join(ROOT, "data/site.js"), "/* Published site content, synced from the admin by tools/sync-content.js. Edit in the admin, not here. */\nwindow.SITE_DEFAULT = " + JSON.stringify(next, null, 2) + ";\n");
      console.log(`site: synced the copy published ${updatedAt}`);
      changed = true;
    }
  }

  /* itineraries edited in the admin (one document each, JSON in a "json" field) */
  let pageToken = "", n = 0;
  do {
    const list = await getJSON(`${REST}/itineraries?key=${CFG.apiKey}&pageSize=100${pageToken ? "&pageToken=" + pageToken : ""}`);
    for (const d of (list && list.documents) || []) {
      const id = d.name.split("/").pop(), j = d.fields && d.fields.json && d.fields.json.stringValue;
      if (!j || !/^[a-z0-9-]+$/.test(id)) continue;
      const file = path.join(ROOT, "data/itineraries", id + ".json"), text = JSON.stringify(JSON.parse(j));   // same compact form as the bundled files
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) { fs.writeFileSync(file, text); n++; }
    }
    pageToken = list && list.nextPageToken;
  } while (pageToken);
  if (n) { console.log(`itineraries: ${n} updated`); changed = true; }

  console.log(changed ? "changed" : "unchanged");
})().catch(e => { console.error(e.message); process.exit(1); });
