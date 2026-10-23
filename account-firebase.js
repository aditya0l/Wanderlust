/* Account data on Firebase: Google sign-in and Firestore. Same interface as the demo in account-data.js,
   which still runs when the page is opened with ?demo (for showing the screens with sample data).

   Firestore:
     users/{uid}                  profile (the customer edits this)
     users/{uid}/travellers/{id}  saved co-travellers (the customer edits these)
     users/{uid}/trips/{id}       bookings        (written by admins)
     users/{uid}/visas/{id}       visa status     (written by admins)
     users/{uid}/wallet/{id}      credit or debit (written by admins; the balance is computed, never stored) */
(() => {
  if (new URLSearchParams(location.search).has("demo") || !window.firebase || !window.FIREBASE_CONFIG) return;
  if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth(), db = firebase.firestore();
  const today = new Date(), iso = d => d.toISOString().slice(0, 10);
  const remember = v => { try { v ? localStorage.setItem("wle-signed-in", "1") : localStorage.removeItem("wle-signed-in"); } catch (e) {} };
  const me = () => { const u = auth.currentUser; if (!u) throw new Error("You're signed out. Sign in again."); return db.collection("users").doc(u.uid); };
  const list = async (name, order) => { const s = await me().collection(name).get(); const rows = s.docs.map(d => ({ id: d.id, ...d.data() })); return order ? rows.sort(order) : rows; };
  const code = name => (String(name || "WLE").replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase() || "WLE") + Math.floor(100 + Math.random() * 900);

  let profile = null;
  async function loadProfile() {
    const u = auth.currentUser, ref = me(), snap = await ref.get();
    if (snap.exists) return (profile = { phone: "", dob: "", city: "", ...snap.data() });
    profile = { name: u.displayName || "Traveller", email: u.email || "", phone: u.phoneNumber || "", dob: "", city: "", whatsappUpdates: true, referralCode: code(u.displayName), createdAt: new Date().toISOString() };
    await ref.set(profile);                       // first sign-in creates the profile
    return profile;
  }

  const friendly = e => ({
    "auth/popup-closed-by-user": "Sign-in was closed before it finished.",
    "auth/cancelled-popup-request": "Sign-in was closed before it finished.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    "auth/unauthorized-domain": "This website address isn't allowed to sign in yet. Add it under Authentication → Settings → Authorised domains.",
    "auth/operation-not-allowed": "Google sign-in isn't switched on yet in Firebase.",
    "permission-denied": "You don't have access to this.",
  })[e && e.code] || (e && e.message) || "Something went wrong. Try again.";
  const wrap = fn => async (...a) => { try { return await fn(...a); } catch (e) { throw new Error(friendly(e)); } };

  let ready;
  window.AccountData = {
    demo: false,
    ready: ready = new Promise(res => { const off = auth.onAuthStateChanged(async u => { off(); remember(!!u); if (u) { try { await loadProfile(); } catch (e) {} } res(); }); }),

    /* ---------- auth ---------- */
    isSignedIn: () => !!auth.currentUser,
    signInWithGoogle: wrap(async () => {
      const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
      try { await auth.signInWithPopup(p); }
      catch (e) { if (e.code === "auth/popup-blocked") return auth.signInWithRedirect(p); throw e; }
      await loadProfile(); remember(true); return true;
    }),
    async signOut() { profile = null; remember(false); await auth.signOut(); },

    /* ---------- profile and travellers ---------- */
    getProfile: wrap(async () => ({ ...(profile || await loadProfile()) })),
    updateProfile: wrap(async patch => {
      const allowed = ["name", "phone", "dob", "city", "whatsappUpdates"], clean = {};
      allowed.forEach(k => { if (k in patch) clean[k] = patch[k]; });
      await me().update(clean); profile = { ...profile, ...clean }; return { ...profile };
    }),
    listTravellers: wrap(() => list("travellers", (a, b) => a.name.localeCompare(b.name))),
    saveTraveller: wrap(async t => {
      if (!t.name?.trim()) throw new Error("Add the traveller's full name as it appears on their passport.");
      const { id, ...data } = t;
      if (id) await me().collection("travellers").doc(id).set(data, { merge: true });
      else await me().collection("travellers").add(data);
      return true;
    }),
    removeTraveller: wrap(id => me().collection("travellers").doc(id).delete()),

    /* ---------- trips and visas (read-only here) ---------- */
    listTrips: wrap(() => list("trips", (a, b) => String(a.start).localeCompare(String(b.start)))),
    listVisas: wrap(() => list("visas", (a, b) => String(b.updated).localeCompare(String(a.updated)))),

    listEnquiries: wrap(async () => {
      const s = await db.collection("enquiries").where("uid", "==", auth.currentUser.uid).limit(50).get();
      return s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    }),

    /* ---------- wallet (read-only here) ---------- */
    getWallet: wrap(async () => {
      const now = iso(today);
      const entries = (await list("wallet")).map(e => ({ ...e, amount: Number(e.amount) || 0 })).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const live = e => e.kind === "credit" && (!e.expires || e.expires >= now);
      const credits = entries.filter(live).reduce((s, e) => s + e.amount, 0);
      const debits = entries.filter(e => e.kind === "debit").reduce((s, e) => s + e.amount, 0);
      const soon = entries.filter(e => live(e) && e.expires && (new Date(e.expires) - today) / 864e5 <= 30);
      return { balance: Math.max(0, credits - debits), entries, expiringSoon: soon, referralCode: (profile || {}).referralCode, rules: { maxPerBookingPercent: 10, expiryMonths: 12 } };
    }),

    async resetDemo() {},
  };
})();
