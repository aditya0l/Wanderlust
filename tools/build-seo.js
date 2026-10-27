/* Search and AI-search build: turns data/site.js and data/itineraries/*.json into files crawlers can read without
   running JavaScript. Run after changing packages, itineraries or policies:

     node tools/build-seo.js <markdown-source-dir>

   Writes, in this folder:
     journeys/<id>.html   one indexable page per visible package (the homepage dialog stays for people browsing)
     sitemap.xml          home, policies and every journey page
     robots.txt           crawl rules, plus comments pointing to the Markdown guide
     vercel.json          clean URLs, redirects from the old site's package URLs, headers
     index.html           the footer "Journeys" links (between the seo:journeys markers)
     policies.html        the four policies as static text (between the seo:policies markers)
   and, in <markdown-source-dir>, the reviewed Markdown bodies and inventory.json that the SEO suite's
   manage_markdown_site.py turns into llms.txt, sitemap.md and the .md pages (see README, "SEO"). */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), MD_SRC = process.argv[2];
const BASE = "https://thewanderlustexplorers.com";      // the production domain; the vercel.app preview is kept out of search
const TODAY = new Date().toISOString().slice(0, 10);

global.window = {}; require(path.join(ROOT, "data/site.js"));
const S = window.SITE_DEFAULT, C = S.contact;
const visible = S.packages.filter(p => p.visible !== false);
const REV = JSON.parse(fs.readFileSync(path.join(ROOT, "data/reviews.json"), "utf8"));
const revFor = id => { const own = REV.reviews.filter(r => r.journeys.includes(id)); return own.length ? own : REV.reviews.filter(r => r.journeys.includes("*")); };
const itin = id => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "data/itineraries", id + ".json"), "utf8")); } catch (e) { return null; } };
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clean = s => String(s ?? "").replace(/<[^>]*>?/g, "").replace(/\s+/g, " ").trim();   // a few itinerary lines carry stray HTML
const inr = n => "₹" + Number(n).toLocaleString("en-IN");
const img = (ref, w) => /^photo-/.test(ref || "") ? `https://images.unsplash.com/${ref}?w=${w}&q=78&auto=format&fit=crop` : ref;
const days = p => `${p.nights} nights / ${p.nights + 1} days`;
const url = p => `${BASE}/journeys/${p.id}`;
const paras = s => String(s || "").split(/\n+/).map(clean).filter(Boolean);
const PAY_DEFAULT = ["At booking, 30 days or more before departure: 30% of total cost", "29 – 20 days before departure: 30% of total cost", "19 days or less before departure: 40% (the balance)"];
const payLines = d => (d && d.payment && d.payment.length ? d.payment.slice(1) : PAY_DEFAULT).map(l => clean(l).replace(/\s+:\s+/, ": "));
const wa = p => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(`Hello, I'd like to plan the ${p.name} journey (${days(p)}).`)}`;

// answers built only from facts on the page
function faqs(p, d) {
  const q = [
    [`How much does the ${p.name} package cost?`, `From ${inr(p.price)} per person for ${days(p)}. Prices are indicative and are confirmed when you plan your dates with the team.`],
    [`How long is the ${p.name} trip and where do you stay?`, `${days(p)}: ${p.route}.`],
  ];
  if (d && d.inclusions && d.inclusions.length) q.push([`What is included in the ${p.name} package?`, d.inclusions.map(clean).join(" ")]);
  q.push([`How do I pay for the ${p.name} package?`, `In three parts. ${payLines(d).join(". ")}.`]);
  q.push([`How do I book the ${p.name} journey?`, `Call or WhatsApp ${C.phone}, or email ${C.email}. The planning desk is open 09:00–19:00 IST, and travel support answers 24 hours a day during your trip.`]);
  return q;
}

/* ---------------- journey pages ---------------- */
const CSS = `:root{--ink:#0F1A1C;--stone:#F5F4F1;--paper:#FAF7F2;--teal:#0E6B70;--muted:#5b6466;--line:rgba(15,26,28,.12);--serif:"Bodoni Moda",Georgia,serif;--sans:"Hanken Grotesk",system-ui,sans-serif}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--stone);color:var(--ink);font:400 1.05rem/1.65 var(--sans)}
a{color:var(--teal)}img{max-width:100%;height:auto;display:block}
.wrap{max-width:860px;margin:0 auto;padding:0 20px}
header.top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;max-width:1100px;margin:0 auto}
header.top img{height:42px;width:auto}header.top nav{display:flex;gap:18px;font-size:.95rem}header.top nav a{color:var(--ink);text-decoration:none}
.crumbs{font-size:.85rem;color:var(--muted);margin:8px 0 18px}.crumbs a{color:var(--muted)}
h1{font:500 clamp(2.1rem,6vw,3.6rem)/1.05 var(--serif);margin:0 0 12px}
h2{font:500 clamp(1.5rem,3.6vw,2.1rem)/1.15 var(--serif);margin:48px 0 14px}
h3{font-size:1.05rem;margin:26px 0 6px}
.lede{font-size:1.15rem;color:var(--muted);margin:0 0 22px}
.hero{border-radius:14px;overflow:hidden;margin:0 0 26px;aspect-ratio:16/9;background:#ddd}.hero img{width:100%;height:100%;object-fit:cover}
dl.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden;margin:0 0 8px}
dl.facts div{background:var(--paper);padding:14px 16px}dt{font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}dd{margin:4px 0 0;font-weight:600}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}.cta a{padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600}
.cta .wa{background:var(--teal);color:#fff}.cta .tel{border:1px solid var(--ink);color:var(--ink)}.cta .site{color:var(--teal)}
ul.list{padding-left:20px}ul.list li{margin:4px 0}
details{border-top:1px solid var(--line);padding:12px 0}details summary{cursor:pointer;font-weight:600}
footer{margin-top:64px;background:var(--ink);color:rgba(242,237,230,.8);padding:36px 0;font-size:.92rem}footer a{color:#cfe9e8}
footer .others{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 18px}
blockquote.rev{margin:0 0 18px;padding:18px 20px;background:var(--paper);border:1px solid var(--line);border-radius:12px}
blockquote.rev p{margin:0 0 8px}blockquote.rev footer{all:unset;display:block;font-size:.9rem;color:var(--muted)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin:16px 0 8px}
.card{display:block;background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden;text-decoration:none;color:var(--ink)}
.card img{width:100%;aspect-ratio:4/3;object-fit:cover}.card div{padding:12px 14px}.card b{display:block;font-size:1.05rem}.card span{color:var(--muted);font-size:.92rem}`;

// one page shell for the journey pages and the journeys hub
function shell({ title, desc, canonical, image, md, ld, preload, body }) {
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Wanderlust Explorers">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0F1A1C">
<link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon-64.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="alternate" type="text/markdown" href="${md}">
<link rel="preconnect" href="https://images.unsplash.com">
${preload || ""}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Hanken+Grotesk:wght@400;600&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Hanken+Grotesk:wght@400;600&display=swap"></noscript>
<style>${CSS}</style>
${ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
</head>
<body>
<header class="top"><a href="/" aria-label="The Wanderlust Explorers, home"><img src="/assets/logo-wordmark-ink-240.webp" alt="The Wanderlust Explorers" width="240" height="106" style="height:42px;width:auto"></a>
<nav aria-label="Main"><a href="/journeys">All journeys</a><a href="tel:${C.phone.replace(/\s/g, "")}">${esc(C.phone)}</a></nav></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap">
<p><b>Journeys from Delhi</b></p>
<nav class="others" aria-label="All journeys">${visible.map(o => `<a href="/journeys/${o.id}">${esc(o.name)}, ${o.nights} nights</a>`).join("")}</nav>
<p>The Wanderlust Explorers · Office 501, 5th floor, R-Tech Capital Mall, Mahal Road, Jaipur, Rajasthan 302017 · <a href="tel:${C.phone.replace(/\s/g, "")}">${esc(C.phone)}</a> · <a href="mailto:${C.email}">${esc(C.email)}</a></p>
<p><a href="https://www.instagram.com/thewanderlustexplorers/" rel="noopener me">Instagram @thewanderlustexplorers</a> · Rated ${esc(REV.rating)}: <a href="${esc(REV.source)}">read the reviews on Google</a>. Prices are indicative. <a href="/policies">Terms, cancellation, refund and privacy policies</a>.</p>
</div></footer>
</body>
</html>
`;
}
const heroSet = p => [480, 900, 1200].map(w => `${img(p.img, w)} ${w}w`).join(", ");

function journeyPage(p, d) {
  const others = visible.filter(o => o.id !== p.id);
  const q = faqs(p, d);
  let title = `${p.name} Tour Package from Delhi, ${p.nights}N/${p.nights + 1}D | Wanderlust`;
  if (title.length > 60) title = title.replace(" from Delhi", "");   // long names: keep it inside what Google shows
  const desc = clean(`${p.name} tour package: ${days(p)}, ${p.route}. ${p.sub}. From ${inr(p.price)} per person, with a day-by-day itinerary.`).slice(0, 158);
  const ld = [
    { "@context": "https://schema.org", "@type": "TouristTrip", "@id": url(p) + "#trip", name: `${p.name} tour package`, description: desc, url: url(p), image: img(p.img, 1200),
      provider: { "@id": BASE + "/#agency" },
      offers: { "@type": "Offer", price: p.price, priceCurrency: "INR", url: url(p), availability: "https://schema.org/InStock" },
      ...(d && d.days && d.days.length ? { itinerary: { "@type": "ItemList", numberOfItems: d.days.length, itemListElement: d.days.map((x, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "TouristAttraction", name: `Day ${i + 1}: ${clean(x.title)}` } })) } } : {}) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE + "/" },
      { "@type": "ListItem", position: 2, name: "Journeys", item: BASE + "/journeys" },
      { "@type": "ListItem", position: 3, name: p.name, item: url(p) }] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: q.map(([a, b]) => ({ "@type": "Question", name: a, acceptedAnswer: { "@type": "Answer", text: b } })) },
  ];
  const sec = (h, items) => items && items.length ? `<h2>${h}</h2><ul class="list">${items.map(x => `<li>${esc(clean(x))}</li>`).join("")}</ul>` : "";
  const revs = revFor(p.id);
  return shell({ title, desc, canonical: url(p), image: img(p.img, 1200), md: `/journeys/${p.id}.md`, ld,
    preload: `<link rel="preload" as="image" imagesrcset="${esc(heroSet(p))}" imagesizes="(max-width:860px) calc(100vw - 40px), 820px" fetchpriority="high">`,
    body: `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/journeys">Journeys</a> › ${esc(p.name)}</nav>
<h1>${esc(p.name)} tour package from Delhi</h1>
<p class="lede">${esc(days(p))} · ${esc(p.sub)} · from ${inr(p.price)} per person</p>
<figure class="hero"><img src="${esc(img(p.img, 1200))}" srcset="${esc(heroSet(p))}" sizes="(max-width:860px) calc(100vw - 40px), 820px" alt="${esc(p.name)}, ${esc(p.region)}" width="1200" height="675" fetchpriority="high"></figure>
<p>The ${esc(p.name)} journey from The Wanderlust Explorers is ${esc(days(p))} (${esc(p.route)}), starting at ${inr(p.price)} per person. One planner arranges what the package includes (listed below) and can add flights from Delhi and visas on request; travel support answers 24 hours a day during the trip.</p>
<dl class="facts"><div><dt>Duration</dt><dd>${esc(days(p))}</dd></div><div><dt>Route</dt><dd>${esc(p.route)}</dd></div><div><dt>From</dt><dd>${inr(p.price)} per person</dd></div><div><dt>Region</dt><dd>${esc(p.region)}</dd></div></dl>
<div class="cta"><a class="wa" href="${esc(wa(p))}">Plan on WhatsApp</a><a class="tel" href="tel:${C.phone.replace(/\s/g, "")}">Call ${esc(C.phone)}</a><a class="site" href="/?trip=${encodeURIComponent(p.id)}">Open the interactive itinerary</a></div>
${d && d.overview ? `<h2>Overview</h2>${d.overview.flatMap(paras).map(x => `<p>${esc(x)}</p>`).join("")}` : ""}
${sec("Highlights", d && d.highlights)}
${d && d.days && d.days.length ? `<h2>Day-by-day itinerary</h2>${d.days.map((x, i) => `<h3>Day ${i + 1}: ${esc(clean(x.title))}</h3>${paras(x.body).map(t => `<p>${esc(t)}</p>`).join("")}`).join("")}` : `<h2>Itinerary</h2><p>The day-by-day plan for this journey is shared when you plan your dates with the team.</p>`}
${sec("What's included", d && d.inclusions)}
${sec("Not included", d && d.exclusions)}
<h2>Payment schedule</h2><ul class="list">${payLines(d).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
<p>Cancellation and refund terms are in the <a href="/policies#cancellation">policies</a>.</p>
<h2>What travellers say</h2>
${revs.map(r => `<blockquote class="rev"><p>“${esc(r.text)}”</p><footer>${esc(r.name)} · ${esc(r.trip)} · ★★★★★ Google review</footer></blockquote>`).join("")}
<p><a href="${esc(REV.source)}">Rated ${esc(REV.rating)}</a></p>
<h2>Questions about the ${esc(p.name)} package</h2>
${q.map(([a, b]) => `<details><summary>${esc(a)}</summary><p>${esc(b)}</p></details>`).join("")}
<div class="cta"><a class="wa" href="${esc(wa(p))}">Plan the ${esc(p.name)} journey</a></div>` });
}

