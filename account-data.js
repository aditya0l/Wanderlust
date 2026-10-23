/* Account data layer
   Every screen talks to `AccountData` only. Today it runs on sample data kept in
   localStorage (demo mode). To go live, replace the bodies of these functions with
   Firebase calls; the screens do not change.

   Planned Firebase shape (Firestore):
     users/{uid}                      profile: name, phone, email, dob, city, prefs
     users/{uid}/travellers/{id}      saved co-travellers
     users/{uid}/trips/{id}           bookings, written by staff or the booking engine
     users/{uid}/visas/{id}           visa applications and their status
     users/{uid}/wallet/{entryId}     ledger: one document per credit or debit,
                                      written ONLY by server code (Cloud Functions / admin);
                                      security rules give the user read access only.
   The wallet balance is always the sum of unexpired ledger entries, never a stored number. */
(() => {
  const KEY = "wle-demo-account-v1";
  const delay = (ms = 220) => new Promise(r => setTimeout(r, ms));
  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = n => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

  const SEED = {
    profile: { name: "Aditi Sharma", phone: "+91 98100 24567", email: "aditi.sharma@example.com", dob: "1994-03-12", city: "New Delhi", whatsappUpdates: true, referralCode: "ADITI500" },
    travellers: [
      { id: "t1", name: "Rohan Sharma", relation: "Spouse", dob: "1992-07-21", passport: "Z4821936", passportExpiry: "2031-05-18" },
      { id: "t2", name: "Meera Sharma", relation: "Mother", dob: "1966-11-02", passport: "", passportExpiry: "" },
    ],
    trips: [
      { id: "WLE-24871", title: "Bali Honeymoon", place: "Ubud and Uluwatu, Indonesia", start: addDays(38), end: addDays(44), travellers: 2, status: "confirmed",
        img: "photo-1537996194471-e657df975ab4", paid: 90000, total: 90000,
        items: [
          { type: "flight", label: "DEL → DPS · IndiGo 6E 1603", when: "Day 1 · 22:40" },
          { type: "hotel", label: "Ubud jungle villa with pool", when: "Nights 1–3" },
          { type: "hotel", label: "Uluwatu cliff resort", when: "Nights 4–5" },
          { type: "transfer", label: "Private car, airport and between hotels", when: "Included" },
          { type: "flight", label: "DPS → DEL · IndiGo 6E 1604", when: "Day 6 · 09:15" } ] },
      { id: "WLE-25102", title: "Ladakh with friends", place: "Leh, Nubra and Pangong", start: addDays(112), end: addDays(118), travellers: 4, status: "payment-due",
        img: "photo-1695876670020-e2c2ac5a21ce", paid: 40000, total: 112000,
        items: [
          { type: "flight", label: "DEL → IXL · Air India AI 445", when: "Day 1 · 06:10" },
          { type: "hotel", label: "Leh boutique stay", when: "Nights 1–2" },
          { type: "hotel", label: "Nubra desert camp", when: "Nights 3–4" },
          { type: "hotel", label: "Pangong lakeside camp", when: "Nights 5–6" } ] },
      { id: "WLE-21930", title: "Pink City Royale", place: "Jaipur, Rajasthan", start: addDays(-140), end: addDays(-137), travellers: 3, status: "completed",
        img: "photo-1661924326425-c14a6426d989", paid: 42000, total: 42000,
        items: [ { type: "train", label: "Vande Bharat · New Delhi → Jaipur", when: "Day 1 · 06:00" }, { type: "hotel", label: "Heritage haveli near Hawa Mahal", when: "Nights 1–3" } ] },
    ],
    visas: [
      { id: "V-3381", country: "Indonesia", type: "e-Visa on Arrival", applicant: "Aditi Sharma", step: 3, steps: ["Documents received", "Checked by our team", "Submitted", "Approved"], updated: addDays(-2), note: "Approval expected within 2 working days." },
      { id: "V-3382", country: "Indonesia", type: "e-Visa on Arrival", applicant: "Rohan Sharma", step: 1, steps: ["Documents received", "Checked by our team", "Submitted", "Approved"], updated: addDays(-1), note: "Passport scan is blurred. Please send a clearer photo on WhatsApp." },
    ],
    wallet: [
      { id: "w1", kind: "credit", source: "Welcome bonus", amount: 250, date: addDays(-160), expires: addDays(205) },
      { id: "w2", kind: "credit", source: "Cashback · Pink City Royale", amount: 1260, date: addDays(-136), expires: addDays(229) },
      { id: "w3", kind: "credit", source: "Referral · Kabir joined with your code", amount: 500, date: addDays(-60), expires: addDays(305) },
      { id: "w4", kind: "debit", source: "Used on Bali Honeymoon", amount: 1000, date: addDays(-21) },
      { id: "w5", kind: "credit", source: "Festive offer", amount: 2000, date: addDays(-12), expires: addDays(18) },
    ],
  };

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
  const save = db => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  let db = load() || structuredClone(SEED);
  const session = { get: () => { try { return localStorage.getItem(KEY + ":session") === "1"; } catch (e) { return false; } },
                    set: v => { try { v ? localStorage.setItem(KEY + ":session", "1") : localStorage.removeItem(KEY + ":session"); } catch (e) {} } };
  let signedIn = session.get();

  window.AccountData = {
    demo: true,
    /* ---------- auth (Firebase: signInWithPhoneNumber / signInWithPopup(GoogleAuthProvider)) ---------- */
    isSignedIn: () => signedIn,
    async sendCode(phone) { await delay(600); if (!/^\+?\d[\d\s]{9,}$/.test(phone)) throw new Error("Enter a 10-digit mobile number."); return { verificationId: "demo" }; },
    async verifyCode(_v, code) { await delay(500); if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from the SMS."); signedIn = true; session.set(true); return true; },
    async signInWithGoogle() { await delay(500); signedIn = true; session.set(true); return true; },
    async signOut() { await delay(150); signedIn = false; session.set(false); },

    /* ---------- profile and travellers ---------- */
    async getProfile() { await delay(); return { ...db.profile }; },
    async updateProfile(patch) { await delay(); db.profile = { ...db.profile, ...patch }; save(db); return { ...db.profile }; },
    async listTravellers() { await delay(); return db.travellers.map(t => ({ ...t })); },
    async saveTraveller(t) {
      await delay();
      if (!t.name?.trim()) throw new Error("Add the traveller's full name as it appears on their passport.");
      if (t.id) db.travellers = db.travellers.map(x => x.id === t.id ? { ...x, ...t } : x);
      else db.travellers.push({ ...t, id: "t" + Date.now() });
      save(db); return true;
    },
    async removeTraveller(id) { await delay(); db.travellers = db.travellers.filter(x => x.id !== id); save(db); },

    /* ---------- trips and visas (read-only for customers) ---------- */
    async listTrips() { await delay(); return db.trips.map(t => ({ ...t })); },
    async listVisas() { await delay(); return db.visas.map(v => ({ ...v })); },
    async listEnquiries() { await delay(); return [{ id: "e1", trip: "Kerala Backwaters", month: "December", travellers: "4", status: "contacted", at: new Date(today - 2 * 864e5).toISOString() }]; },

    /* ---------- wallet (read-only for customers; credits are written by server code) ---------- */
    async getWallet() {
      await delay();
      const now = iso(today);
      const entries = [...db.wallet].sort((a, b) => b.date.localeCompare(a.date));
      const credits = entries.filter(e => e.kind === "credit" && (!e.expires || e.expires >= now)).reduce((s, e) => s + e.amount, 0);
      const debits = entries.filter(e => e.kind === "debit").reduce((s, e) => s + e.amount, 0);
      const soon = entries.filter(e => e.kind === "credit" && e.expires && e.expires >= now && (new Date(e.expires) - today) / 864e5 <= 30);
      return { balance: Math.max(0, credits - debits), entries, expiringSoon: soon, referralCode: db.profile.referralCode, rules: { maxPerBookingPercent: 10, expiryMonths: 12 } };
    },

    async resetDemo() { db = structuredClone(SEED); save(db); },
  };
})();
