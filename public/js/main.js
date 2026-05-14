import { initAlternatives } from './alternatives.js';
import { initCriteria } from './criteria.js';
import { loadMatrix } from './matrix.js';
import { initModal } from './modal.js';
import { showToast } from './utils.js';
import { updateAnalyticsState } from './analytics.js';
import { initCsvImport } from './csv-import.js';
import { initExport } from './export.js';
import { initTabs } from './tabs.js';
import { initExperts } from './experts.js';
import { initConsensus } from './consensus.js';
import { initRules } from './rules.js';

document.addEventListener('DOMContentLoaded', async () => {
  initModal();
  initTabs();
  initAlternatives();
  initCriteria();
  initCsvImport();
  initExport();
  initExperts();
  initConsensus();
  initRules();

  const matrix = await loadMatrix();

  if (!matrix || matrix.length === 0) {
    showToast('Ще немає даних. Почніть з вкладки «Модель».', 'error');
  }

  updateAnalyticsState(matrix);
});