// the journeys hub: every visible package, India first, aimed at "holiday packages from Delhi"
function hubPage() {
  const groups = [["Journeys in India", visible.filter(p => p.country === "India")], ["Journeys abroad", visible.filter(p => p.country !== "India")]];
  const title = "Tour Packages from Delhi: India & Abroad | Wanderlust";   // the homepage owns "holiday packages from Delhi"
  const desc = `${visible.length} tour packages from Delhi: ${visible.map(p => p.name).join(", ")}. Prices, routes and day-by-day itineraries.`.slice(0, 158);
  const ld = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: "Tour packages from Delhi", url: BASE + "/journeys", description: desc, isPartOf: { "@id": BASE + "/#website" },
      mainEntity: { "@type": "ItemList", itemListElement: visible.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: url(p), name: `${p.name}, ${days(p)}` })) } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE + "/" }, { "@type": "ListItem", position: 2, name: "Journeys", item: BASE + "/journeys" }] },
  ];
  const cheapest = visible.reduce((a, b) => (a.price <= b.price ? a : b)), longest = visible.reduce((a, b) => (a.nights >= b.nights ? a : b));
  return shell({ title, desc, canonical: BASE + "/journeys", image: img(visible[0].img, 1200), md: "/journeys/index.md", ld,
    body: `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › Journeys</nav>
<h1>Tour packages from Delhi</h1>
<p class="lede">${visible.length} journeys in India and abroad, each with a day-by-day plan and one person to call.</p>
<p>The Wanderlust Explorers, a travel agency in Jaipur, arranges ${visible.length} holiday packages from Delhi, from ${days(cheapest).split(" / ")[0]} in ${esc(cheapest.name)} at ${inr(cheapest.price)} per person to ${days(longest).split(" / ")[0]} in ${esc(longest.name)}. Each package lists its route, price, what is included and a three-part payment schedule; flights from Delhi and visas can be added.</p>
${groups.filter(([, l]) => l.length).map(([h, l]) => `<h2>${h}</h2><div class="cards">${l.map(p => `<a class="card" href="/journeys/${p.id}"><img src="${esc(img(p.img, 600))}" alt="${esc(p.name)}, ${esc(p.region)}" width="600" height="450" loading="lazy"><div><b>${esc(p.name)} tour package</b><span>${esc(days(p))} · ${esc(p.route)} · from ${inr(p.price)}</span></div></a>`).join("")}</div>`).join("\n")}
<h2>How booking works</h2>
<p>Call or WhatsApp ${esc(C.phone)}, or email ${esc(C.email)}. Payment is in three parts: 30% at booking, 30% between 29 and 20 days before departure, and the 40% balance 19 days or less before departure. <a href="/policies#cancellation">Cancellation and refund terms</a>.</p>` });
}

