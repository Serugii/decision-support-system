import { initAlternatives } from './alternatives.js';
import { initCriteria } from './criteria.js';
import { loadMatrix } from './matrix.js';
import { initModal } from './modal.js';
import { showToast } from './utils.js';
import { updateAnalyticsState } from './analytics.js';

document.addEventListener('DOMContentLoaded', async () => {
  initModal();
  initAlternatives();
  initCriteria();

  const matrix = await loadMatrix();

  if (!matrix || matrix.length === 0) {
    showToast('Ще немає даних. Додайте альтернативи та критерії.', 'error');
  }

  updateAnalyticsState(matrix);
});
