# The Wanderlust Explorers — website concept

A redesign concept for [thewanderlustexplorers.com](https://thewanderlustexplorers.com/): flights, visas and holidays from Delhi.

## Run it

It is a static site. Serve the folder with any web server (opening the file directly blocks the map texture):

```bash
python3 -m http.server 5178
```

Then open http://localhost:5178.

## What's inside

| File | What it is |
|---|---|
| `index.html` | The current design: editorial luxury look, hero slideshow, scroll-driven plane journey across Asia, filterable journeys, services, reviews, contact |
| `sound.js` | Generative soundscapes for each place (Ladakh, Maldives, Jaipur, Dubai, Kerala, Manali, Singapore, Golden Triangle, Bali, Swiss Alps), built with the Web Audio API |
| `account.html`, `account.js` | Customer account: Google sign-in, overview, trips, wallet, visa status, profile and saved travellers |
| `account-firebase.js` | The account data layer on Firebase (Google sign-in, Firestore) |
| `account-data.js` | The same layer on sample data, used by `account.html?demo` to show the screens without signing in |
| `data/site.js` | All editable content: hero slides, packages and prices, music per place, popular searches, partners, policies. Edited through the admin panel |
| `site-data.js` | Shared data layer: live content from Firestore (with `data/site.js` as the fallback), enquiries, uploads |
| `firebase-config.js`, `firebase.json`, `.firebaserc` | Firebase project `wanderlust-e4b8b` |
| `firestore.rules` | Who can read and write what (see below) |
| `data/itineraries/` | Day-by-day itineraries for 43 packages, imported from the client's current site. Used until the admin saves an edit |
| `policies.html` | Terms & conditions, cancellation, refund and privacy policies (text copied from the current site, linked from the footer; `policies.html#refund` opens one directly) |
| `admin.html`, `admin.js` | Admin panel: packages and prices, hero slides, music, partners, popular searches, policies, customers (wallet, trips, visas), enquiries, publish. Firebase email sign-in |
| `assets/audio/` | Licensed music files per place (see the README inside) |
| `assets/` | Logo cut-outs (ink and light versions of the full logo, the W mark and the wordmark) and the original logo file |
| `versions/` | Earlier rounds: v1 concept pitch, v2 "window seat" hero with 3D globe, v3 editorial without sound |

Libraries load from CDNs: GSAP 3.12.5 (ScrollTrigger, Flip) and Lenis 1.1.13. Photos are from Unsplash.

## Before launch

- Prices for Ladakh, Maldives, Kerala, Bali and Swiss Alps are placeholders; Manali, Jaipur, Golden Triangle, Dubai and Singapore come from the current site.
- Two of the four reviews are marked as samples. Connect real Google reviews.
- The soundscapes are synthesized sketches. Swap in licensed field recordings for the live site.
- When `sound.js` changes, bump the `?v=` number on its script tag in `index.html` so browsers fetch the new file.

## Firebase

Project `wanderlust-e4b8b`, on the free Spark plan. Nothing here needs Blaze.

| What | Where in Firestore | Who writes it |
|---|---|---|
| Live site content | `site/live` (one JSON string) | Admins, with Publish |
| Itineraries | `itineraries/{packageId}` (one JSON string) | Admins, from Packages → list icon. Saved live straight away; anyone can read |
| Enquiries | `enquiries/{id}` | A signed-in customer sends one (it carries their uid); they see their own in My trips; admins read and update all |
| Customer profile | `users/{uid}` | The customer (created on first Google sign-in) |
| Saved travellers | `users/{uid}/travellers/{id}` | The customer |
| Trips, visas, wallet | `users/{uid}/trips`, `/visas`, `/wallet` | Admins only. Customers can only read their own |
| Admin list | `admin/{uid}` | Added by hand in the Firebase console |

- **Sign-in:** Google for customers, email and password for admins. Phone OTP is left out because it is billed per SMS.
- **Wallet:** one document per credit or debit. The balance is always worked out from the unexpired entries, never stored. Credits are site-only, can't be withdrawn or transferred, and expire after 12 months.
- **Homepage speed:** public pages read `site/live` through the Firestore REST API (no SDK), under the loader. If Firestore is slow (over 2.5 s) or unreachable, they use `data/site.js`.
- **Deploying rules:** `firebase deploy --only firestore:rules` from this folder.

### One-time setup in the Firebase console

1. Firestore Database → Create database → production mode, location `asia-south1` (Mumbai).
2. Authentication → Get started → Sign-in method: enable Google and Email/Password.
3. Authentication → Settings → Authorised domains: add the live domains (the Vercel address and thewanderlustexplorers.com).
4. Authentication → Users → Add user: the admin's email and password. Copy the user UID.
5. Firestore → Start collection `admin` → document ID = that UID, with any field (for example `name`).
6. Deploy the rules (above), sign in to `admin.html`, and Publish once so the live content exists.

## Admin panel and publishing

Open `admin.html` and sign in with an admin account. Save keeps your edits in that browser so you can check them on the site first. Publish → Publish now sends them to every visitor. Customers lists everyone who has signed in; open one to add wallet credit, trips and visa updates. Music uploaded in the admin only plays in that browser; for the live site put files in `assets/audio/` and use the link field.

## Search and enquiries

The hero search box has two modes, Holidays and Visa. The search (top bar, the hero search box, or press `/`) matches package names, destinations, routes and trip types, understands budgets like "under ₹20,000" or "under 2 lac", and suggests popular searches. Every package has Enquire now and Call. Visitors browse without an account; Enquire now, Plan my journey and the visa search ask them to sign in with Google first, then show the form with their name and number filled in, save the enquiry and open WhatsApp. Firebase only loads at that moment (or quietly after the intro for someone who signed in before). If the browser blocks the sign-in pop-up, as Instagram's and Facebook's in-app browsers do, sign-in continues on a full page and the enquiry reopens when they come back. Enquiries are listed in the admin panel and in the customer's account.

## Packages and itineraries

Clicking a journey (its photo, name or "See the day-by-day itinerary") opens its details over the page: photos, overview, highlights, the day-by-day plan, what's included and not, the payment schedule and links to the policies, with a sticky price card and Enquire now. Each package has its own address (`index.html?trip=ladakh`), so it can be shared on WhatsApp and the back button closes it.

All 43 packages on the client's current site were imported: 10 are matched to the journeys on the homepage (their nights, prices and route lines now follow the client's real packages), and 33 more are in the admin, hidden, ready to switch on. Kumaon Hills has no package on the client's site, so it has no itinerary until one is added in the admin.

