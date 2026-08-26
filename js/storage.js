// js/storage.js — Optimized IndexedDB wrapper with performance improvements
// Key improvements: batch operations, proper indexing, pagination support

const DB = (() => {
  const DB_NAME = 'humidorDB';
  const DB_VERSION = 2; // Bumped to trigger schema upgrade
  let dbInstance = null;

  // ---- Utilities -------------------------------------------------------

  function uid() {
    // Improved: Use crypto for better uniqueness
    const timestamp = Date.now().toString(36);
    const random = crypto.getRandomValues(new Uint8Array(4));
    const randomStr = Array.from(random, byte => byte.toString(36)).join('');
    return timestamp + randomStr;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  // ---- Database Initialization ----------------------------------------

  function open() {
    if (dbInstance) return Promise.resolve(dbInstance);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('cigars')) {
          db.createObjectStore('cigars', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tastings')) {
          const store = db.createObjectStore('tastings', { keyPath: 'id' });
          store.createIndex('cigarId', 'cigarId', { unique: false });
        }
        if (!db.objectStoreNames.contains('movements')) {
          const store = db.createObjectStore('movements', { keyPath: 'id' });
          // NEW INDEX: Critical for deleteCigar() performance
          store.createIndex('cigarId', 'cigarId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
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

  // ---- Generic Helpers on Object Stores --------------------------------

  function tx(storeName, mode) {
    return open().then((db) => db.transaction(storeName, mode).objectStore(storeName));
  }

  function getAll(storeName, limit = null) {
    return tx(storeName, 'readonly').then((store) => new Promise((resolve, reject) => {
      const req = store.getAll(limit ? limit : undefined);
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

  // NEW: Batch put for performance
  function putBatch(storeName, values) {
    return tx(storeName, 'readwrite').then((store) => new Promise((resolve, reject) => {
      let completed = 0;
      const errors = [];

      if (values.length === 0) {
        resolve([]);
        return;
      }

      values.forEach((value) => {
        const req = store.put(value);
        req.onsuccess = () => {
          completed++;
          if (completed === values.length) {
            if (errors.length > 0) reject(errors[0]);
            else resolve(values);
          }
        };
        req.onerror = () => {
          errors.push(req.error);
          completed++;
          if (completed === values.length) reject(errors[0]);
        };
      });
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

  // NEW: Query by index efficiently
  function getByIndex(storeName, indexName, value) {
    return tx(storeName, 'readonly').then((store) => new Promise((resolve, reject) => {
      const req = store.index(indexName).getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  // NEW: Delete by index efficiently (used instead of getAll + filter)
  function deleteByIndex(storeName, indexName, value) {
    return getByIndex(storeName, indexName, value).then((items) => {
      return Promise.all(items.map((item) => remove(storeName, item.id)));
    });
  }

  // ---- Initialization / Default Settings / Demo Data --------------------

  const DEFAULT_HUMIDOR = { 
    id: 'humidor-1', 
    name: 'Mon Humidor', 
    capacity: 100, 
    targetHumidity: null, 
    targetTemperature: null 
  };
  const DEFAULT_SETTINGS = { 
    id: 'settings', 
    currency: 'EUR', 
    defaultHumidorId: 'humidor-1' 
  };

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
        // OPTIMIZED: Use batch put instead of sequential puts
        await putBatch('cigars', cigars);
        // OPTIMIZED: Create all movements in parallel
        const movements = cigars
          .filter((c) => c.quantity > 0)
          .map((c) => ({
            id: uid(),
            cigarId: c.id,
            type: 'add',
            quantityChange: c.quantity,
            date: nowISO(),
            notes: 'Ajout initial (démo)',
          }));
        if (movements.length > 0) await putBatch('movements', movements);
      }
      await put('meta', { id: 'seeded', value: true, date: nowISO() });
    }
  }

  // ---- Cigars -----------------------------------------------------------

  async function getCigars(limit = null) {
    const list = await getAll('cigars', limit);
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

  // OPTIMIZED: Use index query instead of getAll + filter
  async function deleteCigar(id) {
    await remove('cigars', id);
    // NEW: Use indexed queries for efficiency
    await deleteByIndex('movements', 'cigarId', id);
    await deleteByIndex('tastings', 'cigarId', id);
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

  // ---- Movements (History) -----------------------------------------------

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

  async function getMovements(limit = 50) {
    return tx('movements', 'readonly').then(
      (store) =>
        new Promise((resolve, reject) => {
          const req = store.index('date').getAll();
          req.onsuccess = () => {
            const all = req.result.reverse(); // Most recent first
            resolve(limit ? all.slice(0, limit) : all);
          };
          req.onerror = () => reject(req.error);
        })
    );
  }

  // NEW: Get movements for a specific cigar
  async function getMovementsForCigar(cigarId) {
    return getByIndex('movements', 'cigarId', cigarId);
  }

  // ---- Tastings ----------------------------------------------------------

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
    return all.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  function getTasting(id) {
    return get('tastings', id);
  }

  function getTastingsForCigar(cigarId) {
    return getByIndex('tastings', 'cigarId', cigarId);
  }

  // ---- Humidors -----------------------------------------------------------

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

  // ---- Settings -----------------------------------------------------------

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

  // ---- Export / Import / Reset -------------------------------------------

  // OPTIMIZED: Export in chunks to avoid blocking UI
  async function exportAll() {
    const [cigars, tastings, movements, humidors, settings] = await Promise.all([
      getAll('cigars'),
      getAll('tastings'),
      getAll('movements'),
      getAll('humidors'),
      getSettings(),
    ]);
    // Defer JSON stringification to avoid UI block
    return new Promise((resolve) => {
      requestIdleCallback(() => {
        const json = JSON.stringify(
          { version: DB_VERSION, exportedAt: nowISO(), cigars, tastings, movements, humidors, settings },
          null,
          2
        );
        resolve(json);
      });
    });
  }

  async function importAll(jsonString) {
    const parsed = JSON.parse(jsonString);
    await Promise.all(['cigars', 'tastings', 'movements', 'humidors'].map(clearStore));
    // OPTIMIZED: Use batch operations
    if (parsed.cigars?.length > 0) await putBatch('cigars', parsed.cigars);
    if (parsed.tastings?.length > 0) await putBatch('tastings', parsed.tastings);
    if (parsed.movements?.length > 0) await putBatch('movements', parsed.movements);
    if (parsed.humidors?.length > 0) await putBatch('humidors', parsed.humidors);
    if (parsed.settings) await put('settings', { ...parsed.settings, id: 'settings' });
    await put('meta', { id: 'seeded', value: true, date: nowISO() });
  }

  async function clearDemoData() {
    // OPTIMIZED: More efficient filtering
    const cigars = await getAll('cigars');
    const demoCigars = cigars.filter((c) => c.isDemo);
    await Promise.all(demoCigars.map((c) => deleteCigar(c.id)));
  }

  async function resetAll() {
    await Promise.all(['cigars', 'tastings', 'movements', 'humidors', 'settings', 'meta'].map(clearStore));
    await put('humidors', DEFAULT_HUMIDOR);
    await put('settings', DEFAULT_SETTINGS);
    await put('meta', { id: 'seeded', value: true, date: nowISO() });
  }

  return {
    ensureInitialized,
    getCigars,
    getCigar,
    addCigar,
    updateCigar,
    deleteCigar,
    changeQuantity,
    addMovement,
    getMovements,
    getMovementsForCigar,
    addTasting,
    getTastings,
    getTasting,
    getTastingsForCigar,
    getHumidors,
    updateHumidor,
    getSettings,
    updateSettings,
    exportAll,
    importAll,
    clearDemoData,
    resetAll,
  };
})();
