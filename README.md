<!DOCTYPE html>
<HTML langue="fr">
<tête>
  <méta jeu de caractères="UTF-8">
  <méta nom="fenêtre d'affichage"contenu="largeur=largeur de l'appareil, échelle initiale=1, ajustement à la fenêtre d'affichage=couverture, échelle maximale=1">
  <titre>HUMIDEUR</titre>
  <méta nom="description"contenu="Votre cave virtuelle et carnet de dégustation">
  <lien relation="manifeste"href="manifest.json">
  <méta nom="couleur du thème"contenu="#1a1512">
  <!-- Paramètres iOS pour l'ajout à l'écran d'accueil -->
  <méta nom="application web mobile Apple compatible"contenu="Oui">
  <méta nom="style de barre d'état d'une application web mobile Apple"contenu="noir translucide">
  <méta nom="titre de l'application web mobile Apple"contenu="HUMIDEUR">
  <lien relation="icône Apple Touch"href="icônes/icône-192.png">
  <lien relation="icône"href="icônes/icône-192.png">
  <lien relation="feuille de style"href="css/style.css">
</tête>
<corps>
  <div identifiant="application"></div>
  <scénario taper="module"source="js/app.js"></scénario>
</corps>
</HTML>
    
const DB = (() => {
  const DB_NAME = 'humidorDB';
  const DB_VERSION = 1;
  let dbInstance = null;
 
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
 
  function nowISO() {
    return new Date().toISOString();
  }
 
  function open() {
    if (dbInstance) return Promise.resolve(dbInstance);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
 
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cigars')) {
          db.createObjectStore('cigars', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tastings')) {
          const store = db.createObjectStore('tastings', { keyPath: 'id' });
          store.createIndex('cigarId', 'cigarId', { unique: false });
        }
        if (!db.objectStoreNames.contains('movements')) {
          db.createObjectStore('movements', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('humidors')) {
          db.createObjectStore('humidors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'id' });
        }
      };
 
      req.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };
      req.onerror = () => reject(req.error);
    });
  }
 
  // ---- Helpers génériques sur un object store -------------------------
 
  function tx(storeName, mode) {
    return open().then((db) => db.transaction(storeName, mode).objectStore(storeName));
  }
 
  function getAll(storeName) {
    return tx(storeName, 'readonly').then((store) => new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }
 
  function get(storeName, id) {
    return tx(storeName, 'readonly').then((store) => new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }
 
  function put(storeName, value) {
    return tx(storeName, 'readwrite').then((store) => new Promise((resolve, reject) => {
      const req = store.put(value);
      req.onsuccess = () => resolve(value);
      req.onerror = () => reject(req.error);
    }));
  }
 
  function remove(storeName, id) {
    return tx(storeName, 'readwrite').then((store) => new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }));
  }
 
  function clearStore(storeName) {
    return tx(storeName, 'readwrite').then((store) => new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }));
  }
 
  function getByIndex(storeName, indexName, value) {
    return tx(storeName, 'readonly').then((store) => new Promise((resolve, reject) => {
      const req = store.index(indexName).getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }
 
  // ---- Initialisation / réglages par défaut / données de démo ---------
 
  const DEFAULT_HUMIDOR = { id: 'humidor-1', name: 'Mon Humidor', capacity: 100, targetHumidity: null, targetTemperature: null };
  const DEFAULT_SETTINGS = { id: 'settings', currency: 'EUR', defaultHumidorId: 'humidor-1' };
 
  function demoCigars() {
    const today = nowISO().slice(0, 10);
    return [
      {
        id: uid(), brand: 'Cohiba', name: 'Robusto', country: 'Cuba', vitola: 'Robusto',
        length: 12.4, ringGauge: 50, productionYear: 2023, quantity: 4,
        purchasePrice: 24, purchaseDate: today, purchaseLocation: 'Buraliste',
        humidorId: 'humidor-1', entryDate: today, favorite: true, rating: 9,
        notes: 'Rond, café et cuir. Un classique.', photo: null,
        createdAt: nowISO(), updatedAt: nowISO(), isDemo: true,
      },
      {
        id: uid(), brand: 'Montecristo', name: 'No.2', country: 'Cuba', vitola: 'Pirámide',
        length: 15.6, ringGauge: 52, productionYear: 2022, quantity: 2,
        purchasePrice: 19, purchaseDate: today, purchaseLocation: 'Voyage',
        humidorId: 'humidor-1', entryDate: today, favorite: false, rating: 8,
        notes: '', photo: null,
        createdAt: nowISO(), updatedAt: nowISO(), isDemo: true,
      },
      {
        id: uid(), brand: 'Partagás', name: 'Serie D No.4', country: 'Cuba', vitola: 'Robusto',
        length: 12.4, ringGauge: 50, productionYear: 2021, quantity: 0,
        purchasePrice: 21, purchaseDate: today, purchaseLocation: '',
        humidorId: 'humidor-1', entryDate: today, favorite: false, rating: null,
        notes: '', photo: null,
        createdAt: nowISO(), updatedAt: nowISO(), isDemo: true,
      },
    ];
  }
 
  async function ensureInitialized() {
    await open();
    const humidors = await getAll('humidors');
    if (humidors.length === 0) await put('humidors', DEFAULT_HUMIDOR);
 
    const settings = await get('settings', 'settings');
    if (!settings) await put('settings', DEFAULT_SETTINGS);
 
    const meta = await get('meta', 'seeded');
    if (!meta) {
      const existingCigars = await getAll('cigars');
      if (existingCigars.length === 0) {
        const cigars = demoCigars();
        for (const c of cigars) {
          await put('cigars', c);
          if (c.quantity > 0) {
            await addMovement({ cigarId: c.id, type: 'add', quantityChange: c.quantity, notes: 'Ajout initial (démo)' });
          }
        }
      }
      await put('meta', { id: 'seeded', value: true, date: nowISO() });
    }
  }
 
  // ---- Cigares ----------------------------------------------------------
 
  async function getCigars() {
    const list = await getAll('cigars');
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
 
  function getCigar(id) {
    return get('cigars', id);
  }
 
  async function addCigar(data) {
    const cigar = {
      id: uid(),
      brand: data.brand || '',
      name: data.name || '',
      country: data.country || '',
      vitola: data.vitola || '',
      length: data.length ? Number(data.length) : null,
      ringGauge: data.ringGauge ? Number(data.ringGauge) : null,
      productionYear: data.productionYear ? Number(data.productionYear) : null,
      quantity: Number(data.quantity) || 0,
      purchasePrice: data.purchasePrice != null && data.purchasePrice !== '' ? Number(data.purchasePrice) : null,
      purchaseDate: data.purchaseDate || null,
      purchaseLocation: data.purchaseLocation || '',
      humidorId: data.humidorId || DEFAULT_SETTINGS.defaultHumidorId,
      entryDate: data.entryDate || nowISO().slice(0, 10),
      favorite: !!data.favorite,
      rating: data.rating != null && data.rating !== '' ? Number(data.rating) : null,
      notes: data.notes || '',
      photo: data.photo || null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      isDemo: false,
    };
    await put('cigars', cigar);
    if (cigar.quantity > 0) {
      await addMovement({ cigarId: cigar.id, type: 'add', quantityChange: cigar.quantity, notes: 'Ajout initial' });
    }
    return cigar;
  }
 
  async function updateCigar(id, patch) {
    const cigar = await get('cigars', id);
    if (!cigar) return null;
    const updated = { ...cigar, ...patch, updatedAt: nowISO() };
    await put('cigars', updated);
    return updated;
  }
 
  async function deleteCigar(id) {
    await remove('cigars', id);
    const movements = await getAll('movements');
    for (const m of movements.filter((m) => m.cigarId === id)) await remove('movements', m.id);
    const tastings = await getAll('tastings');
    for (const t of tastings.filter((t) => t.cigarId === id)) await remove('tastings', t.id);
  }
 
  async function changeQuantity(id, delta, type) {
    const cigar = await get('cigars', id);
    if (!cigar) return null;
    const next = Math.max(0, cigar.quantity + delta);
    const applied = next - cigar.quantity;
    cigar.quantity = next;
    cigar.updatedAt = nowISO();
    await put('cigars', cigar);
    if (applied !== 0) {
      await addMovement({ cigarId: id, type: type || (applied > 0 ? 'add' : 'consume'), quantityChange: applied });
    }
    return cigar;
  }
 
  // ---- Mouvements (historique) -------------------------------------------
 
  async function addMovement(data) {
    const movement = {
      id: uid(),
      cigarId: data.cigarId,
      type: data.type,
      quantityChange: data.quantityChange || 0,
      date: nowISO(),
      notes: data.notes || '',
    };
    await put('movements', movement);
    return movement;
  }
 
  async function getMovements(limit) {
    const all = await getAll('movements');
    all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return limit ? all.slice(0, limit) : all;
  }
 
  // ---- Dégustations -------------------------------------------------------
 
  async function addTasting(data) {
    const tasting = {
      id: uid(),
      cigarId: data.cigarId,
      date: data.date || nowISO(),
      duration: data.duration || null,
      rating: data.rating != null && data.rating !== '' ? Number(data.rating) : null,
      draw: data.draw || null,
      burn: data.burn || null,
      strength: data.strength || null,
      aromas: data.aromas || [],
      notes: data.notes || '',
    };
    await put('tastings', tasting);
    await addMovement({ cigarId: data.cigarId, type: 'tasting', quantityChange: 0, notes: 'Dégustation enregistrée' });
    return tasting;
  }
 
  async function getTastings() {
    const all = await getAll('tastings');
    all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return all;
  }
 
  function getTasting(id) {
    return get('tastings', id);
  }
 
  function getTastingsForCigar(cigarId) {
    return getByIndex('tastings', 'cigarId', cigarId);
  }
 
  // ---- Humidors -------------------------------------------------------------
 
  function getHumidors() {
    return getAll('humidors');
  }
 
  async function updateHumidor(id, patch) {
    const h = await get('humidors', id);
    if (!h) return null;
    const updated = { ...h, ...patch };
    await put('humidors', updated);
    return updated;
  }
 
  // ---- Réglages ---------------------------------------------------------------
 
  async function getSettings() {
    const s = await get('settings', 'settings');
    return s || DEFAULT_SETTINGS;
  }
 
  async function updateSettings(patch) {
    const s = await getSettings();
    const updated = { ...s, ...patch };
    await put('settings', updated);
    return updated;
  }
 
  // ---- Export / import / réinitialisation --------------------------------------
 
  async function exportAll() {
    const [cigars, tastings, movements, humidors, settings] = await Promise.all([
      getAll('cigars'), getAll('tastings'), getAll('movements'), getAll('humidors'), getSettings(),
    ]);
    return JSON.stringify({ version: DB_VERSION, exportedAt: nowISO(), cigars, tastings, movements, humidors, settings }, null, 2);
  }
 
  async function importAll(jsonString) {
    const parsed = JSON.parse(jsonString);
    await Promise.all(['cigars', 'tastings', 'movements', 'humidors'].map(clearStore));
    for (const c of parsed.cigars || []) await put('cigars', c);
    for (const t of parsed.tastings || []) await put('tastings', t);
    for (const m of parsed.movements || []) await put('movements', m);
    for (const h of parsed.humidors || []) await put('humidors', h);
    if (parsed.settings) await put('settings', { ...parsed.settings, id: 'settings' });
    await put('meta', { id: 'seeded', value: true, date: nowISO() });
  }
 
  async function clearDemoData() {
    const cigars = await getAll('cigars');
    const demo = cigars.filter((c) => c.isDemo);
    for (const c of demo) await deleteCigar(c.id);
  }
 
  async function resetAll() {
    await Promise.all(['cigars', 'tastings', 'movements', 'humidors', 'settings', 'meta'].map(clearStore));
    await put('humidors', DEFAULT_HUMIDOR);
    await put('settings', DEFAULT_SETTINGS);
    await put('meta', { id: 'seeded', value: true, date: nowISO() });
  }
 
  return {
    ensureInitialized,
    getCigars, getCigar, addCigar, updateCigar, deleteCigar, changeQuantity,
    addMovement, getMovements,
    addTasting, getTastings, getTasting, getTastingsForCigar,
    getHumidors, updateHumidor,
    getSettings, updateSettings,
    exportAll, importAll, clearDemoData, resetAll,
  };
})();
