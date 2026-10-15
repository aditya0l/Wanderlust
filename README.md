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
| `versions/` | Earlier rounds: v1 concept pitch, v2 "window seat" hero with 3D globe, v3 editorial without sound |

Libraries load from CDNs: GSAP 3.12.5 (ScrollTrigger, Flip) and Lenis 1.1.13. Photos are from Unsplash.

## Before launch

- Prices for Ladakh, Maldives, Kerala, Bali and Swiss Alps are placeholders; Manali, Jaipur, Golden Triangle, Dubai and Singapore come from the current site.
- Two of the four reviews are marked as samples. Connect real Google reviews.
- The soundscapes are synthesized sketches. Swap in licensed field recordings for the live site.
- When `sound.js` changes, bump the `?v=` number on its script tag in `index.html` so browsers fetch the new file.
