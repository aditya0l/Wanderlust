/* Published site content. The admin panel (admin.html) edits a copy of this and can
   download a replacement file. Later this moves to Firebase; site-data.js is the only
   place that needs to change. Images: an Unsplash photo id ("photo-…"), a full URL, or
   an uploaded image (data URL). Sounds: a file path/URL, or empty to use the built-in sketch. */
window.SITE_DEFAULT = {
  version: 1,
  contact: { phone: "+91 77379 30736", whatsapp: "917737930736", email: "info@thewanderlustexplorers.com" },

  slides: [
    { name: "Pangong Tso, Ladakh", coord: "33.76° N · 78.67° E", img: "photo-1598563262148-0a9496712b44", alt: "Pangong lake under the mountains of Ladakh", sound: "ladakh" },
    { name: "Baa Atoll, Maldives", coord: "5.12° N · 73.05° E", img: "photo-1595184979141-090792f6b578", alt: "Overwater villas in a turquoise Maldives lagoon", sound: "maldives" },
    { name: "The Arabian dunes", coord: "24.83° N · 55.73° E", img: "photo-1520440718111-45fe694b330a", alt: "Wind-shaped dunes in soft light", sound: "dubai" },
    { name: "Jal Mahal, Jaipur", coord: "26.95° N · 75.85° E", img: "photo-1635929620316-d34cecc5639b", alt: "Jal Mahal palace on Man Sagar lake", sound: "rajasthan" },
  ],

  packages: [
    { id: "ladakh", name: "Ladakh", region: "Ladakh, India", sub: "Leh, Nubra and Pangong", route: "2N Leh · 2N Nubra · 2N Pangong", nights: 6, price: 28000, img: "photo-1695876670020-e2c2ac5a21ce", tags: ["india", "mountains"], badge: "June to September", sound: "ladakh", say: "Julley", means: "hello, thank you and goodbye", taste: "Butter tea and thukpa in a Leh kitchen", take: "A pashmina from the Leh bazaar", visible: true },
    { id: "maldives", name: "Maldives", region: "Maldives", sub: "Baa Atoll, overwater villa", route: "1N beach villa · 3N overwater villa", nights: 4, price: 72000, img: "photo-1609601546193-f558f1ebb385", tags: ["intl", "coast", "romantic", "visa-easy"], badge: "", sound: "maldives", say: "Shukuriyaa", means: "thank you, in Dhivehi", taste: "Mas huni and roshi for breakfast", take: "A lacquered box from Thulhaadhoo", visible: true },
    { id: "jaipur", name: "Jaipur", region: "Rajasthan, India", sub: "Amer, City Palace, Jal Mahal", route: "3N Jaipur", nights: 3, price: 14000, img: "photo-1661924326425-c14a6426d989", tags: ["india", "heritage"], badge: "", sound: "rajasthan", say: "Khamma ghani", means: "the Rajasthani welcome", taste: "Pyaaz kachori, then dal baati churma", take: "Block-printed cotton from Sanganer", visible: true },
    { id: "dubai", name: "Dubai", region: "United Arab Emirates", sub: "The city and the desert", route: "3N Dubai city · 1N desert camp", nights: 4, price: 32500, img: "photo-1624664853693-cf6419dee3bb", tags: ["intl"], badge: "Most booked", sound: "dubai", say: "Marhaba", means: "hello, in Arabic", taste: "Luqaimat with date syrup", take: "Saffron and dates from the Deira souk", visible: true },
    { id: "kerala", name: "Kerala", region: "South India", sub: "Munnar, Alleppey, Kochi", route: "2N Munnar · 1N houseboat · 2N Kochi", nights: 5, price: 22000, img: "photo-1593693397690-362cb9666fc2", tags: ["india", "coast"], badge: "", sound: "southindia", say: "Namaskaram", means: "the Malayalam greeting", taste: "Karimeen pollichathu and appam", take: "Cardamom and pepper from Munnar", visible: true },
    { id: "manali", name: "Manali", region: "Himachal Pradesh, India", sub: "Old Manali, Solang, Sethan", route: "3N Manali · 1N Sethan", nights: 4, price: 7500, img: "photo-1621114410742-f886ab91e6f4", tags: ["india", "mountains"], badge: "", sound: "himachal", say: "Ram Ram", means: "how the hills say hello", taste: "Siddu with ghee, and Himachali trout", take: "A Kullu shawl in a geometric weave", visible: true },
    { id: "kumaon", name: "Kumaon Hills", region: "Uttarakhand, India", sub: "Nainital, Almora and Kausani", route: "2N Nainital · 1N Almora · 2N Kausani", nights: 5, price: 19500, img: "photo-1608942025318-1191eeade556", tags: ["india", "mountains"], badge: "New", sound: "uttarakhand", say: "Pailaag", means: "the respectful Kumaoni greeting", taste: "Bal mithai and bhatt ki churkani", take: "Hand-woven Kumaoni shawl or Aipan art", visible: true },
    { id: "singapore", name: "Singapore", region: "Singapore", sub: "Marina Bay and Sentosa", route: "4N Singapore", nights: 4, price: 48000, img: "photo-1525625293386-3f8f99389edd", tags: ["intl"], badge: "", sound: "singapore", say: "Makan already?", means: "have you eaten? the real Singapore hello", taste: "Chicken rice at a hawker centre", take: "Kaya jam and Kopi powder", visible: true },
    { id: "golden", name: "The Golden Triangle", region: "Delhi, Agra and Jaipur, Rajasthan", sub: "Delhi, Agra, Jaipur", route: "2N Delhi · 1N Agra · 2N Jaipur", nights: 5, price: 17000, img: "photo-1524492412937-b28074a5d7da", tags: ["india", "heritage"], badge: "", sound: "rajasthan", say: "Namaste", means: "the hello that needs no translation", taste: "Chole bhature in Chandni Chowk, petha in Agra", take: "Marble inlay work from Agra", visible: true },
    { id: "bali", name: "Bali", region: "Indonesia", sub: "Ubud and Uluwatu", route: "3N Ubud · 2N Uluwatu", nights: 5, price: 45000, img: "photo-1537996194471-e657df975ab4", tags: ["intl", "coast", "romantic", "visa-easy"], badge: "", sound: "bali", say: "Om Swastiastu", means: "the Balinese Hindu greeting", taste: "Nasi campur from a warung", take: "A batik sarong from Ubud market", visible: true },
    { id: "swiss", name: "Swiss Alps", region: "Switzerland", sub: "Lauterbrunnen and Zermatt by rail", route: "3N Lauterbrunnen · 2N Zermatt · 2N Lucerne", nights: 7, price: 145000, img: "photo-1530122037265-a5f1f91d3b99", tags: ["intl", "mountains", "romantic"], badge: "", sound: "swiss", say: "Grüezi", means: "hello, in Swiss German", taste: "Fondue and rösti after a day on the rails", take: "A hand-carved cowbell", visible: true },
  ],

  /* Each place's music. `file` is a path or URL to a licensed recording (MP3/M4A).
     Leave it empty and the site plays the built-in generated sketch (`sketch`). */
  sounds: {
    ladakh:      { place: "Ladakh",          title: "Baba Latifa (instrumental)",              file: "", sketch: "ladakh" },
    rajasthan:   { place: "Rajasthan",       title: "Kesariya Banna (desi instrumental)",      file: "", sketch: "jaipur" },
    dubai:       { place: "Dubai",           title: "Habibi Come to Dubai (Drinche ft. Dalvin)", file: "", sketch: "dubai" },
    southindia:  { place: "South India",     title: "Vanchipattu (instrumental)",              file: "", sketch: "kerala" },
    himachal:    { place: "Himachal",        title: "Pahadi dhun",                             file: "", sketch: "manali" },
    maldives:    { place: "Maldives",        title: "Waves on the reef, boduberu drums",       file: "", sketch: "maldives" },
    uttarakhand: { place: "Uttarakhand",     title: "Kumaoni dhun (flute)",                    file: "", sketch: "manali" },
    singapore:   { place: "Singapore",       title: "Evening rain over Marina Bay",            file: "", sketch: "singapore" },
    bali:        { place: "Bali",            title: "Gamelan across the rice terraces",        file: "", sketch: "bali" },
    swiss:       { place: "Swiss Alps",      title: "Cowbells in an alpine meadow",            file: "", sketch: "swiss" },
  },

  /* Popular searches shown under the search box. */
  popular: ["Maldives honeymoon", "Ladakh with friends", "Kerala with parents", "Dubai with kids", "Visa-free trips", "Hill stations under ₹20,000", "Rajasthan heritage", "Bali for couples"],

  /* Partners strip. Airline logos are served from the client's existing site. */
  partners: [
    { name: "IndiGo", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/6E.svg" },
    { name: "Emirates", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/EK.svg" },
    { name: "Air India", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/AI.svg" },
    { name: "British Airways", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/BA.svg" },
    { name: "Qatar Airways", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/QR.svg" },
    { name: "flydubai", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/FZ.svg" },
    { name: "Gulf Air", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/GF.svg" },
    { name: "Thai Airways", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/TG.svg" },
    { name: "Austrian Airlines", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/OS.svg" },
    { name: "American Airlines", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/AA.svg" },
    { name: "Air Astana", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/KC.svg" },
    { name: "SpiceJet", logo: "https://flybtc.blr1.digitaloceanspaces.com/ncl/airline_svg/SG.svg" },
    { name: "Radisson Hotels", logo: "" },
  ],
};