fs.mkdirSync(path.join(ROOT, "journeys"), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, "journeys"))) if (f.endsWith(".html")) fs.unlinkSync(path.join(ROOT, "journeys", f));   // removed packages disappear
visible.forEach(p => fs.writeFileSync(path.join(ROOT, "journeys", p.id + ".html"), journeyPage(p, itin(p.id))));
fs.writeFileSync(path.join(ROOT, "journeys", "index.html"), hubPage());

/* ---------------- homepage footer links and static policies ---------------- */
function between(file, tag, html) {
  const f = path.join(ROOT, file), s = fs.readFileSync(f, "utf8"), a = `<!-- seo:${tag} -->`, b = `<!-- /seo:${tag} -->`;
  if (!s.includes(a) || !s.includes(b)) throw new Error(`${file}: missing ${a} … ${b} markers`);
  fs.writeFileSync(f, s.slice(0, s.indexOf(a) + a.length) + html + s.slice(s.indexOf(b)));
}
between("index.html", "journeys", `<div><span class="label">Journeys</span><ul><li><a href="/journeys">All journeys</a></li>${visible.map(p => `<li><a href="/journeys/${p.id}">${esc(p.name)}</a></li>`).join("")}</ul></div>`);
const mdLite = body => String(body || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => /^#{2,3}\s/.test(l) ? `<h2>${esc(l.replace(/^#+\s*/, ""))}</h2>` : /^[-*]\s/.test(l) ? `<p>• ${esc(l.slice(2))}</p>` : `<p>${esc(l)}</p>`).join("");
between("policies.html", "policies", Object.entries(S.legal).map(([k, d]) => `<section id="${k}"><h1>${esc(d.title)}</h1>${mdLite(d.body)}</section>`).join(""));

/* ---------------- sitemap.xml and robots.txt ---------------- */
const urls = [[BASE + "/", "1.0"], [BASE + "/journeys", "0.9"], ...visible.map(p => [url(p), "0.8"]), [BASE + "/policies", "0.3"]];
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<!-- Readable Markdown versions of these pages: ${BASE}/llms.txt and ${BASE}/sitemap.md -->
${urls.map(([u, pr]) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod><priority>${pr}</priority></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, "robots.txt"), `# Markdown guide to this site for readers and language models: ${BASE}/llms.txt
# Every public page as Markdown: ${BASE}/sitemap.md
User-agent: *
Allow: /
Disallow: /admin
Disallow: /account

Sitemap: ${BASE}/sitemap.xml
`);

/* ---------------- vercel.json: clean URLs, old-site redirects, headers ---------------- */
const visibleIds = new Set(visible.map(p => p.id));
const redirects = fs.readdirSync(path.join(ROOT, "data/itineraries")).filter(f => f.endsWith(".json")).sort().map(f => {
  const id = f.replace(/\.json$/, ""), src = (itin(id) || {}).source || "";
  const m = src.match(/^https:\/\/thewanderlustexplorers\.com(\/package-details\/[^?#]+)$/);
  return m && { source: m[1], destination: visibleIds.has(id) ? `/journeys/${id}` : "/#collections", permanent: true };
}).filter(Boolean);
redirects.push({ source: "/package-details/:path*", destination: "/#collections", permanent: true });   // any other old package URL
const mdHeaders = [["/llms.txt", "text/plain; charset=utf-8"], ["/(.*)\\.md", "text/markdown; charset=utf-8"]].map(([source, v]) => ({ source, headers: [{ key: "Content-Type", value: v }, { key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] }));
const canon = [...visible.map(p => [`/journeys/${p.id}.md`, url(p)]), ["/policies.md", BASE + "/policies"], ["/home.md", BASE + "/"], ["/journeys/index.md", BASE + "/journeys"]]
  .map(([source, u]) => ({ source, headers: [{ key: "Link", value: `<${u}>; rel="canonical"` }] }));
fs.writeFileSync(path.join(ROOT, "vercel.json"), JSON.stringify({
  $schema: "https://openapi.vercel.sh/vercel.json",
  cleanUrls: true,
  redirects,
  headers: [
    // the preview address (*.vercel.app) stays out of search; the production domain is indexed
    { source: "/(.*)", has: [{ type: "host", value: { suf: ".vercel.app" } }], headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    // basic hardening for every page; a Content-Security-Policy would need the inline scripts moved out first
    { source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    ] },
    { source: "/(admin|account)(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ...mdHeaders, ...canon,
  ],
}, null, 2) + "\n");

/* ---------------- Markdown sources for the SEO suite ---------------- */
if (MD_SRC) {
  fs.rmSync(MD_SRC, { recursive: true, force: true }); fs.mkdirSync(path.join(MD_SRC, "source"), { recursive: true });
  const rev = require("child_process").execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim() + "+build-" + TODAY;
  const pages = [];
  const add = (id, u, title, purpose, topic, body, md) => { fs.writeFileSync(path.join(MD_SRC, "source", id + ".md"), body.trim() + "\n"); pages.push({ id, url: u, disposition: "publish", reviewed_public: true, title, purpose, locale: "en-IN", topic, updated_at: TODAY, source_revision: rev, body_ref: `source/${id}.md`, md_path: md }); };
  const list = a => (a || []).map(x => `- ${clean(x)}`).join("\n");
  add("home", BASE + "/", "The Wanderlust Explorers: holiday packages from Delhi", "Who the agency is, what it arranges, how to contact and pay, and every journey on offer", "company", `
## What is The Wanderlust Explorers?

A travel agency based in Jaipur, Rajasthan, that arranges holiday packages, flights and visas for travellers departing from Delhi. One planner handles the flights, visa and hotels for a trip.

## Who runs the agency?

The Wanderlust Explorers was co-founded by Tanushka Jain and Prateek Singh.

## How do I contact the team?

- Phone and WhatsApp: ${C.phone}
- Email: ${C.email}
- Instagram: https://www.instagram.com/thewanderlustexplorers/
- Planning desk: 09:00–19:00 IST. Travel support: 24 hours a day during your trip.
- Office: Office 501, 5th floor, R-Tech Capital Mall, Mahal Road, Jaipur, Rajasthan 302017, India.

## What does the agency arrange?

Holiday packages in India and abroad, flights, visa applications, and group travel (group fares are negotiated directly with airlines for groups of 9 or more). Partner hotels in 60+ cities, including 100+ Radisson properties in India.

## How are holidays paid for?

In three parts:

${PAY_DEFAULT.map(l => "- " + l).join("\n")}

## Which journeys are available?

${visible.map(p => `- [${p.name}](${BASE}/journeys/${p.id}.md): ${days(p)}, ${p.route}, from ${inr(p.price)} per person.`).join("\n")}

Prices are indicative and confirmed when dates are planned.
`, "home.md");
  visible.forEach(p => { const d = itin(p.id);
    add(p.id, url(p), `${p.name} tour package from Delhi, ${days(p)}`, `Price, route, day-by-day plan, inclusions and payment for the ${p.name} journey`, "journeys", `
## Summary

The ${p.name} journey is ${days(p)} (${p.route}) in ${p.region}, from ${inr(p.price)} per person. ${p.sub}. Prices are indicative and confirmed when dates are planned.
${d && d.overview ? `\n## Overview\n\n${d.overview.flatMap(paras).join("\n\n")}\n` : ""}${d && d.highlights ? `\n## Highlights\n\n${list(d.highlights)}\n` : ""}
## Day-by-day itinerary

${d && d.days && d.days.length ? d.days.map((x, i) => `### Day ${i + 1}: ${clean(x.title)}\n\n${paras(x.body).join("\n\n")}`).join("\n\n") : "The day-by-day plan is shared when you plan your dates with the team."}
${d && d.inclusions ? `\n## What is included\n\n${list(d.inclusions)}\n` : ""}${d && d.exclusions ? `\n## Not included\n\n${list(d.exclusions)}\n` : ""}
## Payment schedule

${payLines(d).map(l => "- " + l).join("\n")}

## What travellers say

${revFor(p.id).map(r => `> ${r.text}\n>\n> ${r.name}, ${r.trip}, five-star Google review`).join("\n\n")}

The agency is rated ${REV.rating}: ${REV.source}

## Questions

${faqs(p, d).map(([a, b]) => `### ${a}\n\n${b}`).join("\n\n")}

## How to book

Call or WhatsApp ${C.phone}, or email ${C.email}. Cancellation and refund terms: ${BASE}/policies.md
`, `journeys/${p.id}.md`); });
  add("journeys-index", BASE + "/journeys", "Tour packages from Delhi: all journeys", "Every journey with its duration, route and starting price, grouped into India and abroad", "journeys", `
## Which tour packages are available from Delhi?

${[["In India", visible.filter(p => p.country === "India")], ["Abroad", visible.filter(p => p.country !== "India")]].filter(([, l]) => l.length).map(([h, l]) => `### ${h}\n\n${l.map(p => `- [${p.name}](${BASE}/journeys/${p.id}.md): ${days(p)}, ${p.route}, from ${inr(p.price)} per person.`).join("\n")}`).join("\n\n")}

Prices are indicative and confirmed when dates are planned. Flights from Delhi and visas can be added to any journey.

## What do travellers say?

The agency is rated ${REV.rating}. Reviews: ${REV.source}
`, "journeys/index.md");
  add("policies", BASE + "/policies", "Terms, cancellation, refund and privacy policies", "The agency's terms and conditions, cancellation policy, refund policy and privacy policy", "company",
    Object.entries(S.legal).map(([k, d]) => `## ${d.title}\n\n${String(d.body || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => l.replace(/^#{2,3}\s+/, "### ")).join("\n\n")}`).join("\n\n"), "policies.md");
  pages.push({ id: "account", url: BASE + "/account", disposition: "exclude", reason: "Signed-in customer area; not public content." });
  pages.push({ id: "admin", url: BASE + "/admin", disposition: "exclude", reason: "Private content editor." });
  fs.writeFileSync(path.join(MD_SRC, "inventory.json"), JSON.stringify({
    schema_version: "1.0.0", site_name: "The Wanderlust Explorers", origin: BASE,
    summary: "Holiday packages, flights and visas from Delhi: every journey's price, route, day-by-day itinerary, inclusions and payment schedule, plus the agency's contact details and policies.",
    inventory_scope: "complete",
    inventory_evidence: `Static site source at ${rev}: index.html, policies.html, ${visible.length} visible packages in data/site.js (hidden packages excluded by the owner's visibility setting), account.html and admin.html.`,
    owner: "The Wanderlust Explorers website owner", refresh_trigger: "Run tools/build-seo.js and the suite build whenever packages, itineraries or policies change (including edits published from the admin).",
    index_policy: "canonical-to-html", pages,
  }, null, 2));
}
console.log(`${visible.length} journey pages, ${redirects.length} redirects, ${urls.length} sitemap URLs${MD_SRC ? ", markdown sources in " + MD_SRC : ""}`);
