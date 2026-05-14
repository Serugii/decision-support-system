import { api } from './api.js';
import { showToast } from './utils.js';
import { loadMatrix } from './matrix.js';
import { updateAnalyticsState } from './analytics.js';
import { switchToTab } from './tabs.js';

let consensusData = null;
let selectedMethod = null;

const METHOD_LABELS = {
  algebraic: 'Алгебраїчний (середнє)',
  median: 'Медіана',
  mode: 'Мода',
};

export function initConsensus() {
  document.querySelectorAll('.method-card[data-method]').forEach((card) => {
    card.addEventListener('click', () => {
      document
        .querySelectorAll('.method-card')
        .forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedMethod = card.dataset.method;

      const label = document.getElementById('selectedMethodLabel');
      label.textContent = `Обрано: ${METHOD_LABELS[selectedMethod]}`;
      label.classList.remove('hidden');

      document.getElementById('applySelectedMethodBtn').disabled = false;
    });
  });

  document
    .getElementById('calcConsensusBtn')
    .addEventListener('click', calculateAll);

  document
    .getElementById('applySelectedMethodBtn')
    .addEventListener('click', applySelected);
}

async function calculateAll() {
  const data = await api.get('/experts/aggregate/all');

  if (!data.algebraic.length && !data.median.length && !data.mode.length) {
    showToast(
      'Немає оцінок експертів. Спочатку введіть оцінки на вкладці «Експерти».',
      'error',
    );
    return;
  }

  consensusData = data;
  renderAllResults(data);
  showToast('Розрахунок виконано', 'success');
}

async function applySelected() {
  if (!selectedMethod) {
    showToast('Оберіть метод, натиснувши на одну з карток вище', 'error');
    return;
  }

  if (!consensusData) {
    const data = await api.get('/experts/aggregate/all');

    if (!data.algebraic.length && !data.median.length && !data.mode.length) {
      showToast(
        'Немає оцінок експертів. Спочатку введіть оцінки на вкладці «Експерти».',
        'error',
      );
      return;
    }
    consensusData = data;
    renderAllResults(data);
  }

  const rows = consensusData[selectedMethod];

  if (!rows || !rows.length) {
    showToast('Немає даних для обраного методу', 'error');
    return;
  }

  let applied = 0;
  for (const row of rows) {
    try {
      await api.post('/evaluations', {
        alternative_id: row.alternative_id,
        criterion_id: row.criterion_id,
        value: row.value,
      });
      applied++;
    } catch {
      // skip
    }
  }

  if (applied === 0) {
    showToast(
      'Не вдалося застосувати оцінки. Перевірте альтернативи та критерії.',
      'error',
    );
    return;
  }

  showToast(
    `«${METHOD_LABELS[selectedMethod]}» застосовано (${applied} значень). Переходимо до матриці…`,
    'success',
  );

  const updatedMatrix = await loadMatrix();
  updateAnalyticsState(updatedMatrix);

  setTimeout(() => switchToTab('matrix'), 600);
}

function renderAllResults(data) {
  const container = document.getElementById('consensusTables');
  container.innerHTML = '';

  const allSame = checkAllMethodsIdentical(data);
  if (allSame) {
    const note = document.createElement('div');
    note.className = 'consensus-note';
    note.innerHTML = `
      <span class="consensus-note-icon">ℹ️</span>
      <span>Результати всіх методів однакові. Це математично нормально при невеликій кількості експертів:
      при 2 експертах медіана = середньому, а мода при відсутності повторів теж дорівнює середньому.
      Додайте ≥3 експертів з різними оцінками, щоб побачити різницю між методами.</span>
    `;
    container.appendChild(note);
  }

  for (const [method, rows] of Object.entries(data)) {
    const section = document.createElement('div');
    section.className = 'consensus-method-section';
    section.innerHTML = `
      <h3 class="consensus-method-title">${METHOD_LABELS[method]}</h3>
      ${renderTable(rows)}
    `;
    container.appendChild(section);
  }

  document.getElementById('consensusResults').classList.remove('hidden');
}

function checkAllMethodsIdentical(data) {
  const methods = Object.keys(data);
  if (methods.length < 2) return false;
  const first = JSON.stringify(data[methods[0]].map((r) => r.value));
  return methods
    .slice(1)
    .every((m) => JSON.stringify(data[m].map((r) => r.value)) === first);
}

function renderTable(rows) {
  if (!rows.length) return '<p class="empty-hint">Немає даних</p>';

  const altNames = [...new Set(rows.map((r) => r.altName))];
  const critNames = [...new Set(rows.map((r) => r.critName))];

  let html =
    '<div class="table-scroll"><table class="result-table consensus-table"><thead><tr><th>Альтернатива</th>';
  critNames.forEach((c) => {
    html += `<th title="${c}">${c}</th>`;
  });
  html += '<th>Вихідні оцінки</th></tr></thead><tbody>';

  altNames.forEach((alt) => {
    html += `<tr><td class="alt-cell" title="${alt}">${alt}</td>`;
    critNames.forEach((crit) => {
      const cell = rows.find((r) => r.altName === alt && r.critName === crit);
      html += cell
        ? `<td title="Оцінки: ${cell.rawValues.join(', ')}">${cell.value.toFixed(2)}</td>`
        : '<td>—</td>';
    });
    const rawSummary = rows
      .filter((r) => r.altName === alt)
      .map((r) => `${r.critName}: [${r.rawValues.join(', ')}]`)
      .join(' | ');
    html += `<td class="raw-values-cell"><small>${rawSummary}</small></td></tr>`;
  });

  html += '</tbody></table></div>';
  return html;
}