Cleaned up on import: sentences naming other travel companies (flyshop.in, Thrillophilia) were removed and "a Yatra representative" became "a Wanderlust representative". Worth checking with the client: Ladakh's Day 6 repeats Day 2 on their own site, and three packages (Cambodia, Cultural Triangle, Elegant Europe) have no inclusions listed.

## SEO, AEO and GEO

The site's interactive parts are drawn by JavaScript, which most AI crawlers don't run. So everything a search engine or AI assistant needs also exists as plain files, generated from the same data:

- `journeys/<id>.html`: one page per visible package (title "<Place> Tour Package from Delhi, NN/ND", day-by-day plan, inclusions, payment, Q&A, TouristTrip / BreadcrumbList / FAQPage data). The homepage cards and footer link to them; clicking a card still opens the dialog.
- The policies are written into `policies.html` as static text.
- `llms.txt`, `sitemap.md`, `llm/topics/*.md`, `home.md`, `policies.md`, `journeys/<id>.md`: the same content as Markdown, for AI assistants.
- `sitemap.xml`, `robots.txt` (keeps /admin and /account out of search).
- `vercel.json`: clean URLs (`/journeys/ladakh`), 301 redirects from the old site's `/package-details/...` URLs, and `noindex` on the `*.vercel.app` preview so it doesn't compete with thewanderlustexplorers.com.

**Rebuild after changing packages, itineraries or policies** (including admin edits: the static pages read `data/`, not Firestore):

```
node tools/build-seo.js ../seo-build/markdown-source
python3 <seo-suite>/scripts/manage_markdown_site.py build --inventory ../seo-build/markdown-source/inventory.json --output ../seo-build/public-md
cp -R ../seo-build/public-md/. .
```

(`../seo-build` must not exist before the second command; delete it first.) The production domain is set in `tools/build-seo.js` (`BASE`), `index.html` and `policies.html`.

At domain cutover: point thewanderlustexplorers.com at this Vercel project, verify it in Google Search Console, submit `sitemap.xml`, and spot-check a few old `/package-details/...` URLs redirect.

## Photos

Every photo on the site is self-hosted in `assets/photos` (WebP at 640, 1080 and 1600px, cached for a year), not loaded from Unsplash. `data/photos.js` lists them with a tiny blurred preview each; `SiteData.img` uses the local copy and falls back to Unsplash only for a photo that hasn't been built yet (for example one just added in the admin).

**After adding or changing a photo** (in `data/site.js` or `index.html`), run, then rebuild the SEO pages and push:

```
node tools/build-photos.js
```

It needs `curl`, `sips` (built into macOS) and `cwebp` (`brew install webp`). Originals are kept in `tools/.photo-cache` (not uploaded) so reruns only fetch new photos.

## Phones

- The partner rails are moved by script, not CSS animation, and have painted edge fades instead of a CSS mask: iOS WebKit (Safari and Chrome on iPhone) fails to draw either.
- On phones the contrail plane is off, the map has fewer dots and the frosted-glass blur is lighter; the card photos don't drift on touch screens. Elsewhere the contrail skips frames when nothing has moved.
- The Asia loop has a "Skip the journey" button that jumps past the pinned section.

## Policies

The four policies were copied word for word from the current thewanderlustexplorers.com. They still describe flight, hotel and bus bookings, so the client should review them before launch. Edit them in the admin under Policies: a line starting with `## ` is a heading, `- ` is a bullet, and emails and 10-digit phone numbers become links.

## Signature motion

- **The contrail:** the plane from the logo takes off from the "W" on the loading screen, then flies down the whole page as you scroll, banking into turns with a fading teal contrail. It hands over to the map's plane in the Asia loop section and lands into the footer logo. It runs on a screen-sized layer, so it stays light on phones.
- **Flying through clouds:** hero slides change inside a cloud bank generated on a canvas in the browser (no extra download).
- **Chase-camera map:** the Asia loop map is tilted in 3D with the plane's shadow on the ground.
- Visitors with "reduce motion" switched on get calm, instant transitions instead.
