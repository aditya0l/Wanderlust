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
| `account.html`, `account.js` | Customer account: phone OTP / Google sign-in, overview, trips, wallet, visa status, profile and saved travellers |
| `account-data.js` | The account data layer. Runs on sample data in the browser today; swap its functions for Firebase calls to go live |
| `data/site.js` | All editable content: hero slides, packages and prices, music per place, popular searches, partners. Edited through the admin panel |
| `site-data.js` | Shared data layer for content, uploads and enquiries. The one file to switch to Firebase |
| `admin.html`, `admin.js` | Admin panel: packages and prices, hero slides, music uploads, partners, popular searches, enquiries, publish. Demo passcode `wanderlust` |
| `assets/audio/` | Licensed music files per place (see the README inside) |
| `assets/` | Logo cut-outs (ink and light versions of the full logo, the W mark and the wordmark) and the original logo file |
| `versions/` | Earlier rounds: v1 concept pitch, v2 "window seat" hero with 3D globe, v3 editorial without sound |

Libraries load from CDNs: GSAP 3.12.5 (ScrollTrigger, Flip) and Lenis 1.1.13. Photos are from Unsplash.

## Before launch

- Prices for Ladakh, Maldives, Kerala, Bali and Swiss Alps are placeholders; Manali, Jaipur, Golden Triangle, Dubai and Singapore come from the current site.
- Two of the four reviews are marked as samples. Connect real Google reviews.
- The soundscapes are synthesized sketches. Swap in licensed field recordings for the live site.
- When `sound.js` changes, bump the `?v=` number on its script tag in `index.html` so browsers fetch the new file.

## Account area: going live with Firebase

The account screens only talk to `AccountData` in `account-data.js`. To go live, replace each function body with Firebase calls (the planned Firestore layout is documented at the top of that file). The screens stay as they are.

- **Plan:** Blaze, with a budget alert. Phone OTP and Cloud Functions are not available on the free Spark plan.
- **Wallet:** one Firestore document per credit or debit, written only by server code (Cloud Functions or an admin panel). Customers get read access only. The balance is always computed from unexpired entries.
- **Credits:** site-only, not withdrawable, not transferable, expiring after 12 months.

## Admin panel and publishing

Open `admin.html` (demo passcode `wanderlust`). Changes are saved in that browser so you can check them on the site first. To publish for everyone, go to Publish → Download site.js and replace `data/site.js` on the server. Music uploaded in the admin only plays in that browser; for the live site put files in `assets/audio/` and use the link field. With Firebase, saving publishes directly and the passcode becomes a real admin login.

## Search and enquiries

The search (top bar, the hero search box, or press `/`) matches package names, destinations, routes and trip types, understands budgets like "under ₹20,000" or "under 2 lac", and suggests popular searches. Every package has Enquire now (opens a short form, then WhatsApp with the details filled in) and Call. Enquiries are listed in the admin panel.
