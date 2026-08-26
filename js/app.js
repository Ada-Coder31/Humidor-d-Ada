// js/app.js — Main application entry point
import { renderHome } from './screens/home.js';
import { renderHumidor } from './screens/humidor.js';
import { renderAddCigar } from './screens/addCigar.js';
import { renderEditCigar } from './screens/editCigar.js';
import { renderDetail } from './screens/detail.js';

// Global app state
const app = {
  currentScreen: 'home',
  currentCigarId: null,
  db: DB,
};

// ---- Router ----
async function navigate(screen, params = {}) {
  const container = document.getElementById('app');
  container.innerHTML = '';

  app.currentScreen = screen;
  app.currentCigarId = params.cigarId || null;

  try {
    switch (screen) {
      case 'home':
        await renderHome(container, app);
        break;
      case 'humidor':
        await renderHumidor(container, app);
        break;
      case 'addCigar':
        await renderAddCigar(container, app);
        break;
      case 'editCigar':
        await renderEditCigar(container, app, params.cigarId);
        break;
      case 'detail':
        await renderDetail(container, app, params.cigarId);
        break;
      default:
        await renderHome(container, app);
    }
  } catch (error) {
    console.error('Navigation error:', error);
    container.innerHTML = '<div class="error">Erreur de navigation. Veuillez réessayer.</div>';
  }
}

// ---- Global event delegation ----
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const params = {
    cigarId: target.dataset.cigarId,
    screen: target.dataset.screen,
  };

  switch (action) {
    case 'navigate':
      navigate(params.screen, params);
      break;
    case 'delete-cigar':
      deleteCigarHandler(params.cigarId);
      break;
    case 'toggle-favorite':
      toggleFavoriteHandler(params.cigarId);
      break;
    case 'add-quantity':
      changeQuantityHandler(params.cigarId, 1);
      break;
    case 'remove-quantity':
      changeQuantityHandler(params.cigarId, -1);
      break;
    case 'add-tasting':
      navigate('addCigar', { cigarId: params.cigarId });
      break;
  }
});

// ---- Event Handlers ----
async function deleteCigarHandler(cigarId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce cigare ?')) return;
  try {
    await DB.deleteCigar(cigarId);
    navigate('humidor');
  } catch (error) {
    console.error('Delete error:', error);
    alert('Erreur lors de la suppression');
  }
}

async function toggleFavoriteHandler(cigarId) {
  try {
    const cigar = await DB.getCigar(cigarId);
    if (cigar) {
      await DB.updateCigar(cigarId, { favorite: !cigar.favorite });
      navigate(app.currentScreen, { cigarId });
    }
  } catch (error) {
    console.error('Favorite toggle error:', error);
  }
}

async function changeQuantityHandler(cigarId, delta) {
  try {
    await DB.changeQuantity(cigarId, delta);
    navigate(app.currentScreen, { cigarId });
  } catch (error) {
    console.error('Quantity change error:', error);
  }
}

// ---- Initialization ----
async function initApp() {
  try {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
    }

    // Initialize database
    await DB.ensureInitialized();

    // Render home screen
    navigate('home');
  } catch (error) {
    console.error('App initialization error:', error);
    document.getElementById('app').innerHTML = '<div class="error">Erreur d\'initialisation</div>';
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
