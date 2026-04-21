import { api } from './api.js';
import { showToast } from './utils.js';
import {
  setAnalyticsResult,
  showExportButton,
  hideExportButton,
} from './export.js';

const btn = document.getElementById('analyze-btn');
const resultDiv = document.getElementById('analytics-result');

export function checkMatrixFilled(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return false;

  for (const row of matrix) {
    if (!row.criteria) return false;

    const values = Object.values(row.criteria);

    for (const item of values) {
      if (
        item.value === null ||
        item.value === undefined ||
        item.value === '' ||
        isNaN(Number(item.value))
      ) {
        return false;
      }
    }
  }

  return true;
}

export async function updateAnalyticsState(matrix) {
  const alternatives = await api.get('/alternatives');
  const criteria = await api.get('/criteria');

  const hasBasicData =
    alternatives.length > 0 &&
    criteria.length > 0 &&
    Array.isArray(matrix) &&
    matrix.length > 0;

  const isMatrixFilled = checkMatrixFilled(matrix);

  btn.disabled = !(hasBasicData && isMatrixFilled);

  hideExportButton();
  resultDiv.innerHTML = '';
}

btn.addEventListener('click', async () => {
  const alternatives = await api.get('/alternatives');
  const criteria = await api.get('/criteria');
  const matrix = await api.get('/matrix');

  if (!alternatives.length || !criteria.length || !matrix.length) {
    showToast(
      'Немає даних для аналізу. Заповніть альтернативи, критерії та матрицю.',
    );
    return;
  }

  const inputsValid = validateAllMatrixInputs();

  if (!inputsValid) {
    showToast('Заповніть всі поля коректними значеннями (0–10)');
    return;
  }

  if (!checkMatrixFilled(matrix)) {
    showToast('Матриця заповнена не повністю');
    return;
  }

  const data = await api.get('/analyze');

  setAnalyticsResult(data);

  resultDiv.innerHTML = `
    <div class="result-section">
        <h2>Адитивна згортка</h2>
        ${render(data.additive)}
    </div>

    <div class="result-section">
        <h2>Мультиплікативна згортка</h2>
        ${render(data.multiplicative)}
    </div>

    <div class="result-section">
        <h2>Обережна стратегія</h2>
        ${render(data.cautious)}
    </div>
  `;

  showExportButton();
});

function render(arr) {
  if (!arr || !arr.length) return '<p>Немає даних</p>';

  const maxScore = Math.max(...arr.map((a) => a.score));

  const rows = arr
    .map((a) => {
      const isBest = a.score === maxScore;

      return `
        <tr class="${isBest ? 'best-row' : ''}">
          <td>${a.alt}</td>
          <td>${a.score.toFixed(3)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="result-table">
      <thead>
        <tr>
          <th>Альтернатива</th>
          <th>Оцінка</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export function validateAllMatrixInputs() {
  const inputs = document.querySelectorAll('#matrixTable input');

  let isValid = true;

  inputs.forEach((input) => {
    input.classList.remove('input-error');

    const value = input.value.trim();
    const num = Number(value);

    const isInvalid = value === '' || isNaN(num) || num < 0 || num > 10;

    if (isInvalid) {
      input.classList.add('input-error');
      isValid = false;
    }
  });

  return isValid;
}
